---
phase: 03-concept-map
plan: 01
subsystem: ui
tags: [react-flow, dagre, graph-layout, animation, concept-map]

# Dependency graph
requires:
  - phase: 02-app-shell-live-conversation
    provides: "Three-panel layout shell, Turn/Concept types, conversation hook"
provides:
  - "Graph layout utility (collectAllConcepts, buildGraphElements) for converting Turn[] to positioned React Flow nodes/edges"
  - "Custom ConceptNode component with hover tooltip via NodeToolbar"
  - "CSS animations for node entry (fade-in + scale-up) and newest-node glow highlight"
  - "React Flow dark mode CSS variable overrides matching app theme"
affects: [03-02-concept-map-integration, 06-replay]

# Tech tracking
tech-stack:
  added: ["@xyflow/react ^12.10.0", "@dagrejs/dagre ^2.0.4"]
  patterns: ["dagre layout computation with fresh graph per call", "React Flow custom node with typed NodeProps generic", "CSS keyframe animations for node lifecycle"]

key-files:
  created: ["lib/graph-layout.ts", "components/concept-node.tsx"]
  modified: ["app/globals.css", "package.json"]

key-decisions:
  - "ConceptNodeData uses type alias with index signature to satisfy React Flow's Record<string, unknown> constraint"
  - "Top-to-bottom (TB) default layout direction for concept graph"
  - "Bezier (default) edge type for smooth curved connections"

patterns-established:
  - "Graph layout as pure function: collectAllConcepts + buildGraphElements take data in, return positioned nodes/edges out"
  - "Custom React Flow node pattern: memo + typed NodeProps<Node<Data, Type>> + NodeToolbar for tooltips"
  - "CSS-driven node animation: concept-enter for entry, concept-glow-fade for recency highlight"

# Metrics
duration: 3min
completed: 2026-02-15
---

# Phase 3 Plan 1: Concept Map Building Blocks Summary

**React Flow and dagre graph layout utility with custom ConceptNode component, hover tooltips via NodeToolbar, and CSS entry/glow animations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-15T06:59:13Z
- **Completed:** 2026-02-15T07:02:07Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Graph layout utility that converts Turn[] concepts into dagre-positioned React Flow nodes and edges with orphan safety (MAP-06)
- Custom memoized ConceptNode component with hover tooltip (NodeToolbar), hidden handles, and typed props
- CSS animations: 300ms fade-in + scale-up on entry, 3s fading glow for newest nodes
- React Flow dark mode CSS overrides matching the #1a1a1e app theme

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create graph layout utility** - `284421b` (feat)
2. **Task 2: Create custom ConceptNode component and CSS animations** - `174e933` (feat)

## Files Created/Modified
- `lib/graph-layout.ts` - Graph layout utility: collectAllConcepts, buildGraphElements, ConceptNodeData type
- `components/concept-node.tsx` - Custom React Flow node with hover tooltip and entry animation
- `app/globals.css` - React Flow dark mode overrides, concept node styles, entry and glow keyframes
- `package.json` - Added @xyflow/react and @dagrejs/dagre dependencies

## Decisions Made
- ConceptNodeData uses a type alias with `[key: string]: unknown` index signature instead of an interface, to satisfy React Flow's `Record<string, unknown>` generic constraint on Node data
- Top-to-bottom (TB) layout direction chosen as default (user left to Claude's discretion)
- Default (bezier) edge type used for smooth curved connections per user decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ConceptNodeData type compatibility with React Flow generics**
- **Found during:** Task 2 (ConceptNode component)
- **Issue:** TypeScript interface does not satisfy `Record<string, unknown>` constraint required by React Flow's `Node<NodeData>` generic. Using `data as ConceptNodeData` cast on `NodeProps` also failed because `Record<string, unknown>` and the interface don't overlap sufficiently.
- **Fix:** Changed `ConceptNodeData` from interface to type alias with index signature `[key: string]: unknown`. Used properly typed `NodeProps<Node<ConceptNodeData, "concept">>` instead of casting.
- **Files modified:** lib/graph-layout.ts, components/concept-node.tsx
- **Verification:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Committed in:** 174e933 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type fix necessary for TypeScript correctness. No scope creep.

## Issues Encountered
None beyond the type compatibility fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `lib/graph-layout.ts` and `components/concept-node.tsx` are ready for integration into the concept map panel
- Plan 03-02 will lift useConversation to ConversationShell, wire ConceptMap component with ReactFlowProvider, and implement click-to-scroll and fit-all button

## Self-Check: PASSED

- [x] lib/graph-layout.ts exists
- [x] components/concept-node.tsx exists
- [x] 03-01-SUMMARY.md exists
- [x] Commit 284421b exists
- [x] Commit 174e933 exists

---
*Phase: 03-concept-map*
*Completed: 2026-02-15*
