import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Concept, Turn } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NODE_HEIGHT = 48;

/** Aesthetic floor so very short labels don't produce tiny nodes. */
const NODE_MIN_WIDTH = 120;

/**
 * Estimate rendered node width from label text.
 *
 * The ConceptNode renders with `font-mono text-sm tracking-wide` inside
 * `px-4` padding with a 1px border:
 *   - monospace 14px + 0.025em tracking ~ 8.75px per character
 *   - horizontal padding: 32px (px-4 each side) + 2px border = 34px
 */
export function estimateNodeWidth(label: string): number {
  const CHAR_WIDTH = 8.75;
  const H_PADDING = 34;
  return Math.max(NODE_MIN_WIDTH, Math.ceil(CHAR_WIDTH * label.length + H_PADDING));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data payload for the custom ConceptNode component. */
export type ConceptNodeData = {
  label: string;
  description: string;
  turnNumber: number;
  isNew: boolean;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect all concepts across turns, deduplicated by id.
 * Preserves which turn introduced each concept (for recency highlighting
 * and click-to-scroll).
 */
export function collectAllConcepts(
  turns: Turn[],
): Array<Concept & { turnNumber: number }> {
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

/**
 * Convert concept array into React Flow nodes and edges with dagre-computed
 * positions. Orphaned nodes (invalid parentId) silently become roots -- no
 * crash (MAP-06).
 */
export function buildGraphElements(
  concepts: Array<Concept & { turnNumber: number }>,
  latestTurnNumber: number,
  direction: "TB" | "LR" = "TB",
): { nodes: Node[]; edges: Edge[] } {
  if (concepts.length === 0) {
    return { nodes: [], edges: [] };
  }

  const knownIds = new Set(concepts.map((c) => c.id));

  // Fresh graph each call -- anti-pattern to reuse across renders
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 56, ranksep: 72 });

  const edges: Edge[] = [];
  const widths = new Map<string, number>();

  for (const concept of concepts) {
    const w = estimateNodeWidth(concept.label);
    widths.set(concept.id, w);
    g.setNode(concept.id, { width: w, height: NODE_HEIGHT });

    // Validate parentId before creating edge (MAP-06: orphaned nodes become roots)
    if (concept.parentId && knownIds.has(concept.parentId)) {
      g.setEdge(concept.parentId, concept.id);
      edges.push({
        id: `e-${concept.parentId}-${concept.id}`,
        source: concept.parentId,
        target: concept.id,
      });
    }
  }

  dagre.layout(g);

  const nodes: Node[] = concepts.map((concept) => {
    const pos = g.node(concept.id);
    const w = widths.get(concept.id)!;
    return {
      id: concept.id,
      type: "concept",
      position: { x: pos.x - w / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        label: concept.label,
        description: concept.description,
        turnNumber: concept.turnNumber,
        isNew: concept.turnNumber === latestTurnNumber,
      } satisfies ConceptNodeData,
    };
  });

  return { nodes, edges };
}
