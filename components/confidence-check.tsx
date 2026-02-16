"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import type { ConfidenceCheck } from "@/lib/types";

interface ConfidenceCheckCardProps {
  check: ConfidenceCheck;
  onSubmit?: (answer: string) => void;
  isPending: boolean;
}

const assessmentStyles: Record<string, string> = {
  tracking: "text-emerald-300 bg-emerald-500/15",
  partial: "text-amber-300 bg-amber-500/15",
  confused: "text-rose-300 bg-rose-500/15",
};

export function ConfidenceCheckCard({
  check,
  onSubmit,
  isPending,
}: ConfidenceCheckCardProps) {
  const [answer, setAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
    adjustHeight();
  };

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (!trimmed || !onSubmit) return;
    onSubmit(trimmed);
    setAnswer("");
    // Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-4 rounded-lg border-l-4 border-indigo-500/50 bg-indigo-500/10 p-3 md:p-4">
      <p className="text-base font-medium text-zinc-200">{check.question}</p>

      {/* Assessment result */}
      {check.assessment && (
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-wider ${assessmentStyles[check.assessment]}`}
          >
            {check.assessment}
          </span>
          {check.feedback && (
            <p className="mt-1.5 text-sm text-zinc-400">{check.feedback}</p>
          )}
        </div>
      )}

      {/* Pending input */}
      {isPending && !check.assessment && onSubmit && (
        <div className="mt-3 flex gap-2">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-base text-zinc-100
                       placeholder:text-zinc-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="self-end rounded-md bg-indigo-600 px-3 py-2 font-mono text-xs uppercase tracking-wide text-white
                       hover:bg-indigo-500
                       disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
