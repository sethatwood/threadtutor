# Phase 2: App Shell & Live Conversation - Research

**Researched:** 2026-02-15
**Domain:** Next.js App Router client components, conversation UI, markdown rendering, three-panel layout, localStorage persistence
**Confidence:** HIGH

## Summary

Phase 2 transforms the Phase 1 API foundation into a working conversation app. The primary domains are: (1) a three-panel desktop layout shell using Tailwind CSS 4 flexbox, (2) a session start flow with topic picker and API key entry persisted in localStorage, (3) a live conversation UI with markdown rendering via react-markdown and `@tailwindcss/typography`, and (4) client-side state management for the multi-turn conversation using React `useReducer`. All interactive UI lives in `"use client"` components, while the page itself can remain a server component that composes them.

The key technical decisions are: use `react-markdown` v10 with `@tailwindcss/typography` for markdown rendering (Tailwind v4's preflight strips default HTML styling, making the typography plugin essential), use a `useReducer`-based state machine for conversation flow (cleaner than `useState` for the multiple state transitions: idle, loading, awaiting-response, confidence-check-pending), and implement the auto-growing textarea with a `scrollHeight`-based JavaScript approach (CSS `field-sizing: content` lacks Firefox support at ~75% browser coverage).

**Primary recommendation:** Build all interactive components as `"use client"` leaf components composed by server component pages. Use `react-markdown` + `@tailwindcss/typography` for markdown, `useReducer` for conversation state, and keep the three-panel layout as a simple CSS flex container with fixed proportions.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | ^10.1.0 | Render Claude's `displayText` markdown as React elements | The standard React markdown renderer. v10 supports React 19, uses the unified/remark ecosystem. Safe by default (no `dangerouslySetInnerHTML`). Supports custom component rendering via `components` prop. |
| @tailwindcss/typography | ^0.5.x | Apply typographic styles to markdown output via `prose` class | Required when using Tailwind CSS v4 with react-markdown. Tailwind v4's preflight resets strip all default HTML element styling (headings, lists, links). Without this plugin, markdown renders as unstyled plain text. The `prose` class restores beautiful typographic defaults. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| remark-gfm | ^4.0.0 | GitHub Flavored Markdown support (tables, strikethrough, task lists) | Optional. Include if Claude's responses use GFM features. Can be added later without breaking changes. Not required for Phase 2 MVP. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown | `dangerouslySetInnerHTML` with a markdown-to-HTML library | Unsafe by default, requires sanitization. react-markdown is safe by default and integrates with React's component model. No reason to use raw HTML injection. |
| react-markdown | `marked` + custom React rendering | More manual work, no built-in React component mapping. react-markdown handles this natively. |
| @tailwindcss/typography | Manual CSS styles for markdown elements | Significant effort to style every HTML element (h1-h6, p, ul, ol, blockquote, code, etc.) with proper spacing, sizing, and colors. The typography plugin handles all of this with a single `prose` class. |
| JS-based auto-resize textarea | CSS `field-sizing: content` | CSS-only solution is cleaner but Firefox does not support it (as of Feb 2026, ~75% browser coverage). JavaScript scrollHeight approach works everywhere. |

**Installation:**
```bash
npm install react-markdown @tailwindcss/typography
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 scope)

```
app/
  page.tsx                    # Server component: renders TopicPicker or ConversationShell based on state
  api/
    chat/
      route.ts                # (Phase 1, unchanged)
  globals.css                 # Add @plugin "@tailwindcss/typography"
components/
  topic-picker.tsx            # "use client" - topic input, example chips, API key entry
  conversation-shell.tsx      # "use client" - three-panel layout container
  conversation-panel.tsx      # "use client" - message list, input area, scroll management
  message.tsx                 # Renders a single turn (assistant or user) with react-markdown
  confidence-check.tsx        # Renders confidence check card with embedded input
  skeleton-message.tsx        # Loading placeholder with shimmer animation
  concept-map-placeholder.tsx # Static placeholder for left panel
  journal-placeholder.tsx     # Static placeholder for right panel
lib/
  types.ts                    # (Phase 1, unchanged)
  system-prompt.ts            # (Phase 1, unchanged)
  use-conversation.ts         # Custom hook: useReducer state machine + API call logic
  api-key.ts                  # localStorage read/write helpers for API key
```

### Pattern 1: Client Component Composition

**What:** The page.tsx server component renders client components as leaf nodes. All state, event handlers, and browser APIs live in `"use client"` components. The server component handles no interactivity.

**When to use:** Every interactive component in this phase.

**Example:**
```typescript
// app/page.tsx (Server Component - no "use client")
import { TopicPicker } from "@/components/topic-picker";
import { ConversationShell } from "@/components/conversation-shell";

export default function Home() {
  // No state here - the client components manage their own state
  // The page just provides the entry point
  return <TopicPicker />;
  // TopicPicker navigates to ConversationShell internally via state
}
```

```typescript
// components/topic-picker.tsx
"use client";

import { useState } from "react";
import { ConversationShell } from "./conversation-shell";

export function TopicPicker() {
  const [session, setSession] = useState<{ topic: string } | null>(null);

  if (session) {
    return <ConversationShell topic={session.topic} />;
  }

  return (
    <div>
      {/* Topic input, example chips, API key entry */}
    </div>
  );
}
```

### Pattern 2: useReducer Conversation State Machine

**What:** A `useReducer` hook manages the conversation's state transitions. This is cleaner than multiple `useState` calls because conversation state has several interdependent fields (messages, loading, error, active confidence check, turn number) that must update atomically.

**When to use:** The conversation panel's state management.

**Example:**
```typescript
// lib/use-conversation.ts
"use client";

import { useReducer, useCallback } from "react";
import type { Turn, TurnResponse, Concept } from "./types";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

type ConversationState = {
  turns: Turn[];
  isLoading: boolean;
  error: string | null;
  pendingConfidenceCheck: boolean; // true when waiting for user to answer a check
  turnNumber: number;
};

type ConversationAction =
  | { type: "SEND_MESSAGE" }
  | { type: "RECEIVE_RESPONSE"; payload: TurnResponse }
  | { type: "ADD_USER_TURN"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "ANSWER_CONFIDENCE_CHECK"; payload: string };

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "SEND_MESSAGE":
      return { ...state, isLoading: true, error: null };
    case "RECEIVE_RESPONSE": {
      const newTurn: Turn = {
        turnNumber: state.turnNumber + 1,
        role: "assistant",
        displayText: action.payload.displayText,
        concepts: action.payload.concepts,
        confidenceCheck: action.payload.confidenceCheck,
        journalEntry: action.payload.journalEntry,
      };
      return {
        ...state,
        turns: [...state.turns, newTurn],
        isLoading: false,
        pendingConfidenceCheck: action.payload.confidenceCheck !== null,
        turnNumber: state.turnNumber + 1,
      };
    }
    case "ADD_USER_TURN": {
      const userTurn: Turn = {
        turnNumber: state.turnNumber + 1,
        role: "user",
        displayText: action.payload,
        concepts: [],
        confidenceCheck: null,
        journalEntry: null,
      };
      return {
        ...state,
        turns: [...state.turns, userTurn],
        turnNumber: state.turnNumber + 1,
        pendingConfidenceCheck: false,
      };
    }
    case "SET_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}
```

### Pattern 3: Building the Messages Array for the API

**What:** The Anthropic Messages API is stateless. Every request must include the full conversation history as alternating user/assistant messages. The client builds this array from the Turn[] state before each API call.

**When to use:** Every API call in the conversation.

**Example:**
```typescript
// Inside use-conversation.ts
function buildMessages(turns: Turn[]): MessageParam[] {
  return turns.map((turn) => ({
    role: turn.role,
    content: turn.displayText,
  }));
}

// Collect existing concepts for system prompt injection
function collectConcepts(turns: Turn[]): Array<{ id: string; label: string }> {
  const concepts: Array<{ id: string; label: string }> = [];
  for (const turn of turns) {
    for (const concept of turn.concepts) {
      if (!concepts.some((c) => c.id === concept.id)) {
        concepts.push({ id: concept.id, label: concept.label });
      }
    }
  }
  return concepts;
}

// API call
async function sendMessage(
  turns: Turn[],
  userMessage: string,
  topic: string,
  apiKey: string
): Promise<TurnResponse> {
  const messages = [
    ...buildMessages(turns),
    { role: "user" as const, content: userMessage },
  ];
  const existingConcepts = collectConcepts(turns);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, topic, apiKey, existingConcepts }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}
