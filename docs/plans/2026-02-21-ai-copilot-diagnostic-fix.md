# AI Copilot Diagnostic & Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Diagnose the persistent "Gema shows no response" bug by adding layer-by-layer diagnostic instrumentation, then fix the confirmed root cause.

**Architecture:** The AI copilot has 5 layers: Client (useChat → DefaultChatTransport) → API Route (auth, context, streamText) → Anthropic API → Streaming Response → DB Persistence. Previous fixes targeted layers 1, 3, and 5 without evidence. This plan instruments each layer boundary, reproduces the failure once, reads the logs, then fixes the confirmed broken layer.

**Tech Stack:** Next.js 15, AI SDK v6 (`ai` ^6.0.91, `@ai-sdk/anthropic` ^3.0.45, `@ai-sdk/react` ^3.0.93), Prisma, Anthropic API.

---

## Phase A: Diagnostic Instrumentation (gather evidence BEFORE fixing)

### Task 1: Add structured error logging to API route

**Why:** The API route catches errors at 6 points but returns generic JSON errors. We need to see exactly which layer fails and what the Anthropic API returns.

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Step 1: Add top-level try/catch with structured logging around the streaming call**

Replace the streaming section (lines 126-158) with instrumented version:

```typescript
  // 10. Stream response
  const anthropic = getAnthropicProvider()

  console.log('[AI:DIAG] Calling streamText', {
    model: AI_CONFIG.model,
    systemPromptLength: systemPrompt.length,
    messageCount: modelMessages.length,
    toolCount: Object.keys(createReadTools(activeFund.fundId, activeFund.currency)).length,
    conversationId,
  })

  let result
  try {
    result = streamText({
      model: anthropic(AI_CONFIG.model),
      system: systemPrompt,
      messages: modelMessages,
      tools: createReadTools(activeFund.fundId, activeFund.currency),
      onFinish: ({ usage }) => {
        console.log('[AI:DIAG] streamText.onFinish', {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          conversationId,
        })
        // Fire-and-forget: track cost to audit log
        const inputTokens = usage.inputTokens ?? 0
        const outputTokens = usage.outputTokens ?? 0
        trackAICost(session.user!.id!, activeFund.fundId, {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        })
      },
    })
  } catch (streamError) {
    console.error('[AI:DIAG] streamText threw synchronously:', streamError)
    return NextResponse.json(
      { error: 'AI streaming failed to initialize' },
      { status: 500 }
    )
  }

  // 11. Return streaming response with persistence on finish
  console.log('[AI:DIAG] Returning toUIMessageStreamResponse')
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      console.log('[AI:DIAG] toUIMessageStreamResponse.onFinish', {
        messageCount: allMessages.length,
        conversationId,
      })
      // Fire-and-forget: persist all messages to DB
      persistMessages(conversationId, allMessages).catch((error: unknown) => {
        console.error('[AI:DIAG] persistMessages failed:', error)
      })
    },
    headers: {
      'X-Conversation-Id': conversationId,
    },
  })
```

**Step 2: Add diagnostic logging at each validation gate**

After each early return in the route, add a log line. Add these right before each `return NextResponse.json(...)`:

- Line 24 (auth fail): `console.log('[AI:DIAG] Auth failed: no session.user.id')`
- Line 31 (AI disabled): `console.log('[AI:DIAG] AI not enabled: ANTHROPIC_API_KEY missing')`
- Line 39 (no fund): `console.log('[AI:DIAG] No active fund for user:', session.user.id)`
- Line 49 (access denied): `console.log('[AI:DIAG] Fund access denied:', { userId: session.user.id, fundId: activeFund.fundId })`
- Line 62 (rate limit): `console.log('[AI:DIAG] Rate limited:', { userId: session.user.id, resetAt: rateLimitResult.resetAt })`
- Line 76 (no messages): `console.log('[AI:DIAG] No messages in request body')`

**Step 3: Run build to verify no type errors**

Run: `npm run build`
Expected: Zero errors. The logging is all `console.log` — no type changes.

