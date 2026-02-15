"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  type NodeMouseHandler,
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

// ---------------------------------------------------------------------------
// Inner component (uses useReactFlow, must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

function ConceptMapInner({ turns, onConceptClick }: ConceptMapProps) {
  const { fitView } = useReactFlow();

  // Derive concepts from turns
  const concepts = useMemo(() => collectAllConcepts(turns), [turns]);

  // Track the latest turn number for recency highlighting
  const latestTurnNumber =
    turns.length > 0 ? turns[turns.length - 1].turnNumber : 0;

  // Build positioned nodes and edges via dagre
  const { nodes, edges } = useMemo(
    () => buildGraphElements(concepts, latestTurnNumber, "TB"),
    [concepts, latestTurnNumber],
  );

  // Auto-fit viewport when new concepts appear
  const prevConceptCount = useRef(0);
  useEffect(() => {
    if (concepts.length > prevConceptCount.current && concepts.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 300, padding: 0.2 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [concepts.length, fitView]);

  useEffect(() => {
    prevConceptCount.current = concepts.length;
  }, [concepts.length]);

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

  // Handle fit-all button
  const handleFitAll = useCallback(() => {
    fitView({ duration: 300, padding: 0.2 });
  }, [fitView]);

  // Empty state
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
          onClick={handleFitAll}
          title="Fit all nodes"
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
// Outer component (provides ReactFlowProvider wrapper)
// ---------------------------------------------------------------------------

export function ConceptMap({ turns, onConceptClick }: ConceptMapProps) {
  return (
    <ReactFlowProvider>
      <ConceptMapInner turns={turns} onConceptClick={onConceptClick} />
    </ReactFlowProvider>
  );
}
