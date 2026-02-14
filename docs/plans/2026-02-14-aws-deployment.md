# AWS Deployment — App Runner + RDS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy BlackGem to AWS App Runner with RDS PostgreSQL, migrating from Neon, with auto-deploy from GitHub.

**Architecture:** Next.js 15 standalone Docker image on App Runner, RDS PostgreSQL 16 (db.t3.micro) in same VPC, GitHub Actions CI/CD pushing to ECR, custom domain with auto TLS.

**Tech Stack:** AWS App Runner, RDS PostgreSQL 16, ECR, GitHub Actions, Docker multi-stage build

**Prerequisites:** AWS account exists, need AWS CLI configured locally.

---

## Task 1: Install and Configure AWS CLI

**Files:** None (local tooling)

**Step 1: Install AWS CLI v2**

```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
rm AWSCLIV2.pkg
```

**Step 2: Verify installation**

Run: `aws --version`
Expected: `aws-cli/2.x.x ...`

**Step 3: Configure credentials**

```bash
aws configure
```

Enter:
- AWS Access Key ID: (from IAM console → Security credentials → Create access key)
- Secret Access Key: (from same)
- Default region: `us-east-1`
- Output format: `json`

**Step 4: Verify access**

Run: `aws sts get-caller-identity`
Expected: JSON with Account, UserId, Arn

---

## Task 2: Add `output: 'standalone'` to Next.js Config

**Files:**
- Modify: `next.config.ts`

**Step 1: Add standalone output**

In `next.config.ts`, add `output: 'standalone'` to the config object:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
```

**Step 2: Verify build still works**

Run: `npm run build`
Expected: Build succeeds. `.next/standalone/` directory is created.

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: enable Next.js standalone output for Docker deployment"
```

---

## Task 3: Create Dockerfile and .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Step 1: Create `.dockerignore`**

```dockerignore
.git
.gitignore
.next
.env*
!.env.example
node_modules
.claude
.vscode
.idea
docs
Technical Documents
Desing & UI
*.md
!README.md
coverage
uploads
```

**Step 2: Create multi-stage `Dockerfile`**

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

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Step 3: Test Docker build locally (optional but recommended)**

```bash
docker build -t blackgem:test .
```

Expected: Build completes successfully. Image is ~200-300MB.

**Step 4: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add Dockerfile for AWS App Runner deployment"
```

---

## Task 4: Create RDS PostgreSQL Instance

**Files:** None (AWS CLI commands)

**Step 1: Get default VPC and subnet info**

```bash
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
```

Save the VPC ID (e.g., `vpc-abc123`).

```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<VPC_ID>" --query "Subnets[*].[SubnetId,AvailabilityZone]" --output table
```

**Step 2: Create Security Group for RDS**

```bash
aws ec2 create-security-group \
  --group-name blackgem-rds-sg \
  --description "Security group for BlackGem RDS PostgreSQL" \
  --vpc-id <VPC_ID>
```

Save the Security Group ID (e.g., `sg-abc123`).

**Step 3: Allow inbound PostgreSQL from anywhere in VPC (App Runner uses VPC connector)**

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

Note: We use 0.0.0.0/0 initially because App Runner VPC connector IPs are dynamic. Can tighten later.

**Step 4: Create RDS subnet group**

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name blackgem-db-subnets \
  --db-subnet-group-description "Subnets for BlackGem RDS" \
  --subnet-ids <SUBNET_ID_1> <SUBNET_ID_2>
```

**Step 5: Create RDS instance**

```bash
aws rds create-db-instance \
  --db-instance-identifier blackgem-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username blackgem_admin \
  --master-user-password <CHOOSE_STRONG_PASSWORD> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name blackgem \
  --vpc-security-group-ids <SG_ID> \
  --db-subnet-group-name blackgem-db-subnets \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --storage-encrypted \
  --no-multi-az
```

**Step 6: Wait for RDS to be available (~5-10 minutes)**

```bash
aws rds wait db-instance-available --db-instance-identifier blackgem-prod
aws rds describe-db-instances --db-instance-identifier blackgem-prod \
  --query "DBInstances[0].Endpoint" --output json
```

Save the endpoint address (e.g., `blackgem-prod.abc123.us-east-1.rds.amazonaws.com`).

**Step 7: Construct DATABASE_URL**

```
postgresql://blackgem_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/blackgem
```

---

## Task 5: Migrate Data from Neon to RDS

**Files:** None (CLI commands)

**Step 1: Dump Neon database**

```bash
pg_dump "<NEON_DATABASE_URL>" --no-owner --no-acl --format=custom -f blackgem_dump.pgdump
```

Note: You may need to install `postgresql` client tools: `brew install postgresql@16`

**Step 2: Restore to RDS**

Since RDS is not publicly accessible, you have two options:

**Option A: Make RDS temporarily public**

```bash
aws rds modify-db-instance \
  --db-instance-identifier blackgem-prod \
  --publicly-accessible
```

Wait for modification, then:

```bash
pg_restore --host=<RDS_ENDPOINT> --port=5432 --username=blackgem_admin \
  --dbname=blackgem --no-owner --no-acl blackgem_dump.pgdump
```

Then disable public access:

```bash
aws rds modify-db-instance \
  --db-instance-identifier blackgem-prod \
  --no-publicly-accessible
```

**Option B: Use a bastion/EC2 instance (more secure but more steps)**