**Step 4: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "diag: add structured logging to AI chat route for root cause investigation"
```

---

### Task 2: Add client-side error visibility

**Why:** The `onError` callback only does `console.error`. If the server returns a non-streaming error (4xx/5xx), the user sees nothing — the error may be swallowed by the transport layer.

**Files:**
- Modify: `src/components/ai/ai-copilot.tsx`

**Step 1: Enhance the error display to show HTTP status codes**

In the error display section (around line 324), the current code shows `error.message`. But AI SDK transport errors often have additional context. Add a diagnostic log:

```typescript
    onError: (err: Error) => {
      console.error('[AI:DIAG:CLIENT] Chat error:', {
        message: err.message,
        name: err.name,
        cause: (err as Record<string, unknown>).cause,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      })
    },
```

**Step 2: Also log when the transport sends a request**

After the `sendMessage` call in `handleSend` (line 164), add:

```typescript
    sendMessage({ text })
    console.log('[AI:DIAG:CLIENT] Message sent', {
      conversationId: conversationIdRef.current,
      fundId,
      textLength: text.length,
    })
```

**Step 3: Commit**

```bash
git add src/components/ai/ai-copilot.tsx
git commit -m "diag: add client-side diagnostic logging for AI chat"
```

---

### Task 3: Add maxDuration export to API route

**Why:** Next.js standalone mode (Docker) inherits Node.js default timeout behavior. Long AI streaming responses can be cut off by the framework's built-in request timeout. The AI SDK docs explicitly recommend setting `maxDuration` for streaming routes.

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Step 1: Add maxDuration export at the top of the file (after imports)**

```typescript
// Allow streaming responses up to 5 minutes
export const maxDuration = 300
```

Add this right after line 18 (the last import), before the `POST` function.

**Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "fix: add maxDuration to AI chat route to prevent streaming timeouts"
```

---

## Phase B: Reproduce & Read Evidence

### Task 4: Deploy and reproduce the failure

**Step 1: Deploy the instrumented build to the environment where the bug occurs**

Run the standard deployment process.

**Step 2: Open the app, open Gema, send a test message**

Send: "What is the current state of my fund?"

**Step 3: Read server logs**

Look for `[AI:DIAG]` log lines. The diagnostic output will show exactly which layer fails:

| Log Pattern | Meaning |
|-------------|---------|
| No `[AI:DIAG]` lines at all | Request never reaches the route (client/transport issue) |
| `Auth failed` | Session not available in API route context |
| `AI not enabled` | `ANTHROPIC_API_KEY` env var missing in production |
| `No active fund` | User has no fund membership |
| `Calling streamText` but no `onFinish` | Anthropic API call fails silently |
| `Calling streamText` + `onFinish` but no `toUIMessageStreamResponse.onFinish` | Stream created but response piping fails |
| All logs present | Server works — problem is client-side rendering |

**Step 4: Read browser console**

Look for `[AI:DIAG:CLIENT]` log lines:

| Log Pattern | Meaning |
|-------------|---------|
| `Message sent` but no error | Transport sent request, waiting for response |
| `Chat error` with message | Server returned an error the client captured |
| No logs at all | `handleSend` never executed (UI/state issue) |

**Step 5: Document the evidence**

Write down: Which `[AI:DIAG]` log was the LAST one that appeared? That's the layer boundary where the failure occurs.

---

## Phase C: Targeted Fix (based on Phase B evidence)

### Task 5: Fix based on evidence — BRANCH by scenario

**Read the Phase B evidence and follow ONLY the matching scenario below.**

---

#### Scenario A: `ANTHROPIC_API_KEY` missing in production

**Symptom:** Log shows `[AI:DIAG] AI not enabled: ANTHROPIC_API_KEY missing`

**Fix:** Add the env var to production environment. This is a deployment config issue, not a code issue.

```bash
# For Docker: add to docker-compose.yml or deployment env
ANTHROPIC_API_KEY=sk-ant-...
```

---

#### Scenario B: `Calling streamText` appears but `onFinish` never fires

**Symptom:** The last log is `[AI:DIAG] Calling streamText` with correct model/messages, but `onFinish` never appears.

**Root cause:** Anthropic API returns an error during streaming. The error is caught by the AI SDK transport layer and propagated to the client as an error event.

**Fix:** Wrap `streamText` in a more explicit error handler and check the Anthropic API key permissions:

