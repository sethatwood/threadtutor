---
phase: 06-replay-mode
plan: 02
subsystem: ui
tags: [react, replay, demo, json, fetch, topic-picker]

# Dependency graph
requires:
  - phase: 06-replay-mode
    plan: 01
    provides: ReplayShell component, useReplayState hook, replay infrastructure
  - phase: 03-concept-map
    provides: ConceptMap component accepting turns prop
  - phase: 05-session-persistence
    provides: Session type and session storage
provides:
  - Pre-recorded Bitcoin proof-of-work demo session (public/demo.json)
  - Auto-loading replay for keyless visitors via TopicPicker
  - "Watch demo" button for visitors with API keys
affects: [07-polish-deploy, landing-page, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns: [auto-fetch-on-mount, conditional-render-priority-chain]

key-files:
  created:
    - public/demo.json
  modified:
    - components/topic-picker.tsx

key-decisions:
  - "Auto-load demo for keyless visitors via useEffect after apiKeyLoaded confirms no stored key"
  - "Watch demo button available to all users (not just keyless) for discoverability"
  - "Demo fetch reusable via useCallback shared between auto-load effect and button click"

patterns-established:
  - "Render priority chain: loadedSession > started > demoSession > loading > topic picker form"
  - "Graceful degradation: demo fetch error falls through to normal topic picker"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 6 Plan 2: Demo Data and Replay Integration Summary

**Hand-crafted Bitcoin proof-of-work demo session with 16 turns and auto-loading replay for keyless visitors in TopicPicker**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T17:10:16Z
- **Completed:** 2026-02-15T17:13:04Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments
- 16-turn Bitcoin proof-of-work demo session with 13 concepts forming a coherent tree, 3 confidence checks (2 tracking, 1 partial), and natural Socratic teaching flow
- TopicPicker auto-loads demo.json for visitors without an API key, rendering ReplayShell as the default landing experience
- "Watch demo" button in the topic picker form lets visitors with API keys optionally watch the demo
- Exiting replay (via ReplayShell onBack) returns to the topic picker form

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demo.json with Bitcoin proof-of-work session** - `48789e9` (feat)
2. **Task 2: Wire replay into TopicPicker as default visitor experience** - `0b60f16` (feat)

## Files Created/Modified
- `public/demo.json` - Pre-recorded 16-turn Bitcoin proof-of-work demo session with 13 concepts and 3 confidence checks
- `components/topic-picker.tsx` - Added demo auto-load for keyless visitors, ReplayShell rendering, and "Watch demo" button

## Decisions Made
- Auto-load demo for keyless visitors via useEffect that runs after apiKeyLoaded confirms no stored key, with fetchDemo as a shared useCallback
- Watch demo button available to all users (not just keyless) so anyone can preview the experience
- Demo fetch helper reused between auto-load effect and manual button click to avoid duplication
- Render priority chain: loadedSession (existing) > started (existing) > demoSession (new) > loading state > topic picker form

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Replay mode is fully end-to-end: new visitors land on a working demo immediately
- All 06-replay-mode plans complete (01 infrastructure + 02 integration)
- Ready for Phase 07 (polish and deploy)

## Self-Check: PASSED

- All 2 files verified on disk (public/demo.json, components/topic-picker.tsx)
- All 2 task commits verified in git log (48789e9, 0b60f16)
- npm run build passes with zero errors

---
*Phase: 06-replay-mode*
*Completed: 2026-02-15*
