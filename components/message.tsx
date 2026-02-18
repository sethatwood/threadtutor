"use client";

import Markdown from "react-markdown";
import type { Turn } from "@/lib/types";

interface MessageProps {
  turn: Turn;
  children?: React.ReactNode;
  beforeContent?: React.ReactNode;
}

export function Message({ turn, children, beforeContent }: MessageProps) {
  if (turn.role === "user") {
    return (
      <div data-turn-number={turn.turnNumber} className="first:pt-0 border-b border-[var(--color-border)]/60 py-5 md:py-6">
        <p className="type-label mb-1.5 text-[var(--color-text-dim)]">You</p>
        <p className="text-base text-[var(--color-text-muted)]">{turn.displayText}</p>
      </div>
    );
  }

  return (
    <div data-turn-number={turn.turnNumber} className="first:pt-0 border-b border-[var(--color-border)]/60 py-5 md:py-6">
      <p className="type-label mb-1.5 text-[var(--color-accent-indigo)]">Claude</p>
      {beforeContent}
      <div style={{ maxWidth: "none" }} className="prose prose-sm md:prose-base prose-p:text-[var(--color-text)] prose-p:leading-[1.7] prose-headings:text-[var(--color-text)] prose-strong:text-[var(--color-text)] prose-code:text-[var(--color-accent-indigo)] prose-code:bg-[var(--color-surface)] prose-pre:bg-[var(--color-surface)]">
        <Markdown>{turn.displayText}</Markdown>
      </div>
      {children}
    </div>
  );
}
