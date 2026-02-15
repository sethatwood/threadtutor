"use client";

import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { getApiKey, setApiKey } from "@/lib/api-key";
import { ConversationShell } from "@/components/conversation-shell";
import { ReplayShell } from "@/components/replay-shell";
import { SessionList } from "@/components/session-list";
import type { Session } from "@/lib/types";

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
  const [loadedSession, setLoadedSession] = useState<Session | null>(null);
  const [demoSession, setDemoSession] = useState<Session | null>(null);
  const [demoLoading, setDemoLoading] = useState(true);
  const [demoError, setDemoError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch demo.json helper
  // ---------------------------------------------------------------------------
  const fetchDemo = useCallback(async () => {
    try {
      setDemoLoading(true);
      setDemoError(null);
      const res = await fetch("/demo.json");
      if (!res.ok) throw new Error("Failed to load demo");
      const session: Session = await res.json();
      setDemoSession(session);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Failed to load demo");
    } finally {
      setDemoLoading(false);
    }
  }, []);

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
  // Auto-load demo for visitors without an API key
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!apiKeyLoaded) return;
    if (apiKey) {
      // User has an API key; skip auto-load
      setDemoLoading(false);
      return;
    }
    fetchDemo();
  }, [apiKeyLoaded, apiKey, fetchDemo]);

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
    setLoadedSession(null);
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
  // Render: conversation shell (after started or loading a past session)
  // ---------------------------------------------------------------------------
  if (loadedSession) {
    return (
      <ConversationShell
        topic={loadedSession.topic}
        apiKey={apiKey}
        onBack={handleBack}
        initialSession={loadedSession}
      />
    );
  }

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
  // Render: demo replay (for visitors without API key, or after clicking
  // "Watch demo")
  // ---------------------------------------------------------------------------
  if (demoSession && !started && !loadedSession) {
    return (
      <ReplayShell
        session={demoSession}
        onBack={() => setDemoSession(null)}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render: topic picker (before started)
  // ---------------------------------------------------------------------------
  // Wait for localStorage read before rendering to avoid flash
  if (!apiKeyLoaded) return null;

  // Loading demo for keyless visitors
  if (demoLoading && !apiKey) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading demo...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-lg px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 512 512"
            fill="none"
            aria-hidden="true"
            className="mb-2"
          >
            <path
              d="M164 128 L336 256 L164 384"
              stroke="#6366f1"
              strokeWidth="40"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.5"
            />
            <circle cx="164" cy="128" r="68" fill="#a5b4fc"/>
            <circle cx="336" cy="256" r="58" fill="#818cf8"/>
            <circle cx="164" cy="384" r="52" fill="#34d399"/>
          </svg>
          <h1 className="text-3xl font-semibold text-zinc-100">ThreadTutor</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Follow the thread. Build the understanding.
          </p>
        </div>

        <div className="space-y-6">
          {/* Topic heading */}
          <h2 className="text-center text-lg font-medium text-zinc-300">
            What would you like to learn about?
          </h2>

          {/* Topic input */}
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleTopicKeyDown}
            placeholder="Enter any topic..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-zinc-100
                       placeholder:text-zinc-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
          />

          {/* Example topic chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3.5 py-1.5 text-sm text-zinc-300
                           hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300
                           transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Start learning button (hidden once API key input is shown) */}
          {!showApiKeyInput && (
            <>
              <button
                type="button"
                onClick={handleStartLearning}
                disabled={!topic.trim()}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-medium text-white
                           hover:bg-indigo-500
                           disabled:cursor-not-allowed disabled:opacity-40
                           transition-colors"
              >
                Start learning
              </button>

              {/* Watch demo button */}
              {!demoError && (
                <button
                  type="button"
                  onClick={fetchDemo}
                  disabled={demoLoading}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-base font-medium text-zinc-300
                             hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300
                             disabled:cursor-not-allowed disabled:opacity-40
                             transition-colors"
                >
                  <span>Watch demo</span>
                  <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                    See how ThreadTutor works
                  </span>
                </button>
              )}
            </>
          )}

          {/* Past sessions list */}
          {apiKeyLoaded && (
            <SessionList onLoadSession={setLoadedSession} />
          )}

          {/* API key entry (shown inline after clicking "Start learning" when no stored key) */}
          {showApiKeyInput && (
            <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-5">
              <label className="block text-sm font-medium text-zinc-300">
                Enter your Anthropic API key to begin
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                onKeyDown={handleApiKeyKeyDown}
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-base text-zinc-100
                           placeholder:text-zinc-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
              />
              <p className="text-xs text-zinc-500">
                Your key is stored in your browser only and sent directly to
                Anthropic.
              </p>
              <button
                type="button"
                onClick={handleBeginConversation}
                disabled={!apiKey.trim()}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-base font-medium text-white
                           hover:bg-indigo-500
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