```

### Pattern 4: localStorage API Key with Hydration Safety

**What:** Read the API key from localStorage in a `useEffect` to avoid SSR hydration mismatches. The server render always shows the "no key" state; the client hydrates and reads the key.

**When to use:** Any component that reads from localStorage.

**Example:**
```typescript
// lib/api-key.ts
const STORAGE_KEY = "threadtutor:apiKey";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

```typescript
// In a client component
"use client";
import { useState, useEffect } from "react";
import { getApiKey } from "@/lib/api-key";

function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
    setIsLoaded(true);
  }, []);

  return { apiKey, isLoaded };
}
```

### Pattern 5: Markdown Rendering with Tailwind Typography

**What:** Use react-markdown with the `prose` class from `@tailwindcss/typography` to render Claude's displayText. The prose class provides all typographic styling that Tailwind v4's preflight strips away.

**When to use:** Every assistant message in the conversation.

**Example:**
```typescript
// components/message.tsx
"use client";

import Markdown from "react-markdown";
import type { Turn } from "@/lib/types";

export function Message({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <div className="py-4">
        <p className="text-zinc-700">{turn.displayText}</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="prose prose-zinc prose-sm max-w-none">
        <Markdown>{turn.displayText}</Markdown>
      </div>
    </div>
  );
}
```

