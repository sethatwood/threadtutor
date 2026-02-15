---
phase: 01-foundation-api
plan: 02
subsystem: api
tags: [anthropic-sdk, structured-output, byok, zod, api-route, error-handling]

# Dependency graph
requires:
  - 01-01 (Zod schemas, system prompt, project scaffold)
provides:
  - "POST /api/chat route with BYOK key resolution, structured outputs, and comprehensive error handling"
  - "zodOutputFormat integration with TurnResponseSchema for guaranteed JSON schema compliance"
  - "stop_reason validation preventing truncated/broken JSON responses"
affects:
  - 02-app-shell (conversation panel calls this endpoint)
  - 05-session-persistence (session recording uses TurnResponse data from this endpoint)

# Tech tracking
tech-stack:
  added: [zod 4.3 (upgraded from 3.25 for toJSONSchema compatibility)]
  patterns:
    - "Per-request Anthropic client creation for BYOK isolation"
    - "zodOutputFormat for structured output schema enforcement"
    - "stop_reason validation before JSON parsing (422 on incomplete responses)"
    - "Specific error type handling: AuthenticationError (401), RateLimitError (429)"

key-files:
  created:
    - app/api/chat/route.ts
  modified:
    - package.json (zod upgrade)
    - package-lock.json (zod upgrade)

key-decisions:
  - "Zod upgraded from v3.25 to v4.3: The Anthropic SDK's zodOutputFormat helper requires toJSONSchema which is only available in Zod v4's default export. Backward compatible for all existing schemas."
  - "Using messages.create() with output_config format (not messages.parse()): Allows manual stop_reason validation before JSON parsing, giving better error messages for truncated responses."

patterns-established:
  - "BYOK pattern: apiKey from request body, fallback to env var only in development"
  - "Defensive response parsing: check stop_reason, verify content block type, then parse"
  - "Error granularity: distinct HTTP status codes for auth (401), rate limit (429), incomplete (422), and generic (500)"

# Metrics
duration: 5min
completed: 2026-02-15
---

# Phase 1 Plan 2: API Route with BYOK, Structured Outputs, and Error Handling Summary

**POST /api/chat route with per-request BYOK Anthropic client, zodOutputFormat structured output, stop_reason validation, and granular error handling**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-15T02:46:15Z
- **Completed:** 2026-02-15T02:50:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created POST /api/chat route with complete request validation, BYOK key resolution, and NODE_ENV development fallback
- Integrated zodOutputFormat with TurnResponseSchema for structured Claude responses
- Implemented stop_reason validation to catch truncated responses before JSON parsing
- Added specific error handling for AuthenticationError (401), RateLimitError (429), and generic errors (500)
- Upgraded Zod from v3.25 to v4.3 to resolve toJSONSchema compatibility with Anthropic SDK helpers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the API route with all safeguards** - `05786f6` (feat)
2. **Task 2: Verify build and test the route with curl** - verification only, no commit

**Plan metadata:** `c08ddf1` (docs: complete plan)

## Files Created/Modified

- `app/api/chat/route.ts` - Complete POST handler with BYOK, structured output, stop_reason check, error handling
- `package.json` - Zod dependency upgraded from ^3.25.76 to ^4.3.6
- `package-lock.json` - Lock file updated for Zod v4

## Decisions Made

- **Zod v4 upgrade:** The Anthropic SDK v0.74's `zodOutputFormat` helper imports `toJSONSchema` from Zod's default export. Zod v3.25.x's default export is the v3 backward-compatible API which lacks `toJSONSchema`. Upgrading to Zod v4.3 resolves this while maintaining full backward compatibility with existing schemas (z.object, z.string, z.enum, z.array all work identically).
- **messages.create() over messages.parse():** The SDK offers `messages.parse()` for auto-parsing, but using `messages.create()` with `output_config` allows checking `stop_reason` before attempting JSON parse. This gives cleaner error handling for truncated responses.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zod v3.25 incompatible with Anthropic SDK's zodOutputFormat**
- **Found during:** Task 1 (initial build)
- **Issue:** `npm run build` failed with "Export toJSONSchema doesn't exist in target module" because `zod@3.25.76`'s default export is the v3 compatibility API which lacks `toJSONSchema`. The Anthropic SDK's helpers/zod.mjs does `import * as z from 'zod'` and calls `z.toJSONSchema()`.
- **Fix:** Upgraded Zod from `^3.25.76` to `^4.3.6`. Verified all existing schemas (ConceptSchema, ConfidenceCheckSchema, TurnResponseSchema) work identically with Zod v4.
- **Files modified:** package.json, package-lock.json
- **Committed in:** 05786f6 (bundled with Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary dependency upgrade. No scope change. All existing schemas and types remain compatible.

## Issues Encountered

- Zod v3.25.x ships with a v3 backward-compatibility default export that omits `toJSONSchema`. This is a known incompatibility with Anthropic SDK v0.74+ which expects Zod v4's full API surface. Resolved by upgrading to Zod v4.3.

## User Setup Required

None for this plan. Users will need an Anthropic API key to use the live chat endpoint (handled by BYOK flow).

## Next Phase Readiness

- Phase 1 is now complete: all API infrastructure is in place
- Phase 2 (App Shell & Live Conversation) can begin immediately
- The API route is ready to receive requests from a conversation UI
- No blockers for Phase 2

---
*Phase: 01-foundation-api*
*Completed: 2026-02-15*
