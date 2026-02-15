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
import { collectAllConcepts, buildGraphElements } from "@/lib/graph-layout";
import type { Turn } from "@/lib/types";

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
  const { fitView } = useReactFlow();

  // Auto-fit viewport when new nodes appear
  const prevNodeCount = useRef(0);
  useEffect(() => {
    if (nodes.length > prevNodeCount.current && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 300, padding: 0.2 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  useEffect(() => {
    prevNodeCount.current = nodes.length;
  }, [nodes.length]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      preventScrolling={false}
      colorMode="dark"
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
      maxZoom={2}
    >
      <Panel position="bottom-right">
        <button
          type="button"
          onClick={onExpand}
          title="Expand concept map"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 p-2 md:p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
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
  );
}

// ---------------------------------------------------------------------------
// Fullscreen map inner (Controls, auto-fitView, draggable nodes)
// ---------------------------------------------------------------------------

function FullscreenMapInner({ nodes, edges, onNodeClick }: InnerMapProps) {
  const { fitView } = useReactFlow();

  // Auto-fit when fullscreen mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 300, padding: 0.2 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

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
      fitView
      fitViewOptions={{ padding: 0.2 }}
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
        <span className="text-sm text-zinc-600">
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
          <div className="fixed inset-0 z-50 bg-zinc-950/95">
            {/* Close button */}
            <button
              type="button"
              onClick={closeFullscreen}
              title="Close fullscreen"
              className="absolute top-4 right-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-zinc-800/80 border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
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
