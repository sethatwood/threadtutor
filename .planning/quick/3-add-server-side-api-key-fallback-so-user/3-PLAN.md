---
phase: quick
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/chat/route.ts
  - components/topic-picker.tsx
  - lib/use-conversation.ts
  - components/conversation-shell.tsx
autonomous: true
must_haves:
  truths:
    - "Visitors without an API key can start a live conversation using the server-side key"
    - "Visitors who provide their own key still use it (BYOK takes priority)"
    - "API key input is still accessible for users who want to use their own key"
    - "No secrets are exposed to the client"
  artifacts:
    - path: "app/api/chat/route.ts"
      provides: "Environment-agnostic ANTHROPIC_API_KEY fallback"
      contains: "process.env.ANTHROPIC_API_KEY"
    - path: "components/topic-picker.tsx"
      provides: "Updated flow allowing keyless users to start conversations"
  key_links:
    - from: "components/topic-picker.tsx"
      to: "components/conversation-shell.tsx"
      via: "apiKey prop (empty string when using server key)"
    - from: "app/api/chat/route.ts"
      to: "process.env.ANTHROPIC_API_KEY"
      via: "fallback when no client apiKey provided"
---

<objective>
Remove the development-only gate on the ANTHROPIC_API_KEY environment variable fallback so the
server-side key works in production. Update the frontend so visitors without a stored API key can
start a live conversation directly (the server key handles auth), while still allowing BYOK users
to enter their own key.

Purpose: Let recruiters and visitors use the app immediately without needing an Anthropic API key.
Output: Modified API route and topic picker with seamless keyless experience.
</objective>

<execution_context>
@/Users/yayseth/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yayseth/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/api/chat/route.ts
@components/topic-picker.tsx
@components/conversation-shell.tsx
@lib/use-conversation.ts
@lib/api-key.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove development gate on server-side API key fallback</name>
  <files>app/api/chat/route.ts</files>
  <action>
In `app/api/chat/route.ts`, update the API key resolution block (lines 57-61).

Change from:
```typescript
const key =
  apiKey ||
  (process.env.NODE_ENV === "development"
    ? process.env.ANTHROPIC_API_KEY
    : null);
```

To:
```typescript
const key = apiKey || process.env.ANTHROPIC_API_KEY || null;
```

This allows the server-side ANTHROPIC_API_KEY env var to serve as a fallback in ALL environments
(production, preview, development), not just development. The client-provided `apiKey` still takes
priority since it appears first in the OR chain.

Update the comment above from "BYOK with development fallback" to "BYOK with server-side fallback".
  </action>
  <verify>Run `npm run build` to confirm no type errors. Grep the file for `NODE_ENV` to confirm the gate is removed.</verify>
  <done>API route uses ANTHROPIC_API_KEY as fallback regardless of environment. Client-provided key still takes priority.</done>
</task>

<task type="auto">
  <name>Task 2: Update topic picker to allow keyless conversation start</name>
  <files>components/topic-picker.tsx, components/conversation-shell.tsx, lib/use-conversation.ts</files>
  <action>
The goal: when no user API key is stored, clicking "Start learning" should go straight to the
conversation (the server will use its own key). The API key input becomes an optional "Use your
own key" feature rather than a gate.

**In `components/topic-picker.tsx`:**

1. Add a `serverKeyAvailable` constant that checks `process.env.NEXT_PUBLIC_SERVER_KEY_AVAILABLE === "true"`.
   This is a build-time flag - no secrets exposed. Set via env var on Laravel Forge.

2. Modify `handleStartLearning`:
   - If user has a stored `apiKey` OR `serverKeyAvailable` is true, go straight to `setStarted(true)`.
   - Only show the API key input (`setShowApiKeyInput(true)`) when there is no stored key AND
     no server key available (pure self-hosted scenario with no env var set).

3. Update the API key input section: change the label from "Enter your Anthropic API key to begin"
   to "Optionally use your own Anthropic API key" and add a "Skip" button or link that calls
   `setStarted(true)` directly. This way even when the API key form is shown (edge case), users
   can skip it.

4. When `serverKeyAvailable` is true and no user API key is stored, add a subtle note below the
   "Start learning" button: a small `<p>` with class `text-xs text-[var(--color-text-dim)]` saying
   "No API key needed" so visitors know they can just go.

**In `components/conversation-shell.tsx` and `lib/use-conversation.ts`:**

No functional changes needed. The `apiKey` prop/parameter already accepts an empty string, and
`use-conversation.ts` already sends it to the API route where it will be falsy and trigger the
server-side fallback. Confirm that an empty string `apiKey` flows through correctly:
- `conversation-shell.tsx` passes `apiKey` to `useConversation(topic, apiKey)` (line 25)
- `use-conversation.ts` includes `apiKey` in the fetch body (line 186)
- `route.ts` destructures `apiKey` from body - empty string is falsy in JS, so `apiKey || process.env.ANTHROPIC_API_KEY` correctly falls back

This is already correct. No code changes needed in these two files.
  </action>
  <verify>
Run `npm run build` to confirm no type or JSX errors. Manually review the topic picker flow:
1. With no stored API key and NEXT_PUBLIC_SERVER_KEY_AVAILABLE=true: clicking "Start learning" should go straight to conversation.
2. With a stored API key: behavior unchanged, goes straight to conversation.
3. With no stored API key and no env var: should show API key input (backward compatible).
  </verify>
  <done>
Visitors can start learning without providing an API key when the server has ANTHROPIC_API_KEY configured.
BYOK flow still works. No secrets exposed to the client (only a boolean flag via NEXT_PUBLIC_ env var).
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with zero errors
2. In `app/api/chat/route.ts`: no reference to `NODE_ENV` in key resolution logic
3. In `components/topic-picker.tsx`: `NEXT_PUBLIC_SERVER_KEY_AVAILABLE` check exists
4. Empty string apiKey from client correctly triggers server-side fallback (empty string is falsy in JS)
</verification>

<success_criteria>
- Keyless visitors can start and complete a live conversation when ANTHROPIC_API_KEY is set on the server
- Users with their own stored API key continue using it with no behavior change
- No API keys or secrets are exposed to the browser
- Build succeeds with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/3-add-server-side-api-key-fallback-so-user/3-SUMMARY.md`
</output>
