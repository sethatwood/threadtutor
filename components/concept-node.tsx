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
        <div className="rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)] max-w-[200px] shadow-lg">
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
        <span className="font-mono text-sm tracking-wide text-[var(--color-text)] px-4 py-3">
          {data.label}
        </span>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-transparent !border-0 !w-0 !h-0"
        />
        {data.isNew && (
          <div className="echo-rings">
            <div className="echo-ring" />
            <div className="echo-ring" />
            <div className="echo-ring" />
          </div>
        )}
      </div>
    </>
  );
});

ConceptNode.displayName = "ConceptNode";

export { ConceptNode };
