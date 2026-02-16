"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Turn } from "@/lib/types";

interface LearningJournalProps {
  turns: Turn[];
}

export function LearningJournal({ turns }: LearningJournalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => {
    return turns
      .filter(
        (t): t is Turn & { journalEntry: string } =>
          t.role === "assistant" && t.journalEntry !== null,
      )
      .map((t, index) => ({
        number: index + 1,
        text: t.journalEntry,
        turnNumber: t.turnNumber,
      }));
  }, [turns]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-zinc-600">
          Your learning journal will appear here
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="type-label text-zinc-300">
          Learning Journal
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.turnNumber}
              className="journal-entry text-sm text-zinc-400"
            >
              <span className="mr-2 font-mono text-xs text-indigo-400/60">
                {entry.number}.
              </span>
              {entry.text}
            </li>
          ))}
        </ol>
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
