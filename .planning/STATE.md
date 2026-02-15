# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** The system prompt is the product. A well-prompted Claude that teaches through Socratic questioning, with a UI built around learning rather than chatting.
**Current focus:** Phase 8 complete. All plans complete. Project finished.

## Current Position

Phase: 8 of 8 (Mobile and Design Polish) -- COMPLETE
Plan: 2 of 2 in current phase -- ALL COMPLETE
Status: All phases complete. Project finished.
Last activity: 2026-02-15 -- Completed 08-01-PLAN.md (mobile responsive layout)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 2.5min
- Total execution time: 0.64 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-api | 2/2 | 9min | 4.5min |
| 02-app-shell-live-conversation | 3/3 | 8min | 2.7min |
| 03-concept-map | 2/2 | 5min | 2.5min |
| 04-learning-journal | 1/1 | 2min | 2.0min |
| 05-session-persistence | 2/2 | 5min | 2.5min |
| 06-replay-mode | 2/2 | 4min | 2.0min |
| 07-landing-experience | 1/1 | 2min | 2.0min |
| 08-mobile-design-polish | 2/2 | 4min | 2.0min |

**Recent Trend:**
- Last 5 plans: 06-01 (2min), 06-02 (2min), 07-01 (2min), 08-02 (2min), 08-01 (2min)
- Trend: stable, consistently fast

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
- [03-02]: Auto-fit viewport on new concepts via setTimeout(50ms) + fitView with 300ms duration
- [03-02]: ConversationPanel receives state as inline type (self-documenting prop interface)
- [03-02]: Opening turn auto-send co-located with useConversation in ConversationShell
- [04-01]: Type narrowing filter for assistant turns with non-null journalEntry in useMemo
- [04-01]: Scroll sentinel div pattern (ref at bottom of list) for smooth auto-scroll
- [05-01]: Sessions index in separate localStorage key for O(1) listing without parsing full session JSON
- [05-01]: QuotaExceededError caught with console.warn (non-throwing) to prevent auto-save from breaking conversation flow
- [05-01]: Session ID via crypto.randomUUID() in useRef for stability across re-renders
- [05-01]: Dev-mode disk writes are fire-and-forget (localStorage is source of truth)
- [05-02]: Relative date formatting (Today/Yesterday/short date) without date library for session list display
- [05-02]: restoreSession callback exposed from useConversation hook rather than raw dispatch for cleaner API
- [05-02]: Stale entry cleanup: if loadSession returns null, the index entry is auto-removed via deleteSession
- [05-02]: Export button only visible when turns > 0 to avoid empty export
- [06-01]: Dan Abramov useInterval pattern for auto-play timer (ref-based callback, null delay pauses)
- [06-01]: ReplayConversation always renders confidence checks as assessed (isPending never true)
- [06-01]: Back button pauses auto-play (manual navigation implies user wants control)
- [06-02]: Auto-load demo for keyless visitors via useEffect after apiKeyLoaded confirms no stored key
- [06-02]: Watch demo button available to all users (not just keyless) for discoverability
- [06-02]: Demo fetch reusable via useCallback shared between auto-load effect and button click
- [07-01]: AppHeader is pure presentational (no "use client", no hooks) for simplicity and reusability
- [07-01]: "Try it live" and "Exit" both call onBack -- TopicPicker already handles API key entry and topic selection
- [07-01]: "Try it live" uses filled indigo-600 style to visually distinguish from subtle action buttons
- [08-02]: Font stack uses var(--font-sans) with system-ui fallback, not hardcoded font names
- [08-02]: Em dash sanitization at API boundary (server-side) for single enforcement point
- [08-02]: Em dashes replaced with space-hyphen-space; en dashes replaced with plain hyphen
- [08-01]: flex-col with md:flex-row for mobile/desktop panel switching (not grid or separate components)
- [08-01]: CSS order classes reorder panels on mobile without DOM duplication
- [08-01]: Native HTML details/summary for journal collapsibility (zero JS, built-in a11y)
- [08-01]: Fixed h-[250px] for mobile concept map to prevent React Flow zero-height collapse
- [08-01]: preventScrolling={false} on ReactFlow allows page scroll-through on mobile

### Pending Todos

None.

### Blockers/Concerns

- [Research]: System prompt effectiveness for Socratic teaching is inherently iterative -- budget time for prompt iteration with 15+ turn test conversations
- [Resolved]: max_tokens updated to 2048 (research confirmed 1024 too tight for structured JSON envelope)

## Session Continuity

Last session: 2026-02-15T18:50:44Z
Stopped at: Completed 08-01-PLAN.md (mobile responsive layout) -- ALL PHASES COMPLETE
Resume file: None
