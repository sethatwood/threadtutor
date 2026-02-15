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
          className="min-h-[44px] rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          Try it live
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          Exit
        </button>
      </AppHeader>

      {/* Three-panel body */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Concept Map */}
        <div className="order-2 h-[250px] shrink-0 border-t border-zinc-800 md:order-first md:h-auto md:w-1/4 md:border-r md:border-t-0">
          <ConceptMap
            turns={replay.visibleTurns}
            onConceptClick={handleConceptClick}
          />
        </div>

        {/* Replay Conversation + Controls */}
        <div className="order-1 flex min-h-0 flex-1 flex-col md:order-2 md:w-1/2">
          <div className="flex-1 overflow-hidden">
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

        {/* Learning Journal */}
        <div className="order-3 border-t border-zinc-800 md:w-1/4 md:border-l md:border-t-0">
          {/* Mobile: collapsible */}
          <details className="group md:hidden">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-300">
              Learning Journal
              <svg className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
      </div>
    </div>
  );
}
