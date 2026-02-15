# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** The system prompt is the product. A well-prompted Claude that teaches through Socratic questioning, with a UI built around learning rather than chatting.
**Current focus:** Phase 2: App Shell & Live Conversation

## Current Position

Phase: 2 of 8 (App Shell & Live Conversation) -- COMPLETE
Plan: 3 of 3 in current phase
Status: Phase complete, pending verification
Last activity: 2026-02-15 -- Completed 02-03-PLAN.md (assembly: conversation panel, shell, topic picker, page)

Progress: [███░░░░░░░] ~25%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3.4min
- Total execution time: 0.28 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-api | 2/2 | 9min | 4.5min |
| 02-app-shell-live-conversation | 3/3 | 8min | 2.7min |

**Recent Trend:**
- Last 5 plans: 01-01 (4min), 01-02 (5min), 02-01 (3min), 02-02 (2min), 02-03 (3min)
- Trend: improving

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

### Pending Todos

None.

### Blockers/Concerns

- [Research]: System prompt effectiveness for Socratic teaching is inherently iterative -- budget time for prompt iteration with 15+ turn test conversations
- [Resolved]: max_tokens updated to 2048 (research confirmed 1024 too tight for structured JSON envelope)

## Session Continuity

Last session: 2026-02-15T06:15:00Z
Stopped at: Completed 02-03-PLAN.md (Phase 2 assembly complete)
Resume file: None