```css
/* app/globals.css - add the plugin */
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### Pattern 6: Auto-Growing Textarea with Enter-to-Send

**What:** A textarea that starts at one line and grows as the user types, using scrollHeight measurement. Enter sends the message, Shift+Enter inserts a newline.

**When to use:** The main conversation input and the confidence check input.

**Example:**
```typescript
// components/chat-input.tsx
"use client";

import { useRef, useCallback, KeyboardEvent, ChangeEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSend, disabled, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto"; // Reset to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none overflow-hidden border rounded-lg px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-zinc-300
                 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}
```

### Pattern 7: Scroll to Bottom on New Messages

**What:** Use a ref attached to a sentinel div at the bottom of the message list. Call `scrollIntoView()` whenever the turns array changes.

**When to use:** The conversation panel, after each new message or when loading completes.

**Example:**
```typescript
const bottomRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [turns]);

// In JSX:
// <div ref={bottomRef} />  at the end of the message list
```

### Anti-Patterns to Avoid

- **Reading localStorage during render:** Always read localStorage in `useEffect`, never in the component body or `useState` initializer. The server has no `window` object, causing hydration mismatches.
- **Multiple useState calls for related state:** Conversation state has interdependent fields (turns, loading, error, pending check). Using separate `useState` calls leads to inconsistent intermediate states. Use `useReducer` instead.
- **Forgetting to send full conversation history:** The Anthropic Messages API is stateless. Every request must include all prior turns. Sending only the latest message produces incoherent responses.
- **Using react-markdown without @tailwindcss/typography:** Tailwind v4's preflight resets all default HTML element styles. Without the typography plugin, headings render as plain unstyled text, lists have no bullets, links have no color. This is a known issue with Tailwind v4 + react-markdown.
- **Rendering markdown for user messages:** User messages are plain text typed by the user. Rendering them through react-markdown would interpret any markdown syntax the user happened to type, which is unexpected. Only render assistant messages through react-markdown.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom regex-based markdown parser | `react-markdown` v10 | Markdown parsing is deceptively complex (nested lists, escaping, edge cases). react-markdown uses the unified/remark ecosystem, battle-tested on millions of sites. |
| Typographic styling for markdown HTML | Manual CSS rules for every HTML element | `@tailwindcss/typography` with `prose` class | The plugin handles h1-h6, p, ul, ol, li, blockquote, code, pre, a, strong, em, table, and more with proper spacing, sizing, colors, and dark mode support. Doing this manually is ~200+ lines of CSS. |
| Auto-growing textarea | Complex library like `react-textarea-autosize` | Simple `scrollHeight` measurement in ~15 lines | The scrollHeight pattern is straightforward and avoids an extra dependency. The library adds resize observers and edge case handling that a single-textarea chat input does not need. |
| API key validation | Regex validation, format checking | Let the Anthropic API return 401 for invalid keys | Anthropic may change key formats. Check for non-empty string client-side, handle API errors gracefully. |
| Conversation state management | Global state library (Redux, Zustand) | `useReducer` in a custom hook | The conversation state is local to a single page. No global state sharing is needed. `useReducer` provides structured state transitions without library overhead. |

**Key insight:** Phase 2 needs only two new npm dependencies (react-markdown, @tailwindcss/typography). Everything else is built with React primitives (useReducer, useRef, useEffect, useCallback) and Tailwind CSS utilities. Resist the urge to add state management libraries or UI component libraries for what is fundamentally a single-page conversation interface.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Preflight Strips Markdown Styling

**What goes wrong:** react-markdown renders correct HTML elements (h1, h2, p, ul, etc.) but they all appear as unstyled plain text with no visual hierarchy, no list bullets, no link colors.

**Why it happens:** Tailwind CSS v4's preflight (CSS reset) removes all default browser styling from HTML elements. This is by design for Tailwind's utility-first approach, but it means rendered markdown has no visual formatting.

**How to avoid:**
1. Install `@tailwindcss/typography` as a dev dependency.
2. Add `@plugin "@tailwindcss/typography"` to `globals.css`.
3. Wrap react-markdown output in a container with `className="prose"`.
4. Use `prose-zinc` for muted gray tones matching the Notion-like aesthetic.
5. Add `max-w-none` to prevent the prose class from constraining width.

**Warning signs:** All markdown content renders as same-size, same-weight, unstyled text.

### Pitfall 2: Hydration Mismatch from localStorage Reads

**What goes wrong:** The app crashes or shows React hydration warnings because the server-rendered HTML differs from the client-rendered HTML. Specifically, the server renders "no API key" state while the client immediately reads a key from localStorage.

**Why it happens:** `localStorage` does not exist on the server. If you read it during the initial render (e.g., in a `useState` initializer), the server and client produce different HTML, triggering React's hydration mismatch detection.

**How to avoid:**
1. Always read localStorage in `useEffect`, never during initial render.
2. Use a loading/mounted state: render a neutral state until `useEffect` runs and confirms the localStorage value.
3. Never use `typeof window !== "undefined"` checks in the render body as a workaround; use `useEffect` instead.

**Warning signs:** Console errors like "Text content does not match server-rendered HTML" or "Hydration failed because the initial UI does not match."

### Pitfall 3: Stale Concepts in API Requests

**What goes wrong:** The system prompt does not include recently introduced concepts, causing Claude to create duplicate concept IDs or orphaned parentId references.

**Why it happens:** The `existingConcepts` array sent to the API is built from the current `turns` state. If the concept collection logic misses concepts from certain turns (e.g., only checks the latest turn instead of all turns), the system prompt will be incomplete.

**How to avoid:**
1. Build the concept list by iterating over ALL turns, not just the latest one.
2. Deduplicate by concept `id` (same concept may appear in multiple turns).
3. Send the complete deduplicated concept list with every API request.

**Warning signs:** Claude introduces concepts with IDs that already exist, or references parentIds that don't match any existing concept.

### Pitfall 4: Enter Key Submits Blank Messages

**What goes wrong:** User presses Enter on an empty textarea and triggers an API call with an empty message, wasting an API call and producing a confusing Claude response.

**Why it happens:** The Enter key handler calls `onSend()` without checking if the input is non-empty.

**How to avoid:**
1. Check `value.trim()` before calling `onSend()`.
2. Also disable the send button when the input is empty or when loading.
3. Clear the input after a successful send, not before the API call completes.

**Warning signs:** Empty user messages appearing in the conversation, or API errors from empty message content.

### Pitfall 5: Conversation Scroll Position Jumps

**What goes wrong:** When a new message arrives, the scroll jumps abruptly to the bottom even if the user had scrolled up to re-read earlier content.

**Why it happens:** The `scrollIntoView` call in `useEffect` fires on every new message, regardless of the user's current scroll position.

**How to avoid:**
1. For Phase 2 MVP, always scroll to bottom (this is the expected behavior for a live conversation where the user is actively participating).
2. If needed later, check whether the user was already near the bottom before auto-scrolling. Only auto-scroll if they were within ~100px of the bottom.

**Warning signs:** User complaints about losing their place in the conversation. For Phase 2, this is acceptable since the user is always actively conversing.

### Pitfall 6: Confidence Check Input Confusion

**What goes wrong:** The user sees two input areas (the main conversation input and the confidence check input inside the card) and doesn't know which one to use.

**Why it happens:** Both inputs are visible simultaneously without clear visual hierarchy indicating which is active.

**How to avoid:**
1. When a confidence check is pending, hide or disable the main conversation input.
2. Show the confidence check input inside the colored card with a clear prompt.
3. After the user submits the confidence check response, hide the card input and re-enable the main input.
4. Use the `pendingConfidenceCheck` state flag to toggle between these states.

**Warning signs:** Users typing in the main input when a confidence check is active, or ignoring the confidence check entirely.

## Code Examples

### Tailwind CSS 4 Typography Plugin Setup

```css
/* app/globals.css */
/* Source: @tailwindcss/typography README + Tailwind v4 plugin syntax */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Three-Panel Layout Shell

