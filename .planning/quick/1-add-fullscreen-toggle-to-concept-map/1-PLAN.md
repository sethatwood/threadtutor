---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/concept-map.tsx
  - components/conversation-shell.tsx
  - components/replay-shell.tsx
autonomous: true

must_haves:
  truths:
    - "Clicking the expand button on the inline concept map opens a fullscreen overlay"
    - "Fullscreen overlay shows React Flow Controls (zoom in, zoom out, fit view)"
    - "Clicking the close button returns to the three-panel layout"
    - "fitView is called automatically when fullscreen opens"
    - "Inline concept map remains visible as a read-only thumbnail (no controls)"
    - "Works in both ConversationShell (live mode) and ReplayShell (replay mode)"
  artifacts:
    - path: "components/concept-map.tsx"
      provides: "ConceptMap with expand button, fullscreen overlay logic, Controls import"
      contains: "Controls"
    - path: "components/conversation-shell.tsx"
      provides: "Live shell rendering ConceptMap (unchanged API)"
    - path: "components/replay-shell.tsx"
      provides: "Replay shell rendering ConceptMap (unchanged API)"
  key_links:
    - from: "components/concept-map.tsx (expand button)"
      to: "fullscreen overlay state"
      via: "useState boolean toggle"
      pattern: "setFullscreen"
    - from: "components/concept-map.tsx (fullscreen overlay)"
      to: "React Flow Controls"
      via: "Controls component from @xyflow/react"
      pattern: "<Controls"
---

<objective>
Add a fullscreen toggle to the concept map component. Replace the current fit-all button (bottom-right) with an expand button that opens a fullscreen dark overlay (fixed, inset-0, z-50). In fullscreen: show React Flow's built-in Controls component for zoom/fit, add a close button (top-right), and auto-fitView on open. The inline panel stays as a read-only thumbnail with no controls. Both ConversationShell and ReplayShell use ConceptMap, so the change is self-contained in concept-map.tsx.

Purpose: Let users explore the concept map in detail without the cramped 1/4-width panel.
Output: Updated concept-map.tsx with fullscreen overlay behavior.
</objective>

<execution_context>
@/Users/yayseth/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yayseth/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/concept-map.tsx
@components/concept-node.tsx
@components/conversation-shell.tsx
@components/replay-shell.tsx
@lib/graph-layout.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add fullscreen overlay to ConceptMap component</name>
  <files>components/concept-map.tsx</files>
  <action>
Refactor concept-map.tsx to support a fullscreen overlay mode. The key insight: both inline and fullscreen views share the same data (turns, concepts, nodes, edges) but need separate ReactFlow instances because they render in different DOM contexts.

Architecture:
- Add `Controls` import from `@xyflow/react` and import its CSS (`@xyflow/react/dist/style.css` is already imported).
- Add `useState` for `fullscreen` boolean in the outer `ConceptMap` component (not ConceptMapInner), since state needs to persist across the two views.
- The outer ConceptMap component manages the fullscreen state and renders:
  1. The inline panel (always): wrap existing ConceptMapInner, but replace the fit-all button with an expand button (same position: Panel bottom-right). Use an expand/maximize SVG icon (arrows pointing outward). The inline view keeps `preventScrolling={false}` and does NOT show Controls.
  2. The fullscreen overlay (when fullscreen=true): a `fixed inset-0 z-50 bg-zinc-950/95` div containing a second ReactFlow instance with the same nodes/edges/nodeTypes. This fullscreen instance should have:
     - `preventScrolling={true}` (capture scroll for zoom in fullscreen)
     - React Flow `<Controls />` component (provides zoom in, zoom out, fit view, lock toggle)
     - A close button: `absolute top-4 right-4 z-10`, white X icon on semi-transparent bg, min-h-[44px] for touch targets
     - `fitView` prop plus `fitViewOptions={{ padding: 0.2 }}`
     - Same nodeTypes, colorMode="dark", proOptions as inline
     - `nodesDraggable={true}` (allow dragging in fullscreen for exploration)
     - Keep `nodesConnectable={false}`, `elementsSelectable={false}`
     - Keep `onNodeClick={handleNodeClick}` for concept-click-to-scroll (works even in fullscreen since it queries DOM)

  To handle fitView on open: use a useEffect that watches the `fullscreen` flag. When it transitions to true, call fitView after a short delay (100ms) on the fullscreen ReactFlow instance. Since the fullscreen view is a separate ReactFlowProvider, create a small inner component (FullscreenMapInner) that uses useReactFlow() to get fitView, and runs the effect internally.

