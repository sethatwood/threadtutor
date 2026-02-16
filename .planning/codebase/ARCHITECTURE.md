# Architecture

**Analysis Date:** 2026-02-15

## Pattern Overview

**Overall:** Client-Side React Application with API Proxy Pattern

**Key Characteristics:**
- Next.js App Router with server-side API routes acting as proxy to Anthropic
- Client-side state management via React hooks and reducers
- Structured JSON responses from Claude enforced via Zod schemas
- Session persistence in browser localStorage with optional dev-mode disk writes
- Three operational modes sharing identical UI components: Live, Replay, and Local Dev

## Layers

**Presentation Layer (Components):**
- Purpose: React components rendering UI, handling user interaction, managing local UI state
- Location: `components/`
- Contains: Shell components, panel components, individual UI elements
- Depends on: Hooks from `lib/`, type definitions from `lib/types.ts`
- Used by: Next.js pages in `app/`

**State Management Layer (Hooks):**
- Purpose: Encapsulate conversation logic, replay logic, session restoration, interval timers
- Location: `lib/use-*.ts` files
- Contains: Custom React hooks (`useConversation`, `useReplayState`, `useInterval`)
- Depends on: Type definitions, API routes, session storage utilities
- Used by: Shell components (`ConversationShell`, `ReplayShell`, `TopicPicker`)

**API Proxy Layer (Server Routes):**
- Purpose: Forward client requests to Anthropic API, apply BYOK pattern, sanitize responses
- Location: `app/api/`
- Contains: `/api/chat` (Claude proxy), `/api/sessions` (dev-mode file writes)
- Depends on: Anthropic SDK, Zod schemas, system prompt builder
- Used by: `useConversation` hook via fetch

**Data Layer (Storage & Types):**
- Purpose: Define canonical data structures, persist sessions, manage API keys
- Location: `lib/types.ts`, `lib/session-storage.ts`, `lib/api-key.ts`
- Contains: Zod schemas, TypeScript types, localStorage wrappers
- Depends on: Zod library
- Used by: All layers

**Domain Layer (Business Logic):**
- Purpose: System prompt generation, graph layout computation, topic selection
- Location: `lib/system-prompt.ts`, `lib/graph-layout.ts`, `lib/topics.ts`
- Contains: Core tutoring logic, dagre layout wrapper, curated topic pool
- Depends on: Type definitions, dagre library
- Used by: API routes, presentation components

## Data Flow

**Live Mode Conversation Flow:**

1. User types message in `ConversationPanel` → calls `sendMessage()` from `useConversation`
2. `useConversation` dispatches `ADD_USER_TURN` → turn appears immediately in UI
3. Hook builds message history via `buildMessages()`, collects existing concepts
4. Fetch POST to `/api/chat` with messages, topic, apiKey, existingConcepts
5. `/api/chat` builds system prompt via `buildSystemPrompt()`, calls Anthropic with Zod output format
6. API route parses structured JSON, sanitizes em dashes, returns `TurnResponse`
7. Hook dispatches `RECEIVE_RESPONSE` → assistant turn added to state
8. `ConversationShell` auto-saves to localStorage via `saveSession()`
9. All three panels (Conversation, ConceptMap, LearningJournal) re-render with updated `state.turns`

**Replay Mode Flow:**

1. `ReplayShell` receives pre-loaded `Session` object (from demo.json or localStorage)
2. `useReplayState` initializes `currentIndex = 0`, slices `visibleTurns = turns.slice(0, 1)`
3. User clicks next/back or toggles auto-play → `currentIndex` updates
4. `visibleTurns` slice updates → all panels receive new turn array
5. No API calls, no state mutation — pure derived state from session data

**State Management:**
- Conversation state managed by `useReducer` in `useConversation` (turns array, loading, error, pendingConfidenceCheck)
- Replay state managed by `useState` in `useReplayState` (currentIndex, isPlaying)
- Session persistence handled externally by `ConversationShell` via `useEffect` watching `state.turns`
- API key stored in localStorage, read on mount, passed per-request (never stored server-side)

## Key Abstractions

**Turn:**
- Purpose: Represents one conversational exchange (user or assistant)
- Examples: User question, assistant response with concepts and journal entry
- Pattern: Immutable objects in an append-only array
- Location: Defined in `lib/types.ts`, consumed everywhere

