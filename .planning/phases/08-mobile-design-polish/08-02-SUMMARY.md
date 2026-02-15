---
phase: 08-mobile-design-polish
plan: 02
subsystem: ui
tags: [geist-font, typography, responsive, em-dash, sanitization, tailwind]

# Dependency graph
requires:
  - phase: 02-app-shell-live-conversation
    provides: "Conversation panel, message component, confidence check UI"
  - phase: 01-foundation-api
    provides: "API route for Claude chat"
provides:
  - "Geist Sans font rendering across entire app"
  - "Responsive prose sizing (prose-sm mobile, prose-base desktop)"
  - "Runtime em/en dash sanitization in API route"
  - "Responsive padding on all interactive areas"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS variable font stack: var(--font-sans) instead of hardcoded font names"
    - "Runtime text sanitization in API route before returning to client"
    - "Responsive Tailwind classes with md: breakpoint for mobile-first spacing"

key-files:
  created: []
  modified:
    - app/globals.css
    - app/api/chat/route.ts
    - components/message.tsx
    - components/conversation-panel.tsx
    - components/confidence-check.tsx
    - components/topic-picker.tsx

key-decisions:
  - "Font stack uses var(--font-sans) with system-ui fallback, not hardcoded font names"
  - "Em dash sanitization at API boundary (not client-side) for single point of enforcement"
  - "Em dashes replaced with space-hyphen-space; en dashes replaced with plain hyphen"

patterns-established:
  - "Runtime sanitization: API route cleans all text fields before returning to client"
  - "Responsive spacing: mobile-first with md: breakpoint for desktop padding"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 8 Plan 2: Typography and Em Dash Sanitization Summary

**Geist Sans font stack fix, responsive prose sizing, and belt-and-suspenders em/en dash sanitization on all Claude API response text fields**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T18:48:42Z
- **Completed:** 2026-02-15T18:50:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Fixed font stack from hardcoded Arial to Geist Sans via CSS variable
- Added responsive typography with prose-sm on mobile, prose-base on desktop
- Added responsive padding across conversation panel, confidence checks, and topic picker
- Implemented sanitizeEmDashes helper in API route covering all text fields
- Verified zero literal em/en dashes exist anywhere in the codebase

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix font stack and improve typography/spacing** - `d83c7fe` (feat)
2. **Task 2: Em dash sanitization in API route** - `b0b3ea4` (feat)

## Files Created/Modified
- `app/globals.css` - Replaced hardcoded Arial with var(--font-sans) for Geist Sans
- `app/api/chat/route.ts` - Added sanitizeEmDashes helper and applied to all text fields
- `components/message.tsx` - Responsive prose sizing and message padding
- `components/conversation-panel.tsx` - Responsive padding on message list, error banner, input area
- `components/confidence-check.tsx` - Responsive padding on confidence check card
- `components/topic-picker.tsx` - Responsive vertical padding and branding section margin

## Decisions Made
- Font stack uses var(--font-sans) with system-ui fallback rather than naming Geist Sans directly, keeping it maintainable if the font changes
- Em dash sanitization placed at the API boundary (server-side) so all clients benefit from a single enforcement point
- Em dashes (U+2014) become " - " (space-hyphen-space) for readability; en dashes (U+2013) become "-" (plain hyphen)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 08 plan 02 complete (typography and sanitization)
- Phase 08 plan 01 (mobile layout) still pending
- All UI polish objectives (font, spacing, em dash enforcement) delivered

## Self-Check: PASSED

- All 6 modified files exist on disk
- Commit d83c7fe (Task 1) verified in git log
- Commit b0b3ea4 (Task 2) verified in git log

---
*Phase: 08-mobile-design-polish*
*Completed: 2026-02-15*
