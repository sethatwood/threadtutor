"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Progressive text reveal hook.
 *
 * When `active` is true, reveals `text` word-by-word at ~35 words/sec.
 * When `active` is false, returns the full text immediately.
 */
export function useProgressiveReveal(
  text: string,
  active: boolean,
): { displayedText: string; isRevealing: boolean } {
  const [wordIndex, setWordIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordsRef = useRef<string[]>([]);

  // Split text into words once per text change
  const words = text.split(/\s+/).filter(Boolean);
  wordsRef.current = words;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset and start/stop animation when text or active changes
  useEffect(() => {
    if (!active) {
      clearTimer();
      setWordIndex(0);
      return;
    }

    // Active: start revealing from the beginning
    setWordIndex(0);

    intervalRef.current = setInterval(() => {
      setWordIndex((prev) => {
        const next = prev + 1;
        if (next >= wordsRef.current.length) {
          clearTimer();
        }
        return next;
      });
    }, 28); // ~35 words/sec

    return clearTimer;
  }, [text, active, clearTimer]);

  // If not active, return full text immediately
  if (!active) {
    return { displayedText: text, isRevealing: false };
  }

  const isRevealing = wordIndex < words.length;
  const displayedText = isRevealing
    ? words.slice(0, wordIndex).join(" ")
    : text;

  return { displayedText, isRevealing };
}