```typescript
// components/conversation-shell.tsx
// Source: Tailwind CSS flexbox documentation
"use client";

export function ConversationShell({ topic }: { topic: string }) {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center border-b px-4 py-3">
        <span className="font-semibold">ThreadTutor</span>
        <span className="ml-4 text-sm text-zinc-500">{topic}</span>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Concept Map placeholder */}
        <div className="w-1/4 border-r p-4">
          <span className="text-sm text-zinc-400">Concept Map</span>
        </div>

        {/* Center: Conversation */}
        <div className="flex w-1/2 flex-col">
          <ConversationPanel topic={topic} />
        </div>

        {/* Right: Learning Journal placeholder */}
        <div className="w-1/4 border-l p-4">
          <span className="text-sm text-zinc-400">Learning Journal</span>
        </div>
      </div>
    </div>
  );
}
```

### Skeleton Message with Shimmer Animation

```typescript
// components/skeleton-message.tsx
// Source: Tailwind CSS animate-pulse documentation
"use client";

export function SkeletonMessage() {
  return (
    <div className="animate-pulse space-y-3 py-4">
      <div className="h-4 w-3/4 rounded bg-zinc-200" />
      <div className="h-4 w-full rounded bg-zinc-200" />
      <div className="h-4 w-5/6 rounded bg-zinc-200" />
      <div className="h-4 w-2/3 rounded bg-zinc-200" />
    </div>
  );
}
```

