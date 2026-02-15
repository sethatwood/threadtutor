# Phase 5: Session Persistence - Research

**Researched:** 2026-02-15
**Domain:** localStorage persistence, session state management, JSON file export, Next.js API route file writing, session index enumeration
**Confidence:** HIGH

## Summary

Phase 5 adds session persistence to ThreadTutor. The existing codebase already defines the `Session` type (`id`, `topic`, `createdAt`, `turns: Turn[]`) in `lib/types.ts` and the conversation state machine in `lib/use-conversation.ts` (a `useReducer` hook that tracks `turns`, `isLoading`, `error`, `pendingConfidenceCheck`, and `turnNumber`). No session persistence exists yet: when the user refreshes the browser or clicks "New topic," all conversation data is lost.

The implementation involves three layers: (1) a `lib/session-storage.ts` module that wraps localStorage for session CRUD operations (save, load, list, delete), using `threadtutor:session:{id}` as the key format and a `threadtutor:sessions-index` key for the session list; (2) integration of session persistence into the existing conversation flow via `useConversation` or a new `useSession` hook that wraps it, generating a session ID on creation and auto-saving after each turn; and (3) UI additions for session export (JSON download button), past sessions list, and the dev-mode disk writing via a new API route.

The critical constraint for this phase is forward compatibility with Phase 6 (Replay Mode): the `Session` type stored to localStorage and written to disk must be exactly the format that Phase 6 loads and replays. The existing `Session` type already contains everything needed: `turns: Turn[]` where each `Turn` has `displayText`, `concepts`, `confidenceCheck`, and `journalEntry`. No schema changes are required.

**Primary recommendation:** Create a `lib/session-storage.ts` module for all localStorage operations, integrate auto-save into the conversation flow via a wrapper hook or effect, and add a dedicated `api/sessions/route.ts` API route for dev-mode disk writes. Use `crypto.randomUUID()` for session IDs and a separate sessions index key in localStorage for efficient listing.

## Standard Stack

### Core

No new npm dependencies are required. This phase uses only browser APIs and Node.js built-ins.

| Technology | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| localStorage (Web API) | N/A | Persist sessions in the browser | Built into every browser. The project already uses it for API key storage (`lib/api-key.ts`). The established key format `threadtutor:session:{id}` is documented in CLAUDE.md and the SPEC. |
| crypto.randomUUID() (Web API) | N/A | Generate unique session IDs | Built into all modern browsers in secure contexts (HTTPS/localhost). 97%+ browser support as of 2025. No npm dependency needed. |
| Blob + URL.createObjectURL() (Web API) | N/A | Generate downloadable JSON files | Standard browser approach for client-side file downloads. No server roundtrip needed. |
| node:fs/promises (Node.js built-in) | N/A | Write session files to disk in dev mode | Used inside Next.js API route handlers which run on Node.js. Already available in the project's runtime (the chat API route uses Node.js). |
| node:path (Node.js built-in) | N/A | Construct safe file paths for disk writes | Standard path joining to avoid OS-specific separator issues. |

### Supporting

| Technology | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| JSON.stringify with replacer/space | N/A | Pretty-print session JSON for export and disk writes | Always use `JSON.stringify(session, null, 2)` for human-readable exported files. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|-----------|-----------|----------|
| localStorage | IndexedDB | IndexedDB handles larger data and binary blobs, but adds significant API complexity. Sessions are small JSON objects (typically 10-50KB). localStorage's 5MB limit per origin is more than sufficient for dozens of sessions. IndexedDB is overkill. |
| localStorage | sessionStorage | sessionStorage clears when the tab closes, which defeats the purpose of persistence across refreshes. |
| crypto.randomUUID() | uuid npm package | The npm package adds an unnecessary dependency. crypto.randomUUID() works in all modern browsers and on localhost (secure context requirement is met). |
| Blob download | Server-side file serving | Blob download is entirely client-side, requires no server roundtrip, and works even offline. Server-side serving adds unnecessary complexity. |
| Sessions index in localStorage | Enumerating all localStorage keys | Enumerating `Object.keys(localStorage).filter(k => k.startsWith('threadtutor:session:'))` works, but is O(n) across ALL localStorage keys (including other apps sharing the origin). A dedicated index key is O(1) lookup and more robust. |

**Installation:**
```bash
# No new dependencies needed. All APIs are built-in.
```

## Architecture Patterns

### Recommended Project Structure (Phase 5 additions)

