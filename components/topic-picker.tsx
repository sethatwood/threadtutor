"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { getApiKey, setApiKey } from "@/lib/api-key";
import { ConversationShell } from "@/components/conversation-shell";

const EXAMPLE_TOPICS = [
  "Bitcoin mining",
  "Photosynthesis",
  "How compilers work",
  "The French Revolution",
  "Quantum entanglement",
];

export function TopicPicker() {
  const [topic, setTopic] = useState("");
  const [apiKey, setApiKeyState] = useState("");
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // ---------------------------------------------------------------------------
  // On mount: read API key from localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stored = getApiKey();
    if (stored) {
      setApiKeyState(stored);
    }
    setApiKeyLoaded(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleStartLearning = () => {
    if (!topic.trim()) return;

    if (apiKey) {
      // Returning user with stored key: go straight to conversation
      setStarted(true);
    } else {
      // First-time user: show API key input
      setShowApiKeyInput(true);
    }
  };

  const handleBeginConversation = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey || !topic.trim()) return;
    setApiKey(trimmedKey);
    setApiKeyState(trimmedKey);
    setStarted(true);
  };

  const handleBack = () => {
    setStarted(false);
    setTopic("");
  };

  const handleTopicKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && topic.trim()) {
      handleStartLearning();
    }
  };

  const handleApiKeyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && apiKey.trim()) {
      handleBeginConversation();
    }
  };

  // ---------------------------------------------------------------------------
  // Render: conversation shell (after started)
  // ---------------------------------------------------------------------------
  if (started) {
    return (
      <ConversationShell
        topic={topic}
        apiKey={apiKey}
        onBack={handleBack}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render: topic picker (before started)
  // ---------------------------------------------------------------------------
  // Wait for localStorage read before rendering to avoid flash
  if (!apiKeyLoaded) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-lg px-6">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">ThreadTutor</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Socratic learning with AI
          </p>
        </div>

        <div className="space-y-6">
          {/* Topic heading */}
          <h2 className="text-center text-lg font-medium text-zinc-700">
            What would you like to learn about?
          </h2>

          {/* Topic input */}
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleTopicKeyDown}
            placeholder="Enter any topic..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base
                       placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          {/* Example topic chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-sm text-zinc-600
                           hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600
                           transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Start learning button (hidden once API key input is shown) */}
          {!showApiKeyInput && (
            <button
              type="button"
              onClick={handleStartLearning}
              disabled={!topic.trim()}
              className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-medium text-white
                         hover:bg-indigo-600
                         disabled:cursor-not-allowed disabled:opacity-40
                         transition-colors"
            >
              Start learning
            </button>
          )}

          {/* API key entry (shown inline after clicking "Start learning" when no stored key) */}
          {showApiKeyInput && (
            <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
              <label className="block text-sm font-medium text-zinc-700">
                Enter your Anthropic API key to begin
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                onKeyDown={handleApiKeyKeyDown}
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm
                           placeholder:text-zinc-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p className="text-xs text-zinc-400">
                Your key is stored in your browser only and sent directly to
                Anthropic.
              </p>
              <button
                type="button"
                onClick={handleBeginConversation}
                disabled={!apiKey.trim()}
                className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white
                           hover:bg-indigo-600
                           disabled:cursor-not-allowed disabled:opacity-40
                           transition-colors"
              >
                Begin conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