```typescript
// In route.ts, add error handling to streamText options:
result = streamText({
  model: anthropic(AI_CONFIG.model),
  system: systemPrompt,
  messages: modelMessages,
  tools: createReadTools(activeFund.fundId, activeFund.currency),
  onError: ({ error }) => {
    console.error('[AI:DIAG] Stream error from Anthropic:', error)
  },
  onFinish: ({ usage }) => { /* existing code */ },
})
```

Also verify API key has correct permissions at https://console.anthropic.com.

---

#### Scenario C: All server logs present, client shows error

**Symptom:** Server logs show full success path. Client `[AI:DIAG:CLIENT] Chat error` shows a message.

**Root cause:** The streaming response is sent correctly but the client can't parse it. Common causes:
1. Middleware or proxy stripping streaming headers
2. CORS or CSP blocking the response
3. Response body format mismatch between `toUIMessageStreamResponse` and `useChat` transport expectations

**Fix:** Check if any middleware intercepts `/api/chat`. Look for:
```bash
grep -r "middleware" src/ --include="*.ts" -l
```

If middleware exists, ensure it allows streaming and doesn't buffer responses.

---

#### Scenario D: No server logs at all

**Symptom:** No `[AI:DIAG]` logs appear in server output.

**Root cause:** The request never reaches the API route. Possible causes:
1. The `DefaultChatTransport` sends to wrong URL
2. Auth middleware redirects before the route executes
3. The client never calls `sendMessage` (UI state bug)

**Fix:** Check the transport URL matches the route:
- Transport config: `api: '/api/chat'` (in `ai-copilot.tsx`)
- Route file location: `src/app/api/chat/route.ts`

These must match. In Next.js App Router, `src/app/api/chat/route.ts` serves `/api/chat`.

Also check middleware:
```typescript
// src/middleware.ts — does it intercept /api/chat?
// If yes, does it allow POST requests?
// Does it redirect unauthenticated users before the route can handle it?
```

---

#### Scenario E: Everything works locally but fails in production

**Symptom:** Local dev shows all logs and responses. Production shows failure.

**Root cause:** Environment difference. Most likely:
1. Missing env var in production (`ANTHROPIC_API_KEY`)
2. Docker container can't reach `api.anthropic.com` (network/firewall)
3. Node.js standalone server kills long-running streams

**Fix for network:** Test connectivity from inside the container:
```bash
docker exec <container> wget -q -O- https://api.anthropic.com/v1/messages 2>&1 | head -5
```

**Fix for timeout:** Already addressed by Task 3 (`maxDuration`). If still occurring, check reverse proxy (nginx/cloudflare) timeout settings.

---

## Phase D: Remove Diagnostic Instrumentation

### Task 6: Clean up diagnostic logs

**After the fix is confirmed working**, remove all `[AI:DIAG]` log lines.

**Files:**
- Modify: `src/app/api/chat/route.ts` — remove all `console.log('[AI:DIAG]` lines
- Modify: `src/components/ai/ai-copilot.tsx` — remove all `console.log('[AI:DIAG:CLIENT]` lines
- Keep: `maxDuration` export (this is a permanent fix, not diagnostic)

**Step 1: Remove diagnostic logs**

```bash
# Verify what will be removed
grep -n '\[AI:DIAG' src/app/api/chat/route.ts src/components/ai/ai-copilot.tsx
```

Remove each line manually (do not use sed to avoid accidental changes).

**Step 2: Run build**

Run: `npm run build`
Expected: Zero errors.

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/app/api/chat/route.ts src/components/ai/ai-copilot.tsx
git commit -m "fix: remove AI diagnostic instrumentation after root cause confirmed"
```

---

## Pre-Ship Checklist

- [ ] Diagnostic logs added (Phase A)
- [ ] Bug reproduced with instrumentation (Phase B)
- [ ] Root cause identified from evidence (Phase B, Step 5)
- [ ] Targeted fix applied (Phase C, one scenario only)
- [ ] Fix verified in production (streaming response works)
- [ ] Diagnostic logs removed (Phase D)
- [ ] `npm run build` passes with zero errors
- [ ] `npx vitest run` passes all tests
- [ ] `maxDuration` export kept permanently
