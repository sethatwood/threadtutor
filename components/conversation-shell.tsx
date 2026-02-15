"use client";

import { ConversationPanel } from "@/components/conversation-panel";
import { ConceptMapPlaceholder } from "@/components/concept-map-placeholder";
import { JournalPlaceholder } from "@/components/journal-placeholder";

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
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-zinc-900">
            ThreadTutor
          </span>
          <span className="text-zinc-300">/</span>
          <span className="text-sm text-zinc-500">{topic}</span>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          >
            New topic
          </button>
        )}
      </header>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Concept Map */}
        <div className="w-1/4 border-r border-zinc-200">
          <ConceptMapPlaceholder />
        </div>

        {/* Center panel: Conversation */}
        <div className="flex w-1/2 flex-col">
          <ConversationPanel topic={topic} apiKey={apiKey} />
        </div>

        {/* Right panel: Learning Journal */}
        <div className="w-1/4 border-l border-zinc-200">
          <JournalPlaceholder />
        </div>
      </div>
    </div>
  );
}
