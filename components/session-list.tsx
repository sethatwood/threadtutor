"use client";

import { useState, useEffect } from "react";
import type { Session } from "@/lib/types";
import type { SessionMeta } from "@/lib/session-storage";
import {
  listSessions,
  loadSession,
  deleteSession,
  downloadSessionAsJson,
} from "@/lib/session-storage";

interface SessionListProps {
  onLoadSession: (session: Session) => void;
}

export function SessionList({ onLoadSession }: SessionListProps) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Hydration-safe: read localStorage only after mount
  useEffect(() => {
    setSessions(listSessions());
    setLoaded(true);
  }, []);

  // Return null during SSR, hydration, or when no sessions exist
  if (!loaded || sessions.length === 0) return null;

  const handleLoad = (id: string) => {
    const session = loadSession(id);
    if (session) {
      onLoadSession(session);
    } else {
      // Stale entry: data corrupted or missing, clean up the index
      deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleExport = (id: string) => {
    const session = loadSession(id);
    if (session) {
      downloadSessionAsJson(session);
    }
  };

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const formatDate = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (isToday) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <section className="mt-10">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        Past sessions
      </h3>
      <div className="divide-y divide-[var(--color-border)]/50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50">
        {sessions.map((meta) => (
          <div
            key={meta.id}
            className="flex items-center justify-between px-4 py-3"
          >
            {/* Session info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--color-text)]">
                {meta.topic}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-dim)]">
                {formatDate(meta.createdAt)} &middot; {meta.turnCount}{" "}
                {meta.turnCount === 1 ? "turn" : "turns"}
              </p>
            </div>

            {/* Actions */}
            <div className="ml-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleLoad(meta.id)}
                className="rounded-md px-2.5 py-1 text-xs text-[var(--color-accent-indigo)] hover:bg-[var(--color-accent-indigo)]/10 hover:text-[var(--color-accent-indigo-hover)] transition-colors"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => handleExport(meta.id)}
                className="rounded-md px-2.5 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => handleDelete(meta.id)}
                className="rounded-md px-2.5 py-1 text-xs text-[var(--color-text-dim)] hover:bg-[var(--color-status-error-bg)] hover:text-[var(--color-status-error)] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
