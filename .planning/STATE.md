# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** The system prompt is the product. A well-prompted Claude that teaches through Socratic questioning, with a UI built around learning rather than chatting.
**Current focus:** Phase 3: Concept Map

## Current Position

Phase: 3 of 8 (Concept Map)
Plan: 1 of 2 in current phase
Status: Plan 03-01 complete, continuing to 03-02
Last activity: 2026-02-15 -- Completed 03-01-PLAN.md (concept map building blocks: graph layout, node component, CSS)

Progress: [████░░░░░░] ~31%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 3.3min
- Total execution time: 0.33 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-api | 2/2 | 9min | 4.5min |
| 02-app-shell-live-conversation | 3/3 | 8min | 2.7min |
| 03-concept-map | 1/2 | 3min | 3min |

**Recent Trend:**
- Last 5 plans: 01-02 (5min), 02-01 (3min), 02-02 (2min), 02-03 (3min), 03-01 (3min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 8 phases derived from 40 requirements following architectural dependency chain
- [Roadmap]: Phases 3 and 4 can parallelize (both depend on Phase 2 only)
- [Roadmap]: Phase 6 (Replay) depends on both Phase 3 (Concept Map) and Phase 5 (Session Persistence)
- [01-01]: No src/ directory; @/* alias maps to project root for shorter imports
- [01-01]: Zod schemas separate from app types (schemas validate API, Turn/Session are app-level)
- [01-01]: ConceptRef minimal interface in system-prompt.ts keeps prompt builder decoupled from Zod
- [01-02]: Zod upgraded from v3.25 to v4.3 for toJSONSchema compatibility with Anthropic SDK helpers
- [01-02]: Using messages.create() with output_config (not messages.parse()) for manual stop_reason validation
- [02-01]: type-only import for MessageParam avoids pulling Anthropic SDK into client bundle
- [02-01]: useRef + useEffect pattern for stale closure avoidance in memoized callbacks
- [02-01]: Tailwind v4 plugin registration via @plugin directive in CSS (not tailwind.config.js)
- [02-02]: Message children prop pattern for ConfidenceCheckCard injection by parent
- [02-02]: Muted indigo accent for confidence check cards, muted semantic colors for assessment badges
- [02-02]: Role labels above messages (Claude in indigo, You in zinc) instead of chat bubbles
- [02-03]: Unified always-dark theme (#1a1a1e background), no light/dark toggle
- [02-03]: prose-invert with custom overrides for dark mode markdown rendering
- [02-03]: Opening turn auto-sends to trigger Claude's first Socratic response
- [03-01]: ConceptNodeData uses type alias with index signature for React Flow Record<string, unknown> compatibility
- [03-01]: Top-to-bottom (TB) default layout direction for concept graph
- [03-01]: Bezier (default) edge type for smooth curved connections

### Pending Todos

None.

### Blockers/Concerns

- [Research]: System prompt effectiveness for Socratic teaching is inherently iterative -- budget time for prompt iteration with 15+ turn test conversations
- [Resolved]: max_tokens updated to 2048 (research confirmed 1024 too tight for structured JSON envelope)

## Session Continuity

Last session: 2026-02-15T07:02:07Z
Stopped at: Completed 03-01-PLAN.md (concept map building blocks)
Resume file: None
