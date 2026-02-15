"use client";

import { useEffect, useRef } from "react";

/**
 * Declarative useInterval hook (Dan Abramov pattern).
 *
 * - Stores the latest callback in a ref to avoid stale closures.
 * - When `delay` is `null`, the interval is paused (no timer created).
 * - When `delay` changes, the interval is reset automatically.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Always keep the ref pointing at the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
