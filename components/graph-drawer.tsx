"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "threadtutor:graph-collapsed";

interface GraphDrawerProps {
  children: React.ReactNode;
}

export function GraphDrawer({ children }: GraphDrawerProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  return (
    <div
      className={`relative order-2 shrink-0 overflow-hidden border-t border-[var(--color-border)]/50 transition-[height] duration-300 ease-in-out ${
        collapsed ? "h-9" : "h-[250px] md:h-[38.2%]"
      }`}
    >
      {/* Floating toggle at top center, inline with React Flow controls */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="absolute top-1.5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150 cursor-pointer"
      >
        Concept Map
        <svg
          className={`h-2.5 w-2.5 transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 10 10"
          fill="currentColor"
        >
          <path d="M5 7L1 3h8L5 7z" />
        </svg>
      </button>

      {/* Graph content fills the full area */}
      <div className="h-full">{children}</div>
    </div>
  );
}
