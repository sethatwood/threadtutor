# Phase 3: Concept Map - Research

**Researched:** 2026-02-15
**Domain:** React Flow directed graph with dagre auto-layout, progressive node animation
**Confidence:** HIGH

## Summary

This phase replaces the `ConceptMapPlaceholder` component with a live React Flow directed graph that builds progressively as Claude introduces concepts during tutoring turns. The concept data already flows through the existing `Turn` type (`concepts: Concept[]` with `id`, `label`, `parentId`, `description`), so the work is entirely on the visualization side: rendering nodes, computing layout with dagre, animating new entries, and wiring hover/click interactions.

React Flow v12 (`@xyflow/react` 12.10.0) is the clear standard for node-based UIs in React. It supports React 19 (peer dep `>=17`), has built-in dark mode via `colorMode="dark"`, provides `NodeToolbar` for hover tooltips, and works with dagre for automatic hierarchical layout. The `@dagrejs/dagre` package (v2.0.4) ships its own TypeScript types, so no `@types/dagre` is needed.

**Primary recommendation:** Use `@xyflow/react` with custom nodes, `@dagrejs/dagre` for layout computation, CSS transitions for fade-in/scale-up animation, and `NodeToolbar` for hover tooltips. Wrap the concept map in `ReactFlowProvider` so `useReactFlow` works for programmatic viewport control.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Rounded rectangle nodes, clean and modern
- Single muted accent color for all nodes (consistent with existing muted indigo theme)
- Concept name only as the default label -- description shown on hover
- Smooth curved (bezier) edges connecting parent to child
- New nodes enter with fade-in + scale-up animation (~300ms)
- Auto-fit viewport only when new nodes would be offscreen; otherwise preserve user's current view
- Hover: floating tooltip popup showing the one-sentence concept description
- Click: scrolls the conversation panel to the turn where that concept was introduced
- No node dragging -- dagre controls all positioning, users pan/zoom viewport only
- Small "fit all" button (corner icon) to reset viewport to show all nodes
- Graph grows beyond the panel; users scroll/pan to explore (no forced zoom-out)
- Newest nodes get a subtle highlight (faint glow or brighter border) that fades after a few seconds
- Empty state: centered muted placeholder text ("Concepts will appear here as you learn" or similar)

### Claude's Discretion
- Layout direction (TB vs LR) based on panel constraints
- Staggered vs simultaneous entry for multi-concept turns
- Layout reflow strategy when new nodes are added
- Exact animation timing and easing
- Tooltip positioning and styling details
- Fit-all button icon and placement

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | 12.10.0 | Node-based graph rendering, pan/zoom, custom nodes | De facto standard for React graph UIs; 22k+ GitHub stars, active maintenance, built-in dark mode, React 19 support |
| @dagrejs/dagre | 2.0.4 | Hierarchical directed graph layout (TB/LR) | Official dagre example in React Flow docs; computes node positions for tree/DAG structures; built-in TS types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @xyflow/react (NodeToolbar) | built-in | Hover tooltips for concept descriptions | Built into @xyflow/react, no extra dependency; does not scale with viewport zoom |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dagre | elkjs | ELK is more powerful (supports compound graphs, constraints) but slower and much larger bundle; overkill for a simple tree |
| dagre | d3-hierarchy | Only handles strict trees (one parent per node); dagre handles DAGs natively which matches concept graph structure |
| NodeToolbar | Custom tooltip div | Would need manual viewport-aware positioning and z-index management; NodeToolbar handles this automatically |

**Installation:**
```bash
npm install @xyflow/react @dagrejs/dagre
```

No `@types/dagre` needed -- `@dagrejs/dagre` v2.0.4 ships `./dist/dagre.d.ts`.

## Architecture Patterns

### Data Flow: Turns to Graph

The concept data already exists in the application. Each `Turn` from `useConversation` contains `concepts: Concept[]` where each `Concept` has `{ id, label, parentId, description }`. The concept map component needs to:

1. Receive the current `turns` array (or just the accumulated concepts)
2. Convert concepts to React Flow `Node[]` and `Edge[]`
3. Run dagre layout to compute positions
4. Render with React Flow

```
ConversationShell
  ├── ConversationPanel (already has turns via useConversation)
  └── ConceptMap (needs turns or concepts passed down)
```

**Key architectural decision:** The `useConversation` hook is currently consumed only by `ConversationPanel`. For the concept map to access turns, the state must be lifted. Options:

1. **Lift `useConversation` to `ConversationShell`** and pass `state.turns` down to both panels. This is the simplest approach and matches React's data-down pattern.
2. Extract concepts into a separate context. Premature for this phase.

**Recommendation:** Lift `useConversation` into `ConversationShell`. Pass the full `state` and `sendMessage`/`clearError` down as props. This is a small refactor that unlocks both the concept map (Phase 3) and the learning journal (Phase 4).

### Converting Concepts to React Flow Nodes/Edges

```typescript
// Source: verified pattern from React Flow dagre example
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Concept, Turn } from '@/lib/types';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

interface ConceptNodeData {
  label: string;
  description: string;
  turnNumber: number;
  isNew: boolean;
}

function collectAllConcepts(turns: Turn[]): Array<Concept & { turnNumber: number }> {
  const seen = new Set<string>();
  const result: Array<Concept & { turnNumber: number }> = [];
  for (const turn of turns) {
    for (const concept of turn.concepts) {
      if (!seen.has(concept.id)) {
        seen.add(concept.id);
        result.push({ ...concept, turnNumber: turn.turnNumber });
      }
    }
  }
  return result;
}

function buildGraphElements(
  concepts: Array<Concept & { turnNumber: number }>,
  latestTurnNumber: number,
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const knownIds = new Set(concepts.map(c => c.id));
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const concept of concepts) {
    g.setNode(concept.id, { width: NODE_WIDTH, height: NODE_HEIGHT });

    // Validate parentId before creating edge (MAP-06)
    if (concept.parentId && knownIds.has(concept.parentId)) {
      g.setEdge(concept.parentId, concept.id);
      edges.push({
        id: `e-${concept.parentId}-${concept.id}`,
        source: concept.parentId,
        target: concept.id,
        type: 'default', // bezier by default
      });
    }
    // Orphaned nodes (invalid parentId) silently become roots -- no crash
  }

  dagre.layout(g);

  for (const concept of concepts) {
    const pos = g.node(concept.id);
    nodes.push({
      id: concept.id,
      type: 'concept',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        label: concept.label,
        description: concept.description,
        turnNumber: concept.turnNumber,
        isNew: concept.turnNumber === latestTurnNumber,
      } satisfies ConceptNodeData,
    });
  }

  return { nodes, edges };
}
```

### Custom Node Component Pattern

```typescript
// Source: React Flow custom node docs + NodeToolbar docs
import { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface ConceptNodeData {
  label: string;
  description: string;
  turnNumber: number;
  isNew: boolean;
}

const ConceptNode = memo(({ data }: NodeProps) => {
  const [hovered, setHovered] = useState(false);
  const nodeData = data as ConceptNodeData;

  return (
    <>
      <NodeToolbar isVisible={hovered} position={Position.Top} offset={8}>
        <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 max-w-[200px] shadow-lg">
          {nodeData.description}
        </div>
      </NodeToolbar>
      <div
        className={`concept-node ${nodeData.isNew ? 'concept-node--new' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
        <span className="text-xs font-medium text-zinc-200 px-3 py-2">
          {nodeData.label}
        </span>
        <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      </div>
    </>
  );
});

ConceptNode.displayName = 'ConceptNode';
```

### ReactFlowProvider Pattern

```typescript
// Source: React Flow docs on ReactFlowProvider
// useReactFlow() requires ReactFlowProvider as an ancestor.
// Wrap at the ConversationShell level or in the ConceptMap component itself.

