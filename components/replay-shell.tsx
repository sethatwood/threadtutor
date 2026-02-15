"use client";

import { useCallback } from "react";
import { useReplayState } from "@/lib/use-replay-state";
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
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-zinc-100">
            ThreadTutor
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-sm text-zinc-400">{session.topic}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-400 border border-indigo-500/30 rounded-full px-2.5 py-0.5">
            Replay
          </span>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Concept Map */}
        <div className="w-1/4 border-r border-zinc-800">
          <ConceptMap
            turns={replay.visibleTurns}
            onConceptClick={handleConceptClick}
          />
        </div>

        {/* Center panel: Replay Conversation + Controls */}
        <div className="flex w-1/2 flex-col">
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

        {/* Right panel: Learning Journal */}
        <div className="w-1/4 border-l border-zinc-800">
          <LearningJournal turns={replay.visibleTurns} />
        </div>
      </div>
    </div>
  );
}
