"use client";

import { useCallback } from "react";
import { useReplayState } from "@/lib/use-replay-state";
import { AppHeader } from "@/components/app-header";
import { ConceptMap } from "@/components/concept-map";
import { ReplayConversation } from "@/components/replay-conversation";
import { LearningJournal } from "@/components/learning-journal";
import { ReplayControls } from "@/components/replay-controls";
import type { Session } from "@/lib/types";

interface ReplayShellProps {
  session: Session;
  onBack?: () => void;
}

/**
 * Three-panel replay layout.
 *
 * Mirrors ConversationShell but replaces the live conversation with a
 * step-through replay driven by useReplayState. All panels receive
 * visibleTurns (the slice up to currentIndex) so they update in sync.
 */
export function ReplayShell({ session, onBack }: ReplayShellProps) {
  const replay = useReplayState(session);

  // Click-to-scroll: scroll conversation to the turn where a concept was introduced
  const handleConceptClick = useCallback((turnNumber: number) => {
    const el = document.querySelector(`[data-turn-number="${turnNumber}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <AppHeader topic={session.topic} mode="replay">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] rounded-md bg-[var(--color-primary-bg)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-bg-hover)] transition-all duration-150"
        >
          Try it live
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-all duration-150"
        >
          Exit
        </button>
      </AppHeader>

      {/* Golden-ratio body: chat + journal on top, concept map full-width below */}
      <div className="flex flex-1 flex-col overflow-hidden md:grid md:grid-cols-[1.618fr_1fr] md:grid-rows-[1.618fr_1fr]">
        {/* Replay Conversation + Controls (top-left, golden wide) */}
        <div className="relative order-1 flex min-h-0 flex-1 flex-col md:order-0">
          <div className="flex-1 overflow-y-auto pb-16">
            <ReplayConversation turns={replay.visibleTurns} />
          </div>
          <ReplayControls
            currentIndex={replay.currentIndex}
            totalTurns={replay.totalTurns}
            isPlaying={replay.isPlaying}
            isAtStart={replay.isAtStart}
            isAtEnd={replay.isAtEnd}
            next={replay.next}
            back={replay.back}
            toggleAutoPlay={replay.toggleAutoPlay}
          />
        </div>

        {/* Learning Journal (top-right, golden narrow) */}
        <div className="order-3 min-h-0 border-t border-[var(--color-border)]/50 md:order-0 md:border-t-0 md:border-l md:border-[var(--color-border)]/50">
          {/* Mobile: collapsible */}
          <details className="group md:hidden">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
              Learning Journal
              <svg className="h-4 w-4 text-[var(--color-text-dim)] transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </summary>
            <div className="max-h-[250px] overflow-y-auto">
              <LearningJournal turns={replay.visibleTurns} />
            </div>
          </details>
          {/* Desktop: always visible */}
          <div className="hidden md:flex md:h-full md:flex-col">
            <LearningJournal turns={replay.visibleTurns} />
          </div>
        </div>

        {/* Concept Map (bottom, full width) */}
        <div className="order-2 h-[250px] shrink-0 border-t border-[var(--color-border)]/50 md:order-0 md:h-auto md:col-span-2">
          <ConceptMap
            turns={replay.visibleTurns}
            onConceptClick={handleConceptClick}
          />
        </div>
      </div>
    </div>
  );
}
