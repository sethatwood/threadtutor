"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/components/message";
import { ConfidenceCheckCard } from "@/components/confidence-check";
import type { Turn } from "@/lib/types";

interface ReplayConversationProps {
  turns: Turn[];
}

/**
 * Read-only message list for replay mode.
 *
 * Renders turns using the shared Message component. Confidence checks
 * are always displayed as assessed (isPending is never true in replay).
 * No input area, no error banner, no loading skeleton.
 */
export function ReplayConversation({ turns }: ReplayConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when turns change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6">
        {turns.map((turn) => {
          let assessedCard: React.ReactNode = null;

          if (
            turn.role === "assistant" &&
            turn.confidenceCheck &&
            turn.confidenceCheck.assessment
          ) {
            assessedCard = (
              <ConfidenceCheckCard
                check={turn.confidenceCheck}
                isPending={false}
              />
            );
          }

          return (
            <Message key={turn.turnNumber} turn={turn} beforeContent={assessedCard} />
          );
        })}

        {/* Scroll sentinel */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