```
lib/
  session-storage.ts     # localStorage CRUD for sessions + sessions index
  use-session.ts         # Hook wrapping useConversation with session identity and auto-save
  types.ts               # (unchanged - Session type already exists)
  api-key.ts             # (unchanged - existing pattern to follow)
components/
  conversation-shell.tsx # Modified: pass session ID, add export button in header
  session-list.tsx       # New: past sessions list with load/delete/export actions
  topic-picker.tsx       # Modified: show session list, handle loading past sessions
app/
  api/
    sessions/
      route.ts           # New: POST endpoint for dev-mode disk writes
```

### Pattern 1: Session Storage Module (following api-key.ts pattern)

**What:** A pure-function module that encapsulates all localStorage operations for sessions. Mirrors the existing `lib/api-key.ts` pattern: simple functions, SSR-safe `typeof window` guards, namespaced keys.

**When to use:** Any component or hook that needs to read/write session data.

**Example:**
```typescript
// lib/session-storage.ts

const SESSION_PREFIX = "threadtutor:session:";
const INDEX_KEY = "threadtutor:sessions-index";

/** Metadata stored in the sessions index (avoids parsing full session JSON for listing). */
interface SessionMeta {
  id: string;
  topic: string;
  createdAt: string;
  turnCount: number;
}

/** Save a session to localStorage and update the index. */
export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${SESSION_PREFIX}${session.id}`,
    JSON.stringify(session)
  );
  updateIndex(session);
}

/** Load a session from localStorage by ID. Returns null if not found. */
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

/** List all saved sessions (metadata only, from the index). */
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

/** Delete a session from localStorage and remove from the index. */
export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${SESSION_PREFIX}${id}`);
  removeFromIndex(id);
}
```

### Pattern 2: Session Auto-Save via useEffect

**What:** A `useEffect` that watches `state.turns` and saves the current session to localStorage whenever turns change. This ensures every turn is persisted automatically without requiring explicit save actions.

**When to use:** Inside the conversation shell or a session wrapper hook.

**Example:**
```typescript
// Auto-save effect pattern
useEffect(() => {
  if (state.turns.length === 0) return; // Nothing to save yet
  const session: Session = {
    id: sessionId,
    topic,
    createdAt,
    turns: state.turns,
  };
  saveSession(session);
}, [state.turns, sessionId, topic, createdAt]);
```

**Key consideration:** This runs on every new turn, which is fine because localStorage.setItem is synchronous and fast for the data sizes involved (< 100KB per session). There is no need for debouncing.

### Pattern 3: JSON File Download (Client-Side)

**What:** Create a Blob from the session JSON, generate a temporary object URL, trigger a download via a programmatically created anchor element, then revoke the URL.

**When to use:** When the user clicks the "Export" or "Download" button.

**Example:**
```typescript
// lib/session-storage.ts (or a utility function)
export function downloadSessionAsJson(session: Session): void {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `threadtutor-${session.topic.toLowerCase().replace(/\s+/g, "-")}-${session.id.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
```

### Pattern 4: Dev-Mode Disk Write via API Route

**What:** A Next.js API route that accepts a session JSON body and writes it to `public/sessions/{id}.json`. Gated by `process.env.NODE_ENV === 'development'` to ensure it never runs in production (Vercel's filesystem is read-only in production anyway).

**When to use:** Called from the auto-save effect in development mode only. The client checks `process.env.NODE_ENV` (available in Next.js client components via `process.env.NODE_ENV`) before making the request.

**Example:**
```typescript
// app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Session disk writes are only available in development." },
      { status: 403 }
    );
  }

  const session = await request.json();
  const dir = path.join(process.cwd(), "public", "sessions");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${session.id}.json`),
    JSON.stringify(session, null, 2)
  );

  return NextResponse.json({ ok: true });
}
```

### Pattern 5: Sessions Index (Lightweight Listing)

**What:** Instead of parsing every `threadtutor:session:*` key to build the past sessions list, maintain a separate `threadtutor:sessions-index` key containing an array of `{ id, topic, createdAt, turnCount }` metadata objects. Updated atomically whenever a session is saved or deleted.

**When to use:** Always. The sessions list component reads only the index, avoiding the cost of parsing potentially large session JSON.

**Why:** localStorage has no query API. Listing sessions by iterating all keys and parsing each one is wasteful and slow if many sessions exist. The index pattern is the standard approach for localStorage-based apps that need to display a list of stored items.

