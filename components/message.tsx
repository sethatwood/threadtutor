"use client";

import Markdown from "react-markdown";
import type { Turn } from "@/lib/types";

interface MessageProps {
  turn: Turn;
  children?: React.ReactNode;
}

export function Message({ turn, children }: MessageProps) {
  if (turn.role === "user") {
    return (
      <div className="border-b border-zinc-100 py-5">
        <p className="mb-1 text-xs font-medium text-zinc-400">You</p>
        <p className="text-zinc-600">{turn.displayText}</p>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-100 py-5">
      <p className="mb-1 text-xs font-medium text-indigo-400">Claude</p>
      <div className="prose prose-zinc prose-sm max-w-none">
        <Markdown>{turn.displayText}</Markdown>
      </div>
      {children}
    </div>
  );
}
