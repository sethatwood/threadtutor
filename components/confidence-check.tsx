"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import type { ConfidenceCheck } from "@/lib/types";

interface ConfidenceCheckCardProps {
  check: ConfidenceCheck;
  onSubmit?: (answer: string) => void;
  isPending: boolean;
}

const assessmentStyles: Record<string, string> = {
  tracking: "text-emerald-700 bg-emerald-50",
  partial: "text-amber-700 bg-amber-50",
  confused: "text-rose-700 bg-rose-50",
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
    <div className="mt-3 rounded-lg border-l-4 border-indigo-300 bg-indigo-50/50 p-4">
      <p className="text-sm font-medium text-zinc-700">{check.question}</p>

      {/* Assessment result */}
      {check.assessment && (
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${assessmentStyles[check.assessment]}`}
          >
            {check.assessment}
          </span>
          {check.feedback && (
            <p className="mt-1.5 text-sm text-zinc-600">{check.feedback}</p>
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
            className="flex-1 resize-none overflow-hidden rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm
                       placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="self-end rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white
                       hover:bg-indigo-600
                       disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
