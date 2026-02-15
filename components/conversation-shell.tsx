"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConversation } from "@/lib/use-conversation";
import { saveSession, downloadSessionAsJson } from "@/lib/session-storage";
import { ConversationPanel } from "@/components/conversation-panel";
import { ConceptMap } from "@/components/concept-map";
import { LearningJournal } from "@/components/learning-journal";
import type { Session } from "@/lib/types";

interface ConversationShellProps {
  topic: string;
  apiKey: string;
  onBack?: () => void;
  initialSession?: Session;
}

export function ConversationShell({
  topic,
  apiKey,
  onBack,
  initialSession,
}: ConversationShellProps) {
  const { state, sendMessage, clearError, restoreSession } = useConversation(topic, apiKey);

  // ---------------------------------------------------------------------------
  // Session identity: stable ID and creation timestamp for this conversation
  // Use initialSession values if loading a past session.
  // ---------------------------------------------------------------------------
  const sessionIdRef = useRef(initialSession?.id ?? crypto.randomUUID());
  const createdAtRef = useRef(initialSession?.createdAt ?? new Date().toISOString());

  // ---------------------------------------------------------------------------
  // Restore past session: hydrate conversation state from initialSession
  // ---------------------------------------------------------------------------
  const didRestoreSession = useRef(false);
  useEffect(() => {
    if (!initialSession || didRestoreSession.current) return;
    didRestoreSession.current = true;
    restoreSession(initialSession.turns, initialSession.turns.length);
  }, [initialSession, restoreSession]);

  // ---------------------------------------------------------------------------
  // Opening turn: send the first message to kick off the conversation.
  // Skipped when loading a past session (initialSession is provided).
  // ---------------------------------------------------------------------------
  const didSendOpening = useRef(false);
  useEffect(() => {
    if (initialSession) return;
    if (didSendOpening.current) return;
    didSendOpening.current = true;
    sendMessage(`I'd like to learn about ${topic}`);
  }, [topic, sendMessage, initialSession]);

  // ---------------------------------------------------------------------------
  // Auto-save: persist session to localStorage after every turn change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (state.turns.length === 0) return;
    const session = {
      id: sessionIdRef.current,
      topic,
      createdAt: createdAtRef.current,
      turns: state.turns,
    };
    saveSession(session);

    // In dev mode, also write to disk for session file generation
    if (process.env.NODE_ENV === "development") {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
    }
  }, [state.turns, topic]);

  // ---------------------------------------------------------------------------
  // Export: download the current session as a JSON file
  // ---------------------------------------------------------------------------
  const handleExport = useCallback(() => {
    const session: Session = {
      id: sessionIdRef.current,
      topic,
      createdAt: createdAtRef.current,
      turns: state.turns,
    };
    downloadSessionAsJson(session);
  }, [topic, state.turns]);

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

        <div className="flex items-center gap-2">
          {state.turns.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Export
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              New topic
            </button>
          )}
        </div>
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