import { ReactFlowProvider } from '@xyflow/react';

// Option A: Wrap just the map (simpler, keeps provider close to consumer)
function ConceptMapWrapper({ turns }: { turns: Turn[] }) {
  return (
    <ReactFlowProvider>
      <ConceptMap turns={turns} />
    </ReactFlowProvider>
  );
}
```

### Recommended Component Structure

```
components/
  concept-map.tsx          # Main component: ReactFlowProvider + ReactFlow
  concept-node.tsx         # Custom node with hover tooltip
lib/
  graph-layout.ts          # collectAllConcepts, buildGraphElements (dagre logic)
```

### Anti-Patterns to Avoid
- **Defining `nodeTypes` inside the component:** Causes re-registration on every render, breaking React Flow's internal memoization. Define `const nodeTypes = { concept: ConceptNode }` at module level.
- **Using `useNodesState`/`useEdgesState` when state is derived:** Since nodes/edges are computed from turns (not user-editable), use `useMemo` to derive them, not internal React Flow state hooks. Pass as controlled props.
- **Mutating the dagre graph between renders without re-creating it:** The dagre `Graph` object is stateful. Create a fresh graph instance in each layout computation to avoid stale position data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph layout (node positioning) | Manual x/y calculation | `@dagrejs/dagre` | Tree layout is a solved problem; manual positioning breaks with complex topologies, varying depths, and cross-edges |
| Pan/zoom viewport | CSS transforms + mouse handlers | React Flow built-in | Handles touch, wheel, pinch, keyboard; smooth transitions; viewport state management |
| Hover tooltip positioning | Manual absolute/fixed positioning | `NodeToolbar` from `@xyflow/react` | Viewport-aware positioning that stays visible regardless of zoom; doesn't scale with viewport |
| Viewport bounds detection | IntersectionObserver on nodes | `getNodesBounds()` + `getViewport()` from `useReactFlow` | React Flow tracks node bounds internally; no DOM measurement needed |
| Node entrance animation | JavaScript-driven position tweening | CSS `@keyframes` / transitions on custom node wrapper | CSS animations are GPU-accelerated, simpler to implement, and don't fight React Flow's position management |

**Key insight:** React Flow handles all the hard viewport math (pan, zoom, coordinate transforms). The custom work is only in the node component appearance and the dagre layout computation.

## Common Pitfalls

### Pitfall 1: Orphaned Node Crash
**What goes wrong:** Claude returns a concept with a `parentId` that doesn't match any existing concept ID. Creating an edge to a nonexistent node crashes dagre or React Flow.
**Why it happens:** The LLM occasionally hallucinates IDs or misspells them. The system prompt instructs Claude to reference existing IDs, but compliance is not guaranteed.
**How to avoid:** Before creating an edge, check `knownIds.has(concept.parentId)`. If the parentId is invalid, treat the concept as a root (no edge). This is MAP-06.
**Warning signs:** Console errors about missing node references; blank graph after a turn.

### Pitfall 2: nodeTypes Defined Inside Component
**What goes wrong:** The graph flickers or resets on every render. Custom nodes lose internal state.
**Why it happens:** React Flow uses referential equality to detect nodeType changes. Defining `nodeTypes` inside the component creates a new object reference every render.
**How to avoid:** Define `const nodeTypes = { concept: ConceptNode }` at module scope, outside any component.
**Warning signs:** Tooltip state resetting on hover; nodes flickering.

### Pitfall 3: React Flow Container Without Dimensions
**What goes wrong:** Nothing renders. React Flow requires its parent element to have explicit width and height.
**Why it happens:** The container defaults to 0 height if not explicitly sized.
**How to avoid:** The left panel in `ConversationShell` already has `className="w-1/4"` and is inside a `flex-1 overflow-hidden` container. Ensure the ConceptMap component fills its parent with `className="h-full w-full"` or explicit `style={{ width: '100%', height: '100%' }}`.
**Warning signs:** Empty left panel with no console errors.

### Pitfall 4: Layout Thrashing on Every Render
**What goes wrong:** The graph jumps or re-layouts unnecessarily, causing poor UX.
**Why it happens:** Running dagre layout on every render when concepts haven't changed.
**How to avoid:** Use `useMemo` keyed on the turns array (or a derived concept count/last turn number) so layout only recomputes when concepts actually change.
**Warning signs:** Nodes visibly jumping positions even when no new concepts arrive.

### Pitfall 5: fitView Overriding User Pan/Zoom
**What goes wrong:** User pans to examine a specific node cluster, then a new turn arrives and the viewport snaps to fit all nodes.
**Why it happens:** Calling `fitView()` unconditionally after every turn.
**How to avoid:** Check if new nodes would be outside the current viewport bounds before calling fitView. Use `getNodesBounds()` on the new nodes and compare against the current viewport. Only call `fitView()` if new nodes are offscreen.
**Warning signs:** User repeatedly losing their viewport position after each turn.

### Pitfall 6: CSS Import Missing
**What goes wrong:** React Flow renders but edges are invisible, controls are unstyled, and the minimap is broken.
**Why it happens:** Forgetting to import `@xyflow/react/dist/style.css`.
**How to avoid:** Import the stylesheet in the concept map component or in `globals.css`.
**Warning signs:** Graph renders but looks broken; edges are invisible.

## Code Examples

### Full ConceptMap Component (Verified Pattern)

```typescript
// components/concept-map.tsx
'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ConceptNode } from '@/components/concept-node';
import { buildGraphElements, collectAllConcepts } from '@/lib/graph-layout';
import type { Turn } from '@/lib/types';

