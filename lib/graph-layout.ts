import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Concept, Turn } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data payload for the custom ConceptNode component. */
export interface ConceptNodeData {
  label: string;
  description: string;
  turnNumber: number;
  isNew: boolean;
}

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
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  const edges: Edge[] = [];

  for (const concept of concepts) {
    g.setNode(concept.id, { width: NODE_WIDTH, height: NODE_HEIGHT });

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
    return {
      id: concept.id,
      type: "concept",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
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
