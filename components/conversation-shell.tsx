"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConversation } from "@/lib/use-conversation";
import { saveSession, downloadSessionAsJson } from "@/lib/session-storage";
import { AppHeader } from "@/components/app-header";
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
      <AppHeader topic={topic} mode="live">
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
      </AppHeader>

      {/* Three-panel body */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Concept Map */}
        <div className="order-2 h-[250px] shrink-0 border-t border-zinc-800 md:order-first md:h-auto md:w-1/4 md:border-r md:border-t-0">
          <ConceptMap
            turns={state.turns}
            onConceptClick={handleConceptClick}
          />
        </div>

        {/* Conversation */}
        <div className="order-1 flex min-h-0 flex-1 flex-col md:order-2 md:w-1/2">
          <ConversationPanel
            state={state}
            sendMessage={sendMessage}
            clearError={clearError}
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
              <LearningJournal turns={state.turns} />
            </div>
          </details>
          {/* Desktop: always visible */}
          <div className="hidden md:flex md:h-full md:flex-col">
            <LearningJournal turns={state.turns} />
          </div>
        </div>
      </div>
    </div>
  );
}