For a shimmer effect instead of basic pulse, define a custom animation:

```css
/* In globals.css, inside @theme inline or as a separate @theme block */
@theme {
  --animate-shimmer: shimmer 2s infinite;

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
}
```

```typescript
// Shimmer skeleton variant
export function ShimmerSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <div className="h-4 w-3/4 rounded bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-4 w-full rounded bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-4 w-5/6 rounded bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}
```

### Confidence Check Card

```typescript
// components/confidence-check.tsx
// Source: Phase context decisions (colored card with embedded input)
"use client";

import type { ConfidenceCheck } from "@/lib/types";

interface ConfidenceCheckCardProps {
  check: ConfidenceCheck;
  onSubmit?: (answer: string) => void;
  isPending: boolean; // true when waiting for user answer
}

const assessmentStyles: Record<string, string> = {
  tracking: "text-emerald-600 bg-emerald-50",
  partial: "text-amber-600 bg-amber-50",
  confused: "text-rose-600 bg-rose-50",
};

export function ConfidenceCheckCard({ check, onSubmit, isPending }: ConfidenceCheckCardProps) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-indigo-300 bg-indigo-50/50 p-4">
      <p className="text-sm font-medium text-zinc-700">{check.question}</p>

      {/* If assessed, show the result */}
      {check.assessment && (
        <div className="mt-2">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${assessmentStyles[check.assessment]}`}>
            {check.assessment}
          </span>
          {check.feedback && (
            <p className="mt-1 text-sm text-zinc-600">{check.feedback}</p>
          )}
        </div>
      )}

      {/* If pending, show input */}
      {isPending && !check.assessment && onSubmit && (
        <div className="mt-3">
          {/* ChatInput component goes here */}
        </div>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `field-sizing: content` for auto-resize textarea | JavaScript `scrollHeight` measurement | Ongoing (Firefox still lacks support as of Feb 2026) | Cannot rely on CSS-only auto-resize. The JS approach works in all browsers. |
| Tailwind v3 preserves some default HTML styles | Tailwind v4 preflight resets ALL element styles | Tailwind CSS v4 (2025) | Must use `@tailwindcss/typography` plugin for any rendered HTML/markdown content. |
| `className` prop on react-markdown component | Wrap in container div with className | react-markdown v10 (Feb 2025) | Minor breaking change. Wrap `<Markdown>` in a `<div className="prose">` instead of passing className directly. |
| `tailwind.config.js` for plugins | `@plugin` directive in CSS file | Tailwind CSS v4 (2025) | Plugin registration moved from JS config to CSS. Use `@plugin "@tailwindcss/typography"` in globals.css. |

**Deprecated/outdated:**
- `react-markdown` v9 `className` prop: Removed in v10. Use a wrapper div instead.
- `tailwind.config.js` plugin registration: In Tailwind v4, use `@plugin` in CSS. The JS config approach is Tailwind v3.

## Open Questions

1. **react-markdown v10 exact peer dependency on React 19**
   - What we know: react-markdown v9.0.2 added React 19 type fixes. v10.0.0 released shortly after. The project uses React 19.2.3.
   - What's unclear: Whether react-markdown v10.1.0 explicitly lists React 19 as a peer dependency or just works through compatibility.
   - Recommendation: Install and verify. If type errors occur, the components prop types may need adjustment. LOW risk.

2. **@tailwindcss/typography dark mode behavior**
   - What we know: The plugin supports `prose-invert` for dark backgrounds. The project has a `prefers-color-scheme: dark` media query in globals.css.
   - What's unclear: Whether `prose-invert` automatically activates with Tailwind v4's dark mode, or requires explicit configuration.
   - Recommendation: Start with light mode only for Phase 2. Add dark mode support later if needed. The phase context focuses on "clean, minimal, Notion-like" which implies a light theme.

3. **Confidence check flow: two-step API interaction**
   - What we know: When Claude returns a `confidenceCheck`, the user must respond, then the response is sent back for assessment. The assessed confidence check (with `assessment` and `feedback` fields filled) comes in Claude's next response.
   - What's unclear: Whether the confidence check answer should be sent as a regular user message (and Claude's response includes the assessment in the next turn's `confidenceCheck`), or if a separate API pattern is needed.
   - Recommendation: Send the confidence check answer as a regular user message. Claude's system prompt already instructs it to assess and provide feedback. The next response will include the assessment fields. This keeps the API interaction pattern uniform.

## Sources

### Primary (HIGH confidence)
- [react-markdown GitHub repository](https://github.com/remarkjs/react-markdown) - v10 changelog, components prop, basic usage
- [react-markdown changelog](https://github.com/remarkjs/react-markdown/blob/main/changelog.md) - v10.0.0 breaking changes (className removal), v9.0.2 React 19 fixes
- [@tailwindcss/typography GitHub](https://github.com/tailwindlabs/tailwindcss-typography) - Installation, prose class, Tailwind v4 @plugin syntax
- [Tailwind CSS Animation docs](https://tailwindcss.com/docs/animation) - animate-pulse, custom @theme animations, @keyframes in Tailwind v4
- [Tailwind CSS v4 + react-markdown issue](https://github.com/tailwindlabs/tailwindcss/discussions/17645) - Preflight stripping markdown styles, typography plugin as solution
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - "use client" directive, composition patterns
- [Next.js Hydration Error docs](https://nextjs.org/docs/messages/react-hydration-error) - localStorage hydration mismatch prevention
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) - Stateless conversation history, alternating user/assistant messages
- [field-sizing browser support](https://caniuse.com/mdn-css_properties_field-sizing_content) - 74.69% global support, Firefox not supported

### Secondary (MEDIUM confidence)
- [React state management in 2025](https://www.developerway.com/posts/react-state-management-2025) - useReducer for local component state, no global store needed for single-page interactions
- [Chat scroll patterns](https://davelage.com/posts/chat-scroll-react/) - useRef + scrollIntoView for chat auto-scroll
- [react-markdown components prop guide](https://www.singlehanded.dev/blog/understanding-the-components-prop-in-react-markdown) - Custom component rendering

### Tertiary (LOW confidence)
- [Skeleton shimmer animation patterns](https://www.slingacademy.com/article/tailwind-css-creating-shimmer-loading-placeholder-skeleton/) - Community patterns for shimmer with Tailwind, not verified against Tailwind v4 @theme syntax specifically

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-markdown verified via GitHub, @tailwindcss/typography verified via GitHub + Tailwind v4 issue discussion
- Architecture: HIGH - Patterns from official Next.js docs (client components, hydration), React docs (useReducer), Anthropic docs (message format)
- Pitfalls: HIGH - Tailwind v4 preflight issue verified in official GitHub discussion, hydration mismatches documented in Next.js official error docs, concept staleness observed in Phase 1 research

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - stable libraries, well-documented patterns)
