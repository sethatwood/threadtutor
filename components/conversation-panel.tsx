"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { Message } from "@/components/message";
import { ConfidenceCheckCard } from "@/components/confidence-check";
import { SkeletonMessage } from "@/components/skeleton-message";
import type { Turn } from "@/lib/types";

interface ConversationPanelProps {
  state: {
    turns: Turn[];
    isLoading: boolean;
    error: string | null;
    pendingConfidenceCheck: boolean;
  };
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
}

export function ConversationPanel({
  state,
  sendMessage,
  clearError,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Auto-scroll to bottom when messages change or loading state changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.turns, state.isLoading]);

  // ---------------------------------------------------------------------------
  // Auto-growing textarea
  // ---------------------------------------------------------------------------
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  // ---------------------------------------------------------------------------
  // Send handler
  // ---------------------------------------------------------------------------
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || state.isLoading || state.pendingConfidenceCheck) return;
    sendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---------------------------------------------------------------------------
  // Determine which turn (if any) has the active confidence check
  // ---------------------------------------------------------------------------
  const lastAssistantIndex = (() => {
    for (let i = state.turns.length - 1; i >= 0; i--) {
      if (
        state.turns[i].role === "assistant" &&
        state.turns[i].confidenceCheck
      ) {
        return i;
      }
    }
    return -1;
  })();

  const inputDisabled = state.isLoading || state.pendingConfidenceCheck;

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        {state.turns.map((turn, i) => {
          // For assistant turns with a confidence check, determine card state
          let checkCard: React.ReactNode = null;

          if (turn.role === "assistant" && turn.confidenceCheck) {
            if (i === lastAssistantIndex && state.pendingConfidenceCheck) {
              // Active confidence check: show pending input
              checkCard = (
                <ConfidenceCheckCard
                  check={turn.confidenceCheck}
                  isPending={true}
                  onSubmit={(answer) => sendMessage(answer)}
                />
              );
            } else if (turn.confidenceCheck.assessment) {
              // Already assessed
              checkCard = (
                <ConfidenceCheckCard
                  check={turn.confidenceCheck}
                  isPending={false}
                />
              );
            }
          }

          return (
            <Message key={turn.turnNumber} turn={turn}>
              {checkCard}
            </Message>
          );
        })}

        {state.isLoading && <SkeletonMessage />}

        {/* Scroll sentinel */}
        <div ref={scrollRef} />
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="mx-4 md:mx-6 mb-2 flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-300">{state.error}</p>
          <button
            type="button"
            onClick={clearError}
            className="ml-4 text-sm font-medium text-rose-400 hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-zinc-800 px-4 md:px-6 py-3 md:py-4">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              state.pendingConfidenceCheck
                ? "Answer the question above..."
                : "Type your response..."
            }
            disabled={inputDisabled}
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-base text-zinc-100
                       placeholder:text-zinc-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                       disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || inputDisabled}
            className="self-end rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-indigo-500
                       disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
