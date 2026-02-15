import type { Session } from "@/lib/types";

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const SESSION_PREFIX = "threadtutor:session:";
const INDEX_KEY = "threadtutor:sessions-index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata stored in the sessions index (avoids parsing full session JSON for listing). */
export interface SessionMeta {
  id: string;
  topic: string;
  createdAt: string;
  turnCount: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a session to localStorage and update the index.
 * Wraps setItem in try/catch for QuotaExceededError (logs warning, does not throw).
 */
export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${SESSION_PREFIX}${session.id}`,
      JSON.stringify(session),
    );
    updateIndex(session);
  } catch (err) {
    console.warn(
      "[session-storage] Failed to save session (storage may be full):",
      err,
    );
  }
}

/**
 * Load a session from localStorage by ID.
 * Returns null if not found or if JSON parsing fails.
 */
export function loadSession(id: string): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${SESSION_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/**
 * List all saved sessions (metadata only, from the index).
 * Returns an empty array if no index exists or if parsing fails.
 * Sorted by createdAt descending (newest first).
 */
export function listSessions(): SessionMeta[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SessionMeta[];
  } catch {
    return [];
  }
}

/**
 * Delete a session from localStorage and remove it from the index.
 */
export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${SESSION_PREFIX}${id}`);
  removeFromIndex(id);
}

/**
 * Download a session as a JSON file.
 * Creates a Blob, generates an object URL, triggers download via anchor element,
 * then revokes the URL.
 */
export function downloadSessionAsJson(session: Session): void {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const slug = session.topic.toLowerCase().replace(/\s+/g, "-");
  const shortId = session.id.slice(0, 8);

  const a = document.createElement("a");
  a.href = url;
  a.download = `threadtutor-${slug}-${shortId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Upsert session metadata in the index array.
 * Updates if ID exists, appends if new. Sorted by createdAt descending.
 */
function updateIndex(session: Session): void {
  const index = listSessions();

  const meta: SessionMeta = {
    id: session.id,
    topic: session.topic,
    createdAt: session.createdAt,
    turnCount: session.turns.length,
  };

  const existing = index.findIndex((m) => m.id === session.id);
  if (existing !== -1) {
    index[existing] = meta;
  } else {
    index.push(meta);
  }

  // Sort newest first
  index.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    console.warn(
      "[session-storage] Failed to update sessions index:",
      err,
    );
  }
}

/**
 * Remove a session from the index array by ID.
 */
function removeFromIndex(id: string): void {
  const index = listSessions().filter((m) => m.id !== id);
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    console.warn(
      "[session-storage] Failed to update sessions index:",
      err,
    );
  }
}
