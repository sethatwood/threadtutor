---
phase: quick
plan: 3
subsystem: api, ui
tags: [anthropic, api-key, BYOK, serverless, next-env]

# Dependency graph
requires: []
provides:
  - "Server-side ANTHROPIC_API_KEY fallback in all environments (not just dev)"
  - "Keyless conversation start flow for visitors when server key is configured"
  - "NEXT_PUBLIC_SERVER_KEY_AVAILABLE build-time boolean flag"
affects: [deployment, vercel-env-config]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NEXT_PUBLIC_ env var as boolean feature flag (no secrets exposed)"
    - "BYOK with server-side fallback via OR chain in API route"

key-files:
  created: []
  modified:
    - app/api/chat/route.ts
    - components/topic-picker.tsx

key-decisions:
  - "Used NEXT_PUBLIC_SERVER_KEY_AVAILABLE boolean flag instead of exposing any part of the key"
  - "Server key fallback applies to all environments, not just development"
  - "API key input form becomes optional with Skip button when shown as edge case"

patterns-established:
  - "Build-time feature flags via NEXT_PUBLIC_ env vars for conditional UI"

# Metrics
duration: 2min
completed: 2026-02-18
---

# Quick Task 3: Server-Side API Key Fallback Summary

**Removed dev-only gate on ANTHROPIC_API_KEY fallback and added keyless conversation start via NEXT_PUBLIC_SERVER_KEY_AVAILABLE flag**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T17:07:20Z
- **Completed:** 2026-02-18T17:09:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Server-side ANTHROPIC_API_KEY now works as fallback in production, preview, and development
- Visitors can start live conversations without providing an API key when server key is configured
- BYOK users continue using their own key with no behavior change
- No secrets exposed to the client (only a boolean build-time flag)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove development gate on server-side API key fallback** - `5635df4` (feat)
2. **Task 2: Update topic picker to allow keyless conversation start** - `4d9d42d` (feat)

## Files Created/Modified
- `app/api/chat/route.ts` - Simplified API key resolution: `apiKey || process.env.ANTHROPIC_API_KEY || null` (removed NODE_ENV gate)
- `components/topic-picker.tsx` - Added serverKeyAvailable flag, updated handleStartLearning to bypass key input, added "No API key needed" hint, changed label to optional, added Skip button

## Decisions Made
- Used `NEXT_PUBLIC_SERVER_KEY_AVAILABLE` as a boolean build-time flag rather than any approach that could leak the actual key. This must be set as an environment variable on the hosting platform (e.g., Vercel) alongside ANTHROPIC_API_KEY.
- Kept the API key input form accessible via the edge case path (no stored key AND no server key) so self-hosted users without env vars can still use BYOK.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**Environment variables must be configured on the hosting platform:**

1. `ANTHROPIC_API_KEY` - Server-side only, the actual API key for Anthropic
2. `NEXT_PUBLIC_SERVER_KEY_AVAILABLE=true` - Build-time flag telling the frontend that a server key exists

Both must be set on Vercel (or equivalent) for keyless visitor experience to work.

## Next Steps
- Set `NEXT_PUBLIC_SERVER_KEY_AVAILABLE=true` and `ANTHROPIC_API_KEY` on Vercel dashboard
- Redeploy to activate the keyless experience

## Self-Check: PASSED

- [x] app/api/chat/route.ts exists
- [x] components/topic-picker.tsx exists
- [x] 3-SUMMARY.md exists
- [x] Commit 5635df4 (Task 1) exists
- [x] Commit 4d9d42d (Task 2) exists
- [x] Build passes with zero errors

---
*Quick Task: 3*
*Completed: 2026-02-18*