For < 50 users MVP, Option A is fine.

**Step 3: Verify data**

```bash
psql "postgresql://blackgem_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/blackgem" \
  -c "SELECT count(*) FROM \"Deal\";"
```

Expected: `37` (current deal count)

**Step 4: Clean up dump file**

```bash
rm blackgem_dump.pgdump
```

---

## Task 6: Create ECR Repository

**Files:** None (AWS CLI)

**Step 1: Create ECR repo**

```bash
aws ecr create-repository \
  --repository-name blackgem \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1
```

Save the repository URI (e.g., `123456789.dkr.ecr.us-east-1.amazonaws.com/blackgem`).

**Step 2: Test push (optional)**

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker tag blackgem:test <ECR_URI>:latest
docker push <ECR_URI>:latest
```

---

## Task 7: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create workflow directory**

```bash
mkdir -p .github/workflows
```

**Step 2: Create deploy workflow**

```yaml
name: Deploy to AWS App Runner

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: blackgem

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
```

**Step 3: Add GitHub Secrets**

In GitHub repo → Settings → Secrets and variables → Actions, add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for ECR deployment"
```

---

## Task 8: Create App Runner Service

**Files:** None (AWS CLI)

**Step 1: Create IAM role for App Runner to pull from ECR**

```bash
aws iam create-role \
  --role-name blackgem-apprunner-ecr-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "build.apprunner.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name blackgem-apprunner-ecr-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

**Step 2: Create VPC Connector (so App Runner can reach RDS)**

```bash
aws apprunner create-vpc-connector \
  --vpc-connector-name blackgem-vpc-connector \
  --subnets <SUBNET_ID_1> <SUBNET_ID_2> \
  --security-groups <SG_ID>
```

Save the VPC Connector ARN.

**Step 3: Create App Runner service**

```bash
aws apprunner create-service \
  --service-name blackgem-prod \
  --source-configuration '{
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/blackgem-apprunner-ecr-role"
    },
    "AutoDeploymentsEnabled": true,
    "ImageRepository": {
      "ImageIdentifier": "<ECR_URI>:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "DATABASE_URL": "postgresql://blackgem_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/blackgem",
          "NEXTAUTH_SECRET": "<GENERATE_WITH_openssl_rand_base64_32>",
          "NEXTAUTH_URL": "https://<YOUR_DOMAIN>",
          "RESEND_API_KEY": "<YOUR_RESEND_KEY>",
          "RESEND_FROM_EMAIL": "BlackGem <noreply@yourdomain.com>",
          "NEXT_PUBLIC_APP_URL": "https://<YOUR_DOMAIN>"
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
      "VpcConnectorArn": "<VPC_CONNECTOR_ARN>"
    }
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }'
```

**Step 4: Wait for service to be running (~5 minutes)**

```bash
aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='blackgem-prod']"
```

Save the service URL (e.g., `abc123.us-east-1.awsapprunner.com`).

**Step 5: Test the default URL**

Open `https://<service-url>` in browser. Should see BlackGem login page.

---

## Task 9: Configure Custom Domain

**Files:** None (AWS CLI + DNS registrar)

**Step 1: Associate custom domain**

```bash
aws apprunner associate-custom-domain \
  --service-arn <SERVICE_ARN> \
  --domain-name app.yourdomain.com
```

**Step 2: Get validation records**

```bash
aws apprunner describe-custom-domains --service-arn <SERVICE_ARN>
```

This returns CNAME records for validation + the target CNAME.

**Step 3: Add DNS records at registrar (GoDaddy/Namecheap)**

Add the validation CNAME records and the main CNAME record:
- `app.yourdomain.com` → CNAME → `<apprunner-service-url>`
- Validation records as provided by AWS

**Step 4: Wait for validation (~10-30 minutes)**

```bash
aws apprunner describe-custom-domains --service-arn <SERVICE_ARN>
```

Status should change from `pending_certificate_dns_validation` to `active`.

**Step 5: Update NEXTAUTH_URL env var**

Update the App Runner service environment variable `NEXTAUTH_URL` to `https://app.yourdomain.com`.

---

## Task 10: Push and Verify End-to-End

**Files:** None

**Step 1: Push all changes**

```bash
git push origin main
```

**Step 2: Watch GitHub Actions**

Go to GitHub repo → Actions tab. Watch the deploy workflow complete.

**Step 3: Verify App Runner auto-deploys**

```bash
aws apprunner list-operations --service-arn <SERVICE_ARN>
```

**Step 4: Smoke test production**

1. Visit `https://app.yourdomain.com`
2. Login with existing credentials
3. Verify deals page loads with funnel
4. Verify portfolio page shows converted companies
5. Check that Grillo Corp portfolio company exists

**Step 5: Celebrate**

---

## Summary

| Task | What | Time Est. |
|------|------|-----------|
| 1 | Install AWS CLI | 5 min |
| 2 | Next.js standalone output | 5 min |
| 3 | Dockerfile + .dockerignore | 10 min |
| 4 | Create RDS instance | 15 min |
| 5 | Migrate Neon → RDS | 15 min |
| 6 | Create ECR repo | 5 min |
| 7 | GitHub Actions workflow | 10 min |
| 8 | Create App Runner service | 15 min |
| 9 | Custom domain + DNS | 15 min |
| 10 | Push + verify | 10 min |
| **Total** | | **~1.5-2 hours** |
