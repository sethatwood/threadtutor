"use client";

import { useState, useMemo, useCallback } from "react";
import { useInterval } from "@/lib/use-interval";
import type { Session } from "@/lib/types";

/**
 * Replay state machine for stepping through a recorded session.
 *
 * - `currentIndex` tracks which turn is visible (0-based).
 * - `visibleTurns` is the slice of turns from 0 to currentIndex (inclusive).
 * - `next()` / `back()` step forward/backward (clamped to bounds).
 * - `toggleAutoPlay()` starts/stops a 2.5s auto-advance timer.
 * - Reaching the end automatically pauses auto-play.
 * - Pressing back manually pauses auto-play.
 */
export function useReplayState(session: Session) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalTurns = session.turns.length;
  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex === totalTurns - 1;

  const visibleTurns = useMemo(
    () => session.turns.slice(0, currentIndex + 1),
    [session.turns, currentIndex],
  );

  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalTurns - 1));
  }, [totalTurns]);

  const back = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setIsPlaying(false);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Auto-play timer: advance every 2.5s, stop at end
  useInterval(() => {
    if (currentIndex >= totalTurns - 1) {
      setIsPlaying(false);
      return;
    }
    next();
  }, isPlaying ? 2500 : null);

  return {
    visibleTurns,
    currentIndex,
    totalTurns,
    isPlaying,
    isAtStart,
    isAtEnd,
    next,
    back,
    toggleAutoPlay,
  };
}
