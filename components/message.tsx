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
      <div data-turn-number={turn.turnNumber} className="border-b border-zinc-800 py-5 md:py-6">
        <p className="mb-1.5 text-xs font-medium text-zinc-500">You</p>
        <p className="text-base text-zinc-300">{turn.displayText}</p>
      </div>
    );
  }

  return (
    <div data-turn-number={turn.turnNumber} className="border-b border-zinc-800 py-5 md:py-6">
      <p className="mb-1.5 text-xs font-medium text-indigo-400">Claude</p>
      <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:text-zinc-200 prose-headings:text-zinc-100 prose-strong:text-zinc-100 prose-code:text-indigo-300 prose-code:bg-zinc-800 prose-pre:bg-zinc-800">
        <Markdown>{turn.displayText}</Markdown>
      </div>
      {children}
    </div>
  );
}