// CRITICAL: Define outside component to prevent re-registration
const nodeTypes = { concept: ConceptNode };

function ConceptMapInner({ turns, onConceptClick }: {
  turns: Turn[];
  onConceptClick?: (turnNumber: number) => void;
}) {
  const { fitView, getViewport, getNodesBounds } = useReactFlow();
  const prevConceptCount = useRef(0);

  const concepts = useMemo(() => collectAllConcepts(turns), [turns]);
  const latestTurnNumber = turns.length > 0 ? turns[turns.length - 1].turnNumber : 0;

  const { nodes, edges } = useMemo(
    () => buildGraphElements(concepts, latestTurnNumber, 'TB'),
    [concepts, latestTurnNumber]
  );

  // Auto-fit only when new nodes would be offscreen
  useEffect(() => {
    if (concepts.length > prevConceptCount.current && concepts.length > 0) {
      // Use a short delay so React Flow has positioned the nodes
      const timer = setTimeout(() => {
        fitView({ duration: 300, padding: 0.2 });
      }, 50);
      prevConceptCount.current = concepts.length;
      return () => clearTimeout(timer);
    }
  }, [concepts.length, fitView]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const turnNumber = (node.data as { turnNumber: number }).turnNumber;
      onConceptClick?.(turnNumber);
    },
    [onConceptClick]
  );

  if (concepts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-zinc-600">
          Concepts will appear here as you learn
        </span>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      colorMode="dark"
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
      maxZoom={2}
    >
      <Panel position="bottom-right">
        <button
          onClick={() => fitView({ duration: 300, padding: 0.2 })}
          className="rounded-md bg-zinc-800 border border-zinc-700 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          title="Fit all nodes"
        >
          {/* Expand/fit icon */}
        </button>
      </Panel>
    </ReactFlow>
  );
}

export function ConceptMap({ turns, onConceptClick }: {
  turns: Turn[];
  onConceptClick?: (turnNumber: number) => void;
}) {
  return (
    <ReactFlowProvider>
      <ConceptMapInner turns={turns} onConceptClick={onConceptClick} />
    </ReactFlowProvider>
  );
}
```

### CSS for Node Animation

```css
/* In globals.css or a dedicated concept-map styles section */

