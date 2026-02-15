"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { Turn, TurnResponse } from "@/lib/types";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type ConversationState = {
  turns: Turn[];
  isLoading: boolean;
  error: string | null;
  pendingConfidenceCheck: boolean;
  turnNumber: number;
};

const initialState: ConversationState = {
  turns: [],
  isLoading: false,
  error: null,
  pendingConfidenceCheck: false,
  turnNumber: 0,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type ConversationAction =
  | { type: "SEND_MESSAGE" }
  | { type: "RECEIVE_RESPONSE"; payload: TurnResponse }
  | { type: "ADD_USER_TURN"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "LOAD_SESSION"; payload: { turns: Turn[]; turnNumber: number } };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case "SEND_MESSAGE":
      return { ...state, isLoading: true, error: null };

    case "RECEIVE_RESPONSE": {
      const newTurn: Turn = {
        turnNumber: state.turnNumber + 1,
        role: "assistant",
        displayText: action.payload.displayText,
        concepts: action.payload.concepts,
        confidenceCheck: action.payload.confidenceCheck,
        journalEntry: action.payload.journalEntry,
      };
      return {
        ...state,
        turns: [...state.turns, newTurn],
        isLoading: false,
        pendingConfidenceCheck:
          action.payload.confidenceCheck !== null &&
          action.payload.confidenceCheck.assessment === undefined,
        turnNumber: state.turnNumber + 1,
      };
    }

    case "ADD_USER_TURN": {
      const userTurn: Turn = {
        turnNumber: state.turnNumber + 1,
        role: "user",
        displayText: action.payload,
        concepts: [],
        confidenceCheck: null,
        journalEntry: null,
      };
      return {
        ...state,
        turns: [...state.turns, userTurn],
        turnNumber: state.turnNumber + 1,
        pendingConfidenceCheck: false,
      };
    }

    case "SET_ERROR":
      return { ...state, isLoading: false, error: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "LOAD_SESSION":
      return {
        ...state,
        turns: action.payload.turns,
        turnNumber: action.payload.turnNumber,
        isLoading: false,
        error: null,
        pendingConfidenceCheck: false,
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers (internal)
// ---------------------------------------------------------------------------

/**
 * Map Turn[] to the message format expected by the Anthropic API.
 * Each message includes the role and displayText content.
 */
function buildMessages(turns: Turn[]): MessageParam[] {
  return turns.map((turn) => ({
    role: turn.role,
    content: turn.displayText,
  }));
}

/**
 * Collect all concepts from every turn, deduplicated by id.
 * Returns a minimal array of { id, label } for the system prompt.
 */
function collectConcepts(
  turns: Turn[],
): Array<{ id: string; label: string }> {
  const seen = new Set<string>();
  const concepts: Array<{ id: string; label: string }> = [];

  for (const turn of turns) {
    for (const concept of turn.concepts) {
      if (!seen.has(concept.id)) {
        seen.add(concept.id);
        concepts.push({ id: concept.id, label: concept.label });
      }
    }
  }

  return concepts;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useConversation(topic: string, apiKey: string) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  // Keep a ref to the latest state so sendMessage (memoized via useCallback)
  // always reads fresh turns without needing state in its dependency array.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      // 1. Add the user turn immediately so it appears in the UI
      dispatch({ type: "ADD_USER_TURN", payload: text });

      // 2. Set loading state
      dispatch({ type: "SEND_MESSAGE" });

      try {
        // 3. Build the full message history including the new user message
        const currentTurns = stateRef.current.turns;
        const messages: MessageParam[] = [
          ...buildMessages(currentTurns),
          { role: "user" as const, content: text },
        ];

        // 4. Collect existing concepts from all turns
        const existingConcepts = collectConcepts(currentTurns);

        // 5. Call the API route
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            topic,
            apiKey,
            existingConcepts,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to send message",
          );
        }

        // 6. Parse and dispatch the response
        const turnResponse: TurnResponse = await response.json();
        dispatch({ type: "RECEIVE_RESPONSE", payload: turnResponse });
      } catch (err) {
        // 7. Surface error to the UI
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        dispatch({ type: "SET_ERROR", payload: message });
      }
    },
    [topic, apiKey],
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const restoreSession = useCallback((turns: Turn[], turnNumber: number) => {
    dispatch({ type: "LOAD_SESSION", payload: { turns, turnNumber } });
  }, []);

  return { state, sendMessage, clearError, restoreSession };
}