### Anti-Patterns to Avoid

- **Calling localStorage.setItem inside the reducer:** The reducer must be a pure function. Side effects (localStorage writes, API calls) belong in `useEffect` or event handlers, never inside the reducer.
- **Not handling QuotaExceededError:** localStorage has a ~5MB limit per origin. Always wrap `localStorage.setItem` in a try/catch and surface quota errors to the user gracefully.
- **Storing session data without an index:** Iterating `Object.keys(localStorage)` to find sessions is fragile (other apps may use the same origin) and slow. Use a dedicated index key.
- **Forgetting URL.revokeObjectURL after download:** Every `URL.createObjectURL()` call creates a reference that persists until the page unloads or `revokeObjectURL()` is called. Forgetting to revoke causes memory leaks.
- **Writing to disk in production:** Vercel's filesystem is read-only. The disk write API route must check `NODE_ENV` and reject non-development requests.
- **Using `Date.now()` as session ID:** Timestamps can collide if two sessions start in the same millisecond (unlikely but possible). Use `crypto.randomUUID()` for guaranteed uniqueness.
- **Reading localStorage during render:** Follow the existing `api-key.ts` pattern: always read in `useEffect`, return null during SSR. This prevents hydration mismatches.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session ID generation | Custom ID generator (timestamp + random) | `crypto.randomUUID()` | Built-in, cryptographically secure, RFC4122-compliant. Available in all modern browsers on localhost and HTTPS. |
| File download trigger | Custom download logic or server endpoint | `Blob` + `URL.createObjectURL()` + anchor `download` attribute | Standard browser pattern. No server roundtrip needed. Works offline. |
| localStorage wrapper with events | Custom pub/sub system for storage changes | Simple function calls + React state | The app is single-tab. There is no need for cross-tab synchronization via the `storage` event. Direct function calls and React state are sufficient. |
| Session list state management | Global state library (Redux, Zustand) | Local state in the sessions list component | The sessions list is displayed in one place (topic picker screen). No global state needed. Read from localStorage on mount, update on save/delete. |

**Key insight:** This phase requires zero new npm dependencies. Every capability needed (localStorage, Blob downloads, crypto.randomUUID, fs/path for Node.js) is a built-in browser or Node.js API. The complexity is in the integration: wiring auto-save into the existing conversation flow, adding UI for session management, and ensuring the stored format is compatible with Phase 6 replay.

## Common Pitfalls

### Pitfall 1: localStorage Quota Exceeded

**What goes wrong:** Saving a large session (many turns, long displayText) or having many saved sessions exceeds the ~5MB localStorage limit, and `localStorage.setItem` throws a `QuotaExceededError`.

**Why it happens:** localStorage is limited to approximately 5MB per origin across all browsers. A single ThreadTutor session is typically 10-50KB (JSON-serialized Turn objects), so the limit accommodates 100-500 sessions. But edge cases exist: very long conversations, many saved sessions, or other apps on the same origin consuming space.

**How to avoid:**
1. Wrap all `localStorage.setItem` calls in a try/catch.
2. Surface a clear error message: "Storage is full. Delete old sessions or export them as JSON to free space."
3. Optionally, show storage usage in the session list UI.

**Warning signs:** `DOMException: QuotaExceededError` in the console. Sessions silently failing to save.

### Pitfall 2: Stale Sessions Index

**What goes wrong:** The sessions index (`threadtutor:sessions-index`) gets out of sync with the actual session keys in localStorage. The list shows sessions that no longer exist, or omits sessions that do.

**Why it happens:** If a session is saved but the index update fails (e.g., quota exceeded on the index write), or if sessions are manually deleted from DevTools without updating the index.

**How to avoid:**
1. Update the index atomically with each session save/delete operation.
2. When loading the sessions list, optionally validate that each indexed session still exists (defensive check, can be done lazily).
3. If the index is missing or corrupted, rebuild it by scanning all `threadtutor:session:*` keys.

**Warning signs:** "Session not found" errors when trying to load a session that appears in the list.

### Pitfall 3: Hydration Mismatch on Session List

**What goes wrong:** The server renders the topic picker with an empty sessions list, but the client reads sessions from localStorage and shows a list, causing a hydration mismatch.

**Why it happens:** localStorage is not available during SSR. If sessions are read during the initial render, server and client HTML diverge.

