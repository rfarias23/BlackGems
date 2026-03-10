# Known Anti-Patterns

Rules derived from real bugs found in production. Each entry is a mistake that has already happened once — do not repeat.

---

## Next.js 15

**`redirect()` inside catch blocks is silently swallowed.**

```typescript
// ❌ WRONG — redirect() never fires; catch consumes the error
try {
  await doSomething()
} catch (e) {
  redirect('/dashboard')  // silently dies here
}

// ✅ CORRECT — re-throw after redirect
try {
  await doSomething()
} catch (e) {
  if (isRedirectError(e)) throw e  // let Next.js handle it
  console.error(e)
  return { error: 'Something went wrong' }
}

// ✅ ALSO CORRECT — return success flag, navigate client-side
return { success: true }
// in component: if (result.success) router.push('/dashboard')
```

This is the root cause of every "button does nothing" bug on the platform.

---

## Authentication

**Wrong session guard.**

```typescript
// ❌ WRONG — truthy even when user object exists but id is missing
if (!session?.user) return { error: 'Unauthorized' }

// ✅ CORRECT
if (!session?.user?.id) return { error: 'Unauthorized' }
```

---

## LP Email Invitations

**Silent failure pattern: discarded return value + missing env var.**

```typescript
// ❌ WRONG — return value discarded; failure is invisible
sendInvitationEmail(lpEmail, token)

// ✅ CORRECT — await and handle
const result = await sendInvitationEmail(lpEmail, token)
if (!result.success) {
  console.error('Email failed:', result.error)
  return { error: 'Failed to send invitation' }
}
```

Always verify `RESEND_API_KEY` is set on EC2 before testing email flows.

---

## Dark Mode

**Using Tailwind `.dark` class in the Cockpit.**

The dashboard layout applies dark mode via inline CSS custom properties on the root `<div>`, not via Tailwind's `.dark` class. Components that use Tailwind dark mode variants (`dark:bg-*`) will not respond correctly inside the Cockpit.

Portal components (Dialog, Select, Popover, Combobox) that render in a portal *outside* the layout div require hardcoded hex colors — CSS custom properties do not cascade to them.

---

## Delete Dialogs

**`redirect()` inside a catch block in delete Server Actions** (see Next.js 15 above).

This caused the "Delete User" dialog to silently do nothing. The fix is always to return a success/error object from the Server Action and handle navigation in the client component.

---

## External SDK Clients (Resend, S3, Sentry, AI providers)

**Eagerly initializing SDK clients at module load time causes build failures** when env vars are absent (e.g., CI, local dev without full `.env`).

```typescript
// ❌ WRONG — crashes the build if RESEND_API_KEY is undefined
const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ CORRECT — lazy init
let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}
```

---

## Prisma Model Names

Common wrong names that cause runtime errors:

| Wrong | Correct |
|-------|---------|
| `CapitalCommitment` | `Commitment` |
| `InvitationToken` | `VerificationToken` |

---

## Email Templates

**Font mismatch:** LP invitation emails must use `font-family: Georgia, serif` for headings to match the platform's Source Serif 4 aesthetic. Using system sans-serif breaks the institutional voice.
