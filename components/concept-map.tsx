"use client";

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Panel,
  Controls,
  useReactFlow,
  type NodeMouseHandler,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ConceptNode } from "@/components/concept-node";
import {
  collectAllConcepts,
  buildGraphElements,
  NODE_WIDTH,
  NODE_HEIGHT,
} from "@/lib/graph-layout";
import type { Turn } from "@/lib/types";

/** Fixed zoom for the inline panel -- large enough to read, small enough to show context. */
const INLINE_ZOOM = 0.85;

// ---------------------------------------------------------------------------
// Module-scope node type registration (must NOT be inside a component)
// ---------------------------------------------------------------------------

const nodeTypes = { concept: ConceptNode };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConceptMapProps {
  turns: Turn[];
  onConceptClick?: (turnNumber: number) => void;
}

interface InnerMapProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: NodeMouseHandler;
}

// ---------------------------------------------------------------------------
// Inline map inner (read-only thumbnail with expand button, no Controls)
// ---------------------------------------------------------------------------

function InlineMapInner({
  nodes,
  edges,
  onNodeClick,
  onExpand,
}: InnerMapProps & { onExpand: () => void }) {
  const { setViewport } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Shared helper: center viewport on the latest node at fixed zoom.
  const centerOnLatest = useCallback(
    (animate: boolean) => {
      const el = containerRef.current;
      if (!el || nodes.length === 0) return;

      const latest = nodes[nodes.length - 1];
      const { width, height } = el.getBoundingClientRect();
      const cx = latest.position.x + NODE_WIDTH / 2;
      const cy = latest.position.y + NODE_HEIGHT / 2;

      setViewport(
        {
          x: width / 2 - cx * INLINE_ZOOM,
          y: height / 2 - cy * INLINE_ZOOM,
          zoom: INLINE_ZOOM,
        },
        { duration: animate ? 300 : 0 },
      );
    },
    [nodes, setViewport],
  );

  // First render: center immediately once React Flow is ready (no animation).
  const handleInit = useCallback(() => {
    initialized.current = true;
    centerOnLatest(false);
  }, [centerOnLatest]);

  // Subsequent renders: animate to the latest node when new nodes appear.
  const prevNodeCount = useRef(0);
  useEffect(() => {
    if (
      initialized.current &&
      nodes.length > 0 &&
      nodes.length !== prevNodeCount.current
    ) {
      centerOnLatest(true);
    }
  }, [nodes, centerOnLatest]);

  useEffect(() => {
    prevNodeCount.current = nodes.length;
  }, [nodes.length]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onInit={handleInit}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        preventScrolling={true}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
      >
      <Controls showInteractive={false} />
      <Panel position="bottom-right">
        <button
          type="button"
          onClick={onExpand}
          title="Expand concept map"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] p-2 md:p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <polyline points="21 3 14 10" />
            <polyline points="3 21 10 14" />
          </svg>
        </button>
      </Panel>
    </ReactFlow>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fullscreen map inner (Controls, draggable nodes)
// ---------------------------------------------------------------------------

function FullscreenMapInner({ nodes, edges, onNodeClick }: InnerMapProps) {
  const { fitView } = useReactFlow();

  // On mount: small graphs fit entirely; large graphs focus on recent nodes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length <= 6) {
        fitView({ duration: 300, padding: 0.3 });
      } else {
        const recentNodes = nodes.slice(-4).map((n) => ({ id: n.id }));
        fitView({
          nodes: recentNodes,
          maxZoom: 1.2,
          duration: 300,
          padding: 0.3,
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView, nodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={false}
      preventScrolling={true}
      colorMode="dark"
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.1}
      maxZoom={3}
    >
      <Controls />
    </ReactFlow>
  );
}

// ---------------------------------------------------------------------------
// Outer component (manages fullscreen state, computes shared data)
// ---------------------------------------------------------------------------

export function ConceptMap({ turns, onConceptClick }: ConceptMapProps) {
  const [fullscreen, setFullscreen] = useState(false);

  // Derive concepts and graph elements (shared between inline and fullscreen)
  const concepts = useMemo(() => collectAllConcepts(turns), [turns]);
  const latestTurnNumber =
    turns.length > 0 ? turns[turns.length - 1].turnNumber : 0;
  const { nodes, edges } = useMemo(
    () => buildGraphElements(concepts, latestTurnNumber, "TB"),
    [concepts, latestTurnNumber],
  );

  // Handle node click: scroll conversation to the turn where concept was introduced
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const turnNumber = node.data?.turnNumber;
      if (typeof turnNumber === "number" && onConceptClick) {
        onConceptClick(turnNumber);
      }
    },
    [onConceptClick],
  );

  // Fullscreen open/close
  const openFullscreen = useCallback(() => setFullscreen(true), []);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  // Escape key to close fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen]);

  // Empty state (inline only)
  if (concepts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-[var(--color-text-dim)]">
          Concepts will appear here as you learn
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Inline panel (always visible) */}
      <ReactFlowProvider>
        <InlineMapInner
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onExpand={openFullscreen}
        />
      </ReactFlowProvider>

      {/* Fullscreen overlay (portal to document.body) */}
      {fullscreen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-[var(--color-bg)]/95">
            {/* Close button (bottom-right, mirrors expand button position) */}
            <button
              type="button"
              onClick={closeFullscreen}
              title="Close fullscreen"
              className="absolute bottom-4 right-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>

            <ReactFlowProvider>
              <FullscreenMapInner
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
              />
            </ReactFlowProvider>
          </div>,
          document.body,
        )}
    </>
  );
}