**How to avoid:** Follow the established pattern from `topic-picker.tsx`: use a `useEffect` to read sessions on mount, and render a loading/empty state until the client-side read completes. The `apiKeyLoaded` pattern already in the codebase is the exact model to follow.

**Warning signs:** React hydration warnings in the console. Session list flickering on page load.

### Pitfall 4: Lost Session on "New Topic" Click

**What goes wrong:** The user clicks "New topic" in the header and the current session state is lost because `handleBack` in `topic-picker.tsx` resets all state without saving first.

**Why it happens:** The current `handleBack` just sets `started: false` and clears the topic. There is no save step.

**How to avoid:** Auto-save on every turn change (via `useEffect`) ensures the session is always persisted before any navigation. The "New topic" handler does not need an explicit save step because the latest state is already in localStorage.

**Warning signs:** User loses their session after clicking "New topic" and cannot find it in the past sessions list.

### Pitfall 5: Dev-Mode Disk Write Races

**What goes wrong:** Multiple turns arrive in quick succession, and the disk write API calls overlap, causing corrupted JSON files or partial writes.

**Why it happens:** The auto-save effect fires on every turn change, and if two effects fire before the first disk write completes, the writes may interleave.

**How to avoid:**
1. Use a ref to track whether a disk write is in progress, and skip overlapping writes.
2. Alternatively, since the session is always saved in its entirety (not appended), the last write wins and produces a valid file. The intermediate write may be incomplete, but it will be overwritten immediately. This is acceptable for dev-mode demo generation.
3. Use fire-and-forget for disk writes (no await in the effect). Disk writes are not critical; localStorage is the source of truth.

**Warning signs:** Corrupted JSON files in `public/sessions/`. This is a dev-only concern and is mitigated by the "last write wins" property.

### Pitfall 6: Session Format Incompatible with Phase 6 Replay

**What goes wrong:** Phase 6 (Replay Mode) cannot load sessions saved by Phase 5 because the stored format differs from what the replay logic expects.

**Why it happens:** If Phase 5 adds extra fields, uses different key names, or omits fields that Phase 6 needs.

**How to avoid:** Use the existing `Session` type from `lib/types.ts` exactly as-is. Do not add extra fields (like `status`, `completedAt`, etc.) to the stored format unless they are also added to the `Session` type. The `Session` type is the contract between Phase 5 storage and Phase 6 replay.

**Warning signs:** Type errors when Phase 6 tries to load a stored session. Missing concepts in replayed sessions.

## Code Examples

Verified patterns from official sources and the existing codebase:

### localStorage Read with SSR Safety (existing pattern)

```typescript
// Source: lib/api-key.ts (already in codebase)
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
```

This pattern is used for session storage identically.

### crypto.randomUUID() for Session IDs

```typescript
// Source: MDN Web Docs - Crypto.randomUUID()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
const sessionId = crypto.randomUUID();
// Returns: "36b8f84d-df4e-4d49-b662-bcde71a8764f"
```

Available in secure contexts (HTTPS and localhost). All modern browsers support it (97%+ as of 2025).

### Blob Download for JSON Export

```typescript
// Source: MDN Web Docs - Blob, URL.createObjectURL()
// https://developer.mozilla.org/en-US/docs/Web/API/Blob
// https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
```

### Next.js Route Handler File Write (Dev Mode)

```typescript
// Source: Next.js docs (route.js) + Node.js fs/promises docs
// https://nextjs.org/docs/app/api-reference/file-conventions/route
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// In a POST route handler:
const dir = path.join(process.cwd(), "public", "sessions");
await mkdir(dir, { recursive: true });
await writeFile(
  path.join(dir, `${session.id}.json`),
  JSON.stringify(session, null, 2)
);
```

`process.cwd()` returns the project root in Next.js dev mode. `mkdir({ recursive: true })` creates the `sessions` directory if it does not exist. This only works in development; Vercel's production filesystem is read-only.

### useEffect Auto-Save Pattern (following existing codebase conventions)

```typescript
// Source: Existing pattern in conversation-shell.tsx (useRef + useEffect)
const createdAtRef = useRef(new Date().toISOString());

useEffect(() => {
  if (state.turns.length === 0) return;
  saveSession({
    id: sessionId,
    topic,
    createdAt: createdAtRef.current,
    turns: state.turns,
  });
}, [state.turns, sessionId, topic]);
```

