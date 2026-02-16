---
phase: 12-design-polish
plan: 01
subsystem: ui
tags: [css, tailwind, selection, font-smoothing, spacing, borders]

# Dependency graph
requires:
  - phase: 11-component-theme-parity
    provides: Theme-aware CSS variable system with [data-theme] selectors
provides:
  - Theme-aware text selection styling with indigo-tinted highlights
  - Font smoothing via CSS properties and Tailwind class
  - Consistent border opacity rhythm (50% panel, 60% content)
  - Generous spacing between journal entries and first-message padding fix
  - Transition-all duration-150 on shell header buttons
affects: [12-design-polish, 13-animation-branding]

# Tech tracking
tech-stack:
  added: []
  patterns: [border-opacity-rhythm, selection-theming]

key-files:
  created: []
  modified:
    - app/globals.css
    - app/layout.tsx
    - components/conversation-shell.tsx
    - components/replay-shell.tsx
    - components/message.tsx
    - components/learning-journal.tsx

key-decisions:
  - "Indigo-tinted selection (rgba(129,140,248,0.3) dark, rgba(79,70,229,0.2) light) instead of generic white/black"
  - "50% opacity for major panel dividers, 60% for content-level dividers"
  - "Removed unused --color-selection-bg variable after replacing with direct ::selection rules"

patterns-established:
  - "Border opacity rhythm: /50 for structural panel borders, /60 for content dividers"
  - "Transition upgrade: transition-all duration-150 for buttons coordinated with Plan 02"

# Metrics
duration: 3min
completed: 2026-02-16
---

# Plan 12-01: Global Polish Summary

**Indigo-tinted selection styling, font smoothing, softened borders at 50%/60% opacity, and generous spacing rhythm**

## Performance

- **Duration:** 3 min
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Theme-aware text selection with brand-aligned indigo highlights in both dark and light modes
- Font smoothing via both CSS properties (-webkit-font-smoothing, -moz-osx-font-smoothing) and Tailwind antialiased class
- Panel dividers softened to 50% opacity, content dividers to 60%, for a more refined look
- Journal entry spacing increased from space-y-3 to space-y-4 for breathing room
- First message padding removed (first:pt-0) for tighter panel fit

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance selection styling and verify font smoothing** - `76fcd73` (feat)
2. **Task 2: Refine spacing rhythm and border treatment** - `795347e` (feat)

## Files Created/Modified
- `app/globals.css` - Added themed ::selection rules with indigo tint, font-smoothing properties, removed --color-selection-bg
- `app/layout.tsx` - Verified antialiased class present (no change needed)
- `components/conversation-shell.tsx` - Softened panel borders to /50, upgraded button transitions
- `components/replay-shell.tsx` - Matching border/transition treatment as conversation-shell
- `components/message.tsx` - Added first:pt-0, softened divider to /60
- `components/learning-journal.tsx` - Softened header border to /60, increased entry spacing

## Decisions Made
- Used direct ::selection rules per theme instead of CSS variable for selection color (simpler, more explicit)
- Chose indigo tint for selection to align with existing accent color system

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Global polish layer complete, ready for Phase 13 animation work
- Border opacity rhythm established for consistency in future components

---
*Plan: 12-01-design-polish*
*Completed: 2026-02-16*
