"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConversation } from "@/lib/use-conversation";
import { ConversationPanel } from "@/components/conversation-panel";
import { ConceptMap } from "@/components/concept-map";
import { LearningJournal } from "@/components/learning-journal";

interface ConversationShellProps {
  topic: string;
  apiKey: string;
  onBack?: () => void;
}

export function ConversationShell({
  topic,
  apiKey,
  onBack,
}: ConversationShellProps) {
  const { state, sendMessage, clearError } = useConversation(topic, apiKey);

  // ---------------------------------------------------------------------------
  // Opening turn: send the first message to kick off the conversation
  // ---------------------------------------------------------------------------
  const didSendOpening = useRef(false);
  useEffect(() => {
    if (didSendOpening.current) return;
    didSendOpening.current = true;
    sendMessage(`I'd like to learn about ${topic}`);
  }, [topic, sendMessage]);

  // ---------------------------------------------------------------------------
  // Click-to-scroll: scroll conversation panel to the turn where a concept
  // was introduced when user clicks a node in the concept map
  // ---------------------------------------------------------------------------
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
          <span className="text-sm text-zinc-400">{topic}</span>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            New topic
          </button>
        )}
      </header>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Concept Map */}
        <div className="w-1/4 border-r border-zinc-800">
          <ConceptMap
            turns={state.turns}
            onConceptClick={handleConceptClick}
          />
        </div>

        {/* Center panel: Conversation */}
        <div className="flex w-1/2 flex-col">
          <ConversationPanel
            state={state}
            sendMessage={sendMessage}
            clearError={clearError}
          />
        </div>

        {/* Right panel: Learning Journal */}
        <div className="w-1/4 border-l border-zinc-800">
          <LearningJournal turns={state.turns} />
        </div>
      </div>
    </div>
  );
}