Refactored structure:
```
ConceptMap (outer, manages fullscreen state, computes nodes/edges)
  -> ReactFlowProvider (inline)
       -> InlineMapInner (ReactFlow + expand button, no Controls)
  -> {fullscreen && createPortal(
       <div className="fixed inset-0 z-50 bg-zinc-950/95">
         <button close />
         <ReactFlowProvider>
           <FullscreenMapInner (ReactFlow + Controls, auto-fitView) />
         </ReactFlowProvider>
       </div>,
       document.body
     )}
```

Use `createPortal` from `react-dom` to render the fullscreen overlay at document.body level, ensuring it escapes any overflow:hidden containers.

Move the shared data computation (collectAllConcepts, buildGraphElements, latestTurnNumber) up to the outer ConceptMap component and pass nodes/edges down as props to both inner components.

For the expand button SVG, use an expand/maximize icon:
```
<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
```
(Same icon currently used, which is already an expand icon -- keep it.)

For the close button SVG, use an X icon:
```
<line x1="18" y1="6" x2="6" y2="18" />
<line x1="6" y1="6" x2="18" y2="18" />
```

Style the Controls component to match dark theme: add className="react-flow-controls-dark" or rely on colorMode="dark" which @xyflow/react v12 already handles.

Keep the empty state rendering (no concepts yet message) in the inline view only. In fullscreen, if somehow triggered with no concepts, just show the empty overlay with the close button.

Handle Escape key: add a useEffect when fullscreen=true that listens for keydown "Escape" to close.
  </action>
  <verify>
Run `npm run build` -- no type errors, no build errors.
Run `npm run lint` -- no lint warnings.
Manually verify: the ConceptMap component renders an expand button in the inline panel, clicking it opens a fullscreen overlay with Controls and a close button, pressing Escape or clicking close returns to normal view.
  </verify>
  <done>
The concept map inline panel shows an expand button (bottom-right). Clicking it opens a fullscreen overlay (fixed, z-50, dark background) with React Flow Controls (zoom +/-, fit view), a close button (top-right), and auto-fitView on open. Escape key closes the overlay. The inline panel has no Controls component. Works for both ConversationShell and ReplayShell since they both use the same ConceptMap component with no API changes.
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify build and both shell integrations</name>
  <files>components/conversation-shell.tsx, components/replay-shell.tsx</files>
  <action>
Verify that ConversationShell and ReplayShell require NO changes since ConceptMap's props interface (turns, onConceptClick) is unchanged. Run the build to confirm.

If the build passes with no changes to the shell files, this task is a no-op verification. If there are type errors or issues, fix them.

Also verify that the @xyflow/react Controls component CSS is properly included. The existing `@xyflow/react/dist/style.css` import in concept-map.tsx should already include Controls styles in v12. If Controls appear unstyled, check whether a separate CSS import is needed (e.g., `@xyflow/react/dist/style.css` covers it in v12).
  </action>
  <verify>
Run `npm run build` -- clean build, zero errors.
Run `npm run lint` -- clean lint.
Grep for ConceptMap usage in both shells to confirm no API breakage: `grep -n "ConceptMap" components/conversation-shell.tsx components/replay-shell.tsx` shows same props as before (turns + onConceptClick).
  </verify>
  <done>
Both ConversationShell and ReplayShell work with the updated ConceptMap without any changes to their code. Build and lint pass cleanly.
  </done>
</task>

</tasks>

<verification>
- `npm run build` passes with no errors
- `npm run lint` passes with no warnings
- ConceptMap inline view shows expand button (bottom-right), no Controls
- Clicking expand opens fullscreen overlay (fixed inset-0 z-50 dark background)
- Fullscreen overlay shows React Flow Controls (zoom in, zoom out, fit view)
- Fullscreen overlay has close button (top-right)
- Pressing Escape closes fullscreen overlay
- fitView fires automatically when fullscreen opens
- Nodes are draggable in fullscreen mode
- Node click in fullscreen still scrolls conversation panel to relevant turn
- Both /replay and live conversation pages work identically
</verification>

<success_criteria>
Concept map has a working fullscreen toggle: expand button in inline panel opens a fullscreen overlay with Controls and close button. Both ConversationShell and ReplayShell support it with zero API changes. Build and lint pass.
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-fullscreen-toggle-to-concept-map/1-SUMMARY.md`
</output>
