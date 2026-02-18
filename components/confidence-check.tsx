"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import type { ConfidenceCheck } from "@/lib/types";

interface ConfidenceCheckCardProps {
  check: ConfidenceCheck;
  onSubmit?: (answer: string) => void;
  isPending: boolean;
}

const assessmentStyles: Record<string, string> = {
  tracking: "text-[var(--color-status-success)] bg-[var(--color-status-success-bg)]",
  partial: "text-[var(--color-status-warning)] bg-[var(--color-status-warning-bg)]",
  confused: "text-[var(--color-status-error)] bg-[var(--color-status-error-bg)]",
};

const assessmentLabels: Record<string, string> = {
  tracking: "On track",
  partial: "Getting there",
  confused: "Let's revisit",
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
    <div className="mt-4 rounded-lg border-l-4 border-l-[var(--color-accent-indigo)]/50 bg-[var(--color-accent-indigo)]/10 p-3 md:p-4">
      {check.assessment ? (
        <>
          {/* Assessed state: heading + badge inline, question as context, feedback as elaboration */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-indigo)]">
              Understanding check
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 pt-[5px] pb-[3px] font-mono text-xs leading-none uppercase tracking-wider ${assessmentStyles[check.assessment]}`}
            >
              {assessmentLabels[check.assessment] ?? check.assessment}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-(--color-text-muted)"><span className="font-semibold text-(--color-text-dim)">Q:</span> {check.question}</p>
          {check.feedback && (
            <p className="mt-2 text-base text-foreground">{check.feedback}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-indigo)]">
            Check your understanding
          </p>
          <p className="mt-1.5 text-base font-medium text-foreground">{check.question}</p>
        </>
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
            className="flex-1 resize-none overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-text)]
                       placeholder:text-[var(--color-text-dim)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo)]/40 focus:border-[var(--color-accent-indigo)]/60
                       transition-all duration-150"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="self-end rounded-md bg-[var(--color-primary-bg)] px-3 py-2 font-mono text-xs uppercase tracking-wide text-white
                       hover:bg-[var(--color-primary-bg-hover)] hover:scale-[1.02]
                       disabled:cursor-not-allowed disabled:opacity-40
                       transition-all duration-150"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
