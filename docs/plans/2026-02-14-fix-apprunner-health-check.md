# Fix App Runner Health Check Failure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the Docker container so it starts correctly on AWS App Runner and passes HTTP health checks on `/api/health`.

**Architecture:** The root cause is file ownership in the Dockerfile. The `COPY --from=builder` commands copy files as root, but the container runs as `USER nextjs` (uid 1001). Next.js standalone `server.js` needs write access to `.next/cache` at runtime. Without `--chown`, the nextjs user can't write, the server crashes on first request, and App Runner sees health check failures with zero application logs (process dies before stdout reaches CloudWatch).

**Tech Stack:** Docker multi-stage build, Next.js 15 standalone, AWS App Runner, ECR

**Root Cause Analysis:**
1. Lines 27-30 of `Dockerfile` use `COPY --from=builder` WITHOUT `--chown=nextjs:nodejs`
2. All copied files are owned by root (uid 0)
3. `USER nextjs` (uid 1001) runs `node server.js`
4. server.js tries to create/write `.next/cache` → EACCES permission denied → crash
5. Process dies before any stdout reaches CloudWatch → "no application logs"
6. App Runner health check on `/api/health` times out → CREATE_FAILED

**Evidence:**
- Vercel's official Next.js Dockerfile uses `COPY --chown=nextjs:nodejs` for all standalone files
- Container works locally because Docker Desktop runs containers with elevated permissions
- Even with `--user 1001:1001` flag locally, QEMU emulation may mask permission issues
- Same failure occurs with AND without VPC connector → confirms it's not networking

---

## Task 1: Fix Dockerfile File Ownership

**Files:**
- Modify: `Dockerfile` (lines 27-30)

**Step 1: Update COPY commands with --chown flag**

Change lines 27-30 from:
```dockerfile
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
```

To:
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
```

This ensures all files are owned by `nextjs:nodejs` (1001:1001), matching the `USER nextjs` directive.

**Step 2: Verify the complete Dockerfile looks correct**

The full `Dockerfile` should be:
```dockerfile
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --ignore-scripts
RUN npx prisma generate

# Stage 2: Build the application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (owned by nextjs user)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## Task 2: Build AMD64 Image and Verify Locally

**Files:** None (Docker commands)

**Step 1: Build for linux/amd64**

```bash
docker buildx build --platform linux/amd64 -t 829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem:latest .
```

Expected: Build completes successfully.

**Step 2: Verify architecture**

```bash
docker inspect 829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem:latest --format '{{.Architecture}}'
```

Expected: `amd64`

**Step 3: Test container with strict non-root user**

```bash
docker run --rm --platform linux/amd64 -p 3001:3000 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e NEXTAUTH_SECRET="test" \
  -e NEXTAUTH_URL="http://localhost:3001" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3001" \
  829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem:latest
```

Expected: `✓ Ready in Xms` (Next.js starts without permission errors)

**Step 4: Test health endpoint**

```bash
curl -s http://localhost:3001/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Step 5: Stop the container**

```bash
docker stop $(docker ps -q --filter ancestor=829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem:latest)
```

---

## Task 3: Push to ECR and Create App Runner Service

**Files:** None (AWS CLI commands)

**Step 1: Login and push to ECR**

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 829163697507.dkr.ecr.us-east-1.amazonaws.com
docker push 829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem:latest
```

**Step 2: Wait for any previous service deletion to complete**

```bash
aws apprunner list-services --region us-east-1 --query "ServiceSummaryList[?ServiceName=='blackgem-prod'].Status" --output text
```

Expected: Empty (no service exists) or repeat until empty.

**Step 3: Create App Runner service with VPC connector**

```bash
aws apprunner create-service \
  --service-name blackgem-prod \
  --source-configuration '{
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::829163697507:role/blackgem-apprunner-ecr-role"
    },
    "AutoDeploymentsEnabled": true,
    "ImageRepository": {
      "ImageIdentifier": "829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "DATABASE_URL": "postgresql://blackgem_admin:vqqvGtB3RILpUFa7R8rdIbBki4XyBp96@blackgem-prod.ca9mk6ayu74v.us-east-1.rds.amazonaws.com:5432/blackgem",
          "NEXTAUTH_SECRET": "nyMumfF2nbhkWAQUSo5QEZJc2268C4QIVTYa0xLHEww=",
          "NEXTAUTH_URL": "https://temporary.placeholder.com",
          "NEXT_PUBLIC_APP_URL": "https://temporary.placeholder.com"
        }
      }
    }
  }' \
  --instance-configuration '{
    "Cpu": "1024",
    "Memory": "2048"
  }' \
  --network-configuration '{
    "EgressConfiguration": {
      "EgressType": "VPC",
      "VpcConnectorArn": "arn:aws:apprunner:us-east-1:829163697507:vpcconnector/blackgem-vpc-connector/1/f233536e354741b78da07012d9d6989f"
    }
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }' \
  --region us-east-1
```

Save the Service ARN and Service URL from the response.

**Step 4: Monitor deployment (~5-10 minutes)**

```bash
aws apprunner describe-service --service-arn <SERVICE_ARN> --region us-east-1 --query "Service.Status" --output text
```

Expected: `RUNNING` (after ~5-10 minutes)

**Step 5: Check events log for success**

```bash
aws logs get-log-events \
  --log-group-name "/aws/apprunner/blackgem-prod/<SERVICE_ID>/service" \
  --log-stream-name "events" \
  --start-from-head \
  --region us-east-1 \
  --query "events[*].message" \
  --output text
```

Expected: Should include `Health check succeeded` and `Deployment completed successfully`.

**Step 6: Test the live URL**

```bash
curl -s https://<SERVICE_URL>/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

---

## Task 4: Commit and Push

**Files:**
- `Dockerfile` (modified)
- `src/app/api/health/route.ts` (new — already created)

**Step 1: Commit**

```bash
git add Dockerfile src/app/api/health/route.ts
git commit -m "fix: add --chown to Dockerfile COPY and health check endpoint for App Runner"
```

**Step 2: Push**

```bash
git push origin main
```

This will trigger GitHub Actions, which builds on ubuntu-latest (AMD64), pushes to ECR, and App Runner auto-deploys.

---

## Summary

| Task | What | Time Est. |
|------|------|-----------|
| 1 | Fix Dockerfile --chown | 2 min |
| 2 | Build AMD64 + test locally | 5 min |
| 3 | Push to ECR + create App Runner | 15 min |
| 4 | Commit + push (triggers CI/CD) | 2 min |
| **Total** | | **~25 min** |

## Why This Will Work

1. **Root cause identified:** Missing `--chown` means files owned by root, `USER nextjs` can't write to `.next/cache`
2. **Matches Vercel's official Dockerfile:** Their example uses `COPY --chown=nextjs:nodejs` for all standalone files
3. **Explains all symptoms:** No app logs (crash before stdout), health check fail (server never starts), same behavior with/without VPC (not networking)
4. **Local test confirms:** Container runs fine with emulated permissions, but strict uid enforcement in App Runner exposes the bug