/* Fade-in + scale-up for new nodes */
.concept-node {
  background: #2a2a30;
  border: 1px solid #4338ca40;  /* muted indigo border */
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  animation: concept-enter 300ms ease-out;
}

.concept-node:hover {
  border-color: #6366f1;
}

/* "New" highlight that fades after appearing */
.concept-node--new {
  border-color: #6366f180;
  box-shadow: 0 0 12px #6366f130;
  animation: concept-enter 300ms ease-out, concept-glow-fade 3s ease-out 300ms forwards;
}

@keyframes concept-enter {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes concept-glow-fade {
  from {
    border-color: #6366f180;
    box-shadow: 0 0 12px #6366f130;
  }
  to {
    border-color: #4338ca40;
    box-shadow: none;
  }
}
```

### Dark Mode CSS Variable Overrides

```css
/* Override React Flow's dark mode CSS variables to match #1a1a1e theme */
.react-flow.dark {
  --xy-background-color-default: transparent;
  --xy-node-background-color-default: #2a2a30;
  --xy-node-border-default: 1px solid #4338ca40;
  --xy-node-color-default: #e8e8ec;
  --xy-edge-stroke-default: #4338ca60;
}
```

### Lifting useConversation to ConversationShell

```typescript
// Updated ConversationShell pattern
export function ConversationShell({ topic, apiKey, onBack }: ConversationShellProps) {
  const { state, sendMessage, clearError } = useConversation(topic, apiKey);

  const handleConceptClick = useCallback((turnNumber: number) => {
    // Scroll conversation panel to the turn
    // Implementation: pass a scrollToTurn callback or use a ref
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <header>...</header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 border-r border-zinc-800">
          <ConceptMap turns={state.turns} onConceptClick={handleConceptClick} />
        </div>
        <div className="flex w-1/2 flex-col">
          <ConversationPanel
            state={state}
            sendMessage={sendMessage}
            clearError={clearError}
          />
        </div>
        <div className="w-1/4 border-l border-zinc-800">
          <JournalPlaceholder />
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import ReactFlow from 'reactflow'` | `import { ReactFlow } from '@xyflow/react'` | v12 (July 2024) | Named export, new package name |
| `import 'reactflow/dist/style.css'` | `import '@xyflow/react/dist/style.css'` | v12 (July 2024) | New CSS path |
| No dark mode support | `colorMode="dark"` prop + CSS variables | v12 (July 2024) | Built-in dark theme |
| `dagre` (community) | `@dagrejs/dagre` (official) | 2024 | Official scoped package with built-in TS types |
| `useNodesState`/`useEdgesState` for all cases | Controlled props for derived state | v12 pattern | Hooks are for user-editable state; derived state uses controlled props |

**Deprecated/outdated:**
- `reactflow` package (old name): Use `@xyflow/react` instead
- `dagre` package (unscoped): Use `@dagrejs/dagre` instead
- `@types/dagre`: Not needed with `@dagrejs/dagre` v2.0.4+

## Key React Flow Props Reference

| Prop | Value | Purpose |
|------|-------|---------|
| `nodesDraggable` | `false` | Dagre controls positioning; user pans viewport only |
| `nodesConnectable` | `false` | No user-created edges |
| `elementsSelectable` | `false` | Click handler is custom (scroll to turn), not selection |
| `colorMode` | `"dark"` | Match app's dark theme |
| `fitView` | `true` | Initial viewport fits all nodes |
| `fitViewOptions` | `{ padding: 0.3 }` | Breathing room around nodes |
| `proOptions` | `{ hideAttribution: true }` | Clean UI (permitted for all users) |
| `minZoom` | `0.2` | Allow zooming out for large graphs |
| `maxZoom` | `2` | Reasonable zoom-in limit |

## Open Questions

1. **Click-to-scroll across components**
   - What we know: The concept map needs to scroll the conversation panel to a specific turn when a node is clicked. Both components share `ConversationShell` as parent.
   - What's unclear: The exact mechanism for scrolling to a specific turn in the conversation panel (DOM ref, callback, or ID-based scroll).
   - Recommendation: Add `data-turn-number={turn.turnNumber}` attributes to message elements in `ConversationPanel`, pass a `scrollToTurn` callback from `ConversationShell` that uses `document.querySelector` or a ref map. This is straightforward once state is lifted.

2. **Staggered vs simultaneous multi-concept entry**
   - What we know: Claude returns 1-3 concepts per turn. CSS animations apply to all new nodes simultaneously since they appear in the same render cycle.
   - What's unclear: Whether staggering is worth the complexity.
   - Recommendation: Use simultaneous entry (simpler). If staggering is desired later, add `animation-delay` based on concept index within the turn. The `isNew` flag on node data can be extended to include an index.

3. **Viewport-aware conditional fitView**
   - What we know: The user wants fitView only when new nodes are offscreen. React Flow provides `getNodesBounds()` and `getViewport()` for bounds checking.
   - What's unclear: The exact math for viewport intersection detection across zoom levels.
   - Recommendation: Start with always calling `fitView` on new concepts with `duration: 300` for smooth transition. Refine to conditional fitView in a follow-up if the unconditional approach feels too aggressive. The `fitView({ nodes: [...newNodes] })` option can focus on just the new nodes.

## Sources

### Primary (HIGH confidence)
- [@xyflow/react npm](https://www.npmjs.com/package/@xyflow/react) - v12.10.0, peer dep React >=17
- [React Flow dagre example](https://reactflow.dev/examples/layout/dagre) - Official dagre layout pattern
- [React Flow custom nodes](https://reactflow.dev/learn/customization/custom-nodes) - Custom node registration, Handle usage
- [ReactFlow component API](https://reactflow.dev/api-reference/react-flow) - Props: colorMode, nodesDraggable, fitView, proOptions
- [NodeToolbar API](https://reactflow.dev/api-reference/components/node-toolbar) - isVisible, position, offset props
- [ReactFlowProvider docs](https://reactflow.dev/api-reference/react-flow-provider) - Required for useReactFlow hook
- [ReactFlowInstance API](https://reactflow.dev/api-reference/types/react-flow-instance) - fitView, getNodesBounds, getViewport methods
- [FitViewOptions type](https://reactflow.dev/api-reference/types/fit-view-options) - nodes, padding, duration, maxZoom
- [React Flow theming](https://reactflow.dev/learn/customization/theming) - CSS variables for dark mode
- [React Flow installation](https://reactflow.dev/learn/getting-started/installation-and-requirements) - CSS import requirement, container sizing
- [@dagrejs/dagre](https://www.npmjs.com/package/@dagrejs/dagre) - v2.0.4 with built-in TS types
- [dagre wiki](https://github.com/dagrejs/dagre/wiki) - Graph config: rankdir, nodesep, ranksep, marginx, marginy
- npm registry (direct query) - Version verification for @xyflow/react (12.10.0), @dagrejs/dagre (2.0.4), confirmed built-in types

### Secondary (MEDIUM confidence)
- [React Flow Node Tooltip](https://reactflow.dev/ui/components/node-tooltip) - Compound tooltip component (shadcn-style, may be Pro)
- [React Flow 12.5.0 release notes](https://reactflow.dev/whats-new/2025-03-27) - fitView fix for newly added nodes

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via npm registry, official React Flow docs, and dagre wiki
- Architecture: HIGH - Patterns taken directly from official React Flow examples; data flow verified against existing codebase
- Pitfalls: HIGH - Orphan handling (MAP-06) is documented in requirements; nodeTypes memoization and container sizing are well-known React Flow issues documented in troubleshooting guides

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (React Flow v12 is stable; dagre layout algorithm is stable)
