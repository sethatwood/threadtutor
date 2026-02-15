"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { ConceptNodeData } from "@/lib/graph-layout";

type ConceptNodeType = Node<ConceptNodeData, "concept">;

const ConceptNode = memo(({ data }: NodeProps<ConceptNodeType>) => {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <NodeToolbar isVisible={hovered} position={Position.Top} offset={8}>
        <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 max-w-[200px] shadow-lg">
          {data.description}
        </div>
      </NodeToolbar>
      <div
        className={`concept-node ${data.isNew ? "concept-node--new" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-transparent !border-0 !w-0 !h-0"
        />
        <span className="text-base font-medium text-zinc-200 px-4 py-3">
          {data.label}
        </span>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-transparent !border-0 !w-0 !h-0"
        />
      </div>
    </>
  );
});

ConceptNode.displayName = "ConceptNode";

export { ConceptNode };