**Session:**
- Purpose: Encapsulates a complete learning conversation (topic, turns, metadata)
- Examples: Live session auto-saved to localStorage, demo.json for replay mode
- Pattern: Container object with ID, topic, createdAt, turns array
- Location: `lib/types.ts`, `lib/session-storage.ts`, `app/api/sessions/route.ts`

**Concept:**
- Purpose: Node in the knowledge graph (id, label, parentId, description)
- Examples: Root concept with `parentId: null`, child concepts referencing parent IDs
- Pattern: Validated by Zod schema, enforced via structured output, deduplicated by `collectConcepts()`
- Location: `lib/types.ts` (schema and type), `lib/graph-layout.ts` (collection/layout)

**TurnResponse (Structured Output):**
- Purpose: Claude's complete response for one turn (displayText, concepts, confidenceCheck, journalEntry)
- Pattern: Zod schema converted to JSON Schema via `zodOutputFormat()`, enforced by Anthropic API
- Location: `lib/types.ts` (schema), `app/api/chat/route.ts` (enforced via output_config)

**ConversationState (Reducer State):**
- Purpose: Complete state for an active conversation (turns, loading, error, pendingConfidenceCheck, turnNumber)
- Pattern: Managed by reducer in `useConversation`, actions dispatch state updates
- Location: `lib/use-conversation.ts`

## Entry Points

**Application Entry:**
- Location: `app/page.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Renders `TopicPicker` component (landing screen)

**TopicPicker:**
- Location: `components/topic-picker.tsx`
- Triggers: User interaction (topic selection, API key entry, demo load)
- Responsibilities: Branching logic — renders `ConversationShell`, `ReplayShell`, or topic input UI

**ConversationShell:**
- Location: `components/conversation-shell.tsx`
- Triggers: Rendered by `TopicPicker` when user starts live conversation or loads past session
- Responsibilities: Orchestrate three-panel layout, manage conversation hook, auto-save sessions

**ReplayShell:**
- Location: `components/replay-shell.tsx`
- Triggers: Rendered by `TopicPicker` when demo.json is loaded
- Responsibilities: Orchestrate three-panel layout, manage replay state, handle controls

**API Route: /api/chat:**
- Location: `app/api/chat/route.ts`
- Triggers: POST from `useConversation.sendMessage()`
- Responsibilities: Proxy to Anthropic, build system prompt, enforce structured output, sanitize response

**API Route: /api/sessions:**
- Location: `app/api/sessions/route.ts`
- Triggers: POST from `ConversationShell` in dev mode only
- Responsibilities: Write session JSON to `public/sessions/{id}.json` for demo creation

## Error Handling

**Strategy:** Errors surfaced to UI via reducer state, specific error types handled with user-friendly messages

**Patterns:**
- API route errors: Anthropic SDK error types caught (`AuthenticationError`, `RateLimitError`), returned as JSON with HTTP status
- Client errors: `useConversation` catches fetch errors, dispatches `SET_ERROR` action, error banner displayed in `ConversationPanel`
- Validation errors: Zod schemas prevent invalid data from entering the system (structured output guarantees schema compliance)
- Storage errors: `saveSession()` catches `QuotaExceededError`, logs warning, does not block user flow
- Orphaned concepts: `buildGraphElements()` validates `parentId` before creating edges, treats invalid refs as roots (silent recovery)

## Cross-Cutting Concerns

**Logging:** Console.warn for storage failures and API errors (server-side console.error for unexpected errors)

**Validation:**
- Zod schemas enforce structure at API boundary (`TurnResponseSchema` via `zodOutputFormat`)
- TypeScript provides compile-time safety
- Runtime validation: API route checks required fields (messages, topic), returns 400 for invalid requests

**Authentication:**
- BYOK (Bring Your Own Key) pattern
- API key stored in localStorage (`lib/api-key.ts`)
- Key sent per-request to `/api/chat`, never logged or persisted server-side
- Dev mode fallback: API route reads `ANTHROPIC_API_KEY` from `.env.local` if no client key provided
- No user authentication, no backend identity system

---

*Architecture analysis: 2026-02-15*