The `createdAtRef` ensures the timestamp is set once on session creation, not updated on every save.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| uuid npm package for IDs | `crypto.randomUUID()` built-in | Available since 2021, ~97% support in 2025 | No npm dependency needed for UUID generation |
| Custom file-saver libraries (FileSaver.js) | `Blob` + `URL.createObjectURL()` + anchor `download` attribute | Mature browser support since 2015+ | No npm dependency needed for file downloads |
| localStorage key enumeration for listing | Separate index key pattern | Always been the recommended pattern | O(1) listing vs O(n) key scanning |

**Deprecated/outdated:**
- `FileSaver.js`: No longer needed. The Blob + anchor download pattern works in all modern browsers without a library.
- `uuid` npm package: Not needed when `crypto.randomUUID()` is available in the target environment (all modern browsers + localhost).

## Open Questions

1. **Session "completion" vs continuous auto-save**
   - What we know: The SPEC mentions "On completion (or when the user clicks 'Save')." The requirements (SESS-01, SESS-02) say sessions are "recorded in React state during live conversation" and "completed sessions saved to localStorage."
   - What's unclear: Whether "completed" means the user must explicitly end a session, or whether auto-save after every turn is sufficient. The success criteria say "refreshing the browser does not lose the current session," which implies auto-save is required (not just save-on-completion).
   - Recommendation: Auto-save after every turn. This is simpler, more robust, and satisfies the "refresh does not lose data" criterion. There is no concept of "ending" a session in the current UI (the user just clicks "New topic").

2. **Session metadata for the list: how much to show?**
   - What we know: The past sessions list needs to show previously saved sessions. The `Session` type has `id`, `topic`, `createdAt`, and `turns`.
   - What's unclear: What metadata to display in the list (topic, date, turn count, last turn preview?).
   - Recommendation: Show topic, date (formatted), and turn count. This is derivable from the sessions index without parsing full session data. Keep the list UI simple for Phase 5; enhancements can come later.

3. **Should "replay past session" (SESS-05) use the Phase 6 replay infrastructure?**
   - What we know: SESS-05 says "User can replay any past session from localStorage." Phase 6 builds a full replay mode with step-through controls, auto-play, etc.
   - What's unclear: Whether Phase 5 should build a lightweight replay (just load and display all turns at once, read-only) or defer to Phase 6's replay infrastructure.
   - Recommendation: Phase 5 should implement a simple "load and view" mode: load the session from localStorage and display all turns in a read-only conversation view. Phase 6 will add the step-through replay with controls. This keeps Phase 5 focused on persistence and gives Phase 6 a clear foundation to build on.

## Sources

### Primary (HIGH confidence)
- [MDN - Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - localStorage 5MB limit, QuotaExceededError handling
- [MDN - Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) - Session ID generation, secure context requirement
- [MDN - Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) - Creating JSON blobs for download
- [MDN - URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) - Generating downloadable URLs from blobs
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) - localStorage API reference
- [Next.js Route Handler docs](https://nextjs.org/docs/app/api-reference/file-conventions/route) - Route handler capabilities, runtime config
- [Can I Use - crypto.randomUUID](https://caniuse.com/mdn-api_crypto_randomuuid) - 97%+ browser support
- Existing codebase: `lib/api-key.ts` (localStorage pattern), `lib/types.ts` (Session type), `lib/use-conversation.ts` (state machine pattern), `components/topic-picker.tsx` (hydration-safe localStorage read pattern)

### Secondary (MEDIUM confidence)
- [web.dev - Storage for the web](https://web.dev/articles/storage-for-the-web) - Browser storage overview, quota details
- [Next.js GitHub Discussion #17014](https://github.com/vercel/next.js/discussions/17014) - Writing files to public folder at runtime, dev vs production constraints
- [Ben Nadel - Downloading Text Using Blobs](https://www.bennadel.com/blog/3472-downloading-text-using-blobs-url-createobjecturl-and-the-anchor-download-attribute-in-javascript.htm) - Blob download pattern with anchor element

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All APIs are browser/Node.js built-ins, verified via MDN and Next.js official docs. No npm dependencies needed.
- Architecture: HIGH - Patterns directly follow existing codebase conventions (api-key.ts for localStorage, useEffect for side effects, API routes for server operations). The Session type is already defined.
- Pitfalls: HIGH - localStorage limits and QuotaExceededError are well-documented on MDN. Hydration mismatch prevention follows the existing topic-picker pattern. Dev-mode file writing constraints verified via Next.js docs and community discussions.

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - all APIs are stable, well-established browser/Node.js features)
