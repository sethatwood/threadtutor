# Architecture Research

**Domain:** AI-assisted Socratic learning app with real-time concept map visualization
**Researched:** 2026-02-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                              │
│  ┌──────────────┐  ┌───────────────────┐  ┌───────────────────┐        │
│  │  ConceptMap   │  │ ConversationPanel │  │  LearningJournal  │        │
│  │ (React Flow)  │  │   (chat UI)       │  │  (summary list)   │        │
│  └──────┬───────┘  └────────┬──────────┘  └────────┬──────────┘        │
│         │                   │                      │                    │
│  ┌──────┴───────┐  ┌───────┴──────────┐  ┌────────┴──────────┐        │
│  │ ReplayControls│  │   TopicPicker    │  │  SessionExport    │        │
│  └──────────────┘  │   ApiKeyInput    │  └───────────────────┘        │
│                     └──────────────────┘                                │
├─────────────────────────────────────────────────────────────────────────┤
│                      State Management Layer                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Session State (React)                          │   │
│  │  currentSession: Session | null                                   │   │
│  │  currentTurnIndex: number (replay) | turns.length (live)          │   │
│  │  mode: "replay" | "live"                                          │   │
│  │  apiKey: string | null                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                    │
│  ┌──────────────┐  ┌───────────────────┐  ┌───────────────────┐        │
│  │ session-store│  │   api-key.ts      │  │  system-prompt.ts │        │
│  │    .ts       │  │ (localStorage)    │  │  (prompt builder) │        │
│  └──────────────┘  └───────────────────┘  └───────────────────┘        │
├─────────────────────────────────────────────────────────────────────────┤
│                        API Layer                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │           app/api/chat/route.ts (Next.js Route Handler)          │   │
│  │  - Receives: messages[], topic, apiKey                            │   │
│  │  - Injects: system prompt, output_config schema                   │   │
│  │  - Calls: Anthropic SDK with user's API key                       │   │
│  │  - Returns: parsed Turn data                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                      External Services                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Anthropic API (Claude Sonnet 4.5)                    │   │
│  │  - Structured output via output_config.format + JSON schema       │   │
│  │  - Constrained decoding guarantees valid JSON                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

Storage:
  ┌──────────────┐  ┌───────────────────┐
  │ localStorage │  │  /public/sessions/ │
  │ (browser)    │  │  (dev-only disk)   │
  └──────────────┘  └───────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **ConversationPanel** | Renders chat messages, handles user input, displays confidence checks | Client Component. Receives `turns[]` and `currentTurnIndex` as props. In live mode, owns a text input and submit handler. |
| **ConceptMap** | Visualizes concept graph, animates node appearance, handles hover for descriptions | Client Component wrapping React Flow. Derives nodes/edges from `turns[0..currentTurnIndex].concepts`. Uses dagre for auto-layout. |
| **LearningJournal** | Shows running list of summary entries | Client Component. Filters `turns[0..currentTurnIndex]` for non-null `journalEntry` values. Pure display. |
| **ReplayControls** | Next/Back/Auto-play buttons for stepping through a recorded session | Client Component. Increments/decrements `currentTurnIndex`. Only visible in replay mode. |
| **TopicPicker** | Starting screen where user selects a topic | Client Component. Sets `topic` in session state, triggers first API call. Only visible pre-session in live mode. |
| **ApiKeyInput** | API key entry with localStorage persistence | Client Component. Reads/writes via `api-key.ts` helpers. Shown when no key is stored and live mode is requested. |
| **SessionExport** | Download session as JSON button | Client Component. Serializes current session to JSON blob, triggers browser download. |
| **app/api/chat/route.ts** | CORS proxy to Anthropic API | Server-side Route Handler. Receives API key from request body (live) or env var (dev). Never stores the key. |
| **session-store.ts** | Session CRUD operations against localStorage | Pure functions: `saveSession()`, `loadSession()`, `listSessions()`, `exportSession()`. |
| **api-key.ts** | API key read/write from localStorage | Pure functions: `getApiKey()`, `setApiKey()`, `clearApiKey()`. |
| **system-prompt.ts** | Builds the system prompt string given a topic | Pure function: `buildSystemPrompt(topic: string): string`. |
| **types.ts** | TypeScript interfaces for Session, Turn, Concept, ConfidenceCheck | Type definitions only. No runtime code. |

## Recommended Project Structure

```
threadtutor/
├── app/
│   ├── page.tsx                 # Main page, orchestrates mode routing
│   ├── layout.tsx               # Root layout, metadata, fonts
│   └── api/
│       └── chat/
│           └── route.ts         # Anthropic API proxy
├── components/
│   ├── ConversationPanel.tsx    # Chat display (center panel)
│   ├── ConceptMap.tsx           # React Flow graph (left panel)
│   ├── LearningJournal.tsx      # Summary list (right panel)
│   ├── ReplayControls.tsx       # Replay navigation
│   ├── TopicPicker.tsx          # Topic selection screen
│   ├── ApiKeyInput.tsx          # API key entry
│   └── SessionExport.tsx        # JSON download button
├── lib/
│   ├── types.ts                 # Session/Turn/Concept interfaces
│   ├── system-prompt.ts         # System prompt builder
│   ├── session-store.ts         # localStorage session CRUD
│   ├── api-key.ts               # localStorage API key helpers
│   └── graph-layout.ts          # Dagre layout utility for concept map
├── public/
│   └── sessions/
│       └── demo.json            # Pre-recorded showcase session
├── .env.local                   # ANTHROPIC_API_KEY (dev only, not committed)
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

### Structure Rationale

- **app/:** Next.js App Router convention. Only `page.tsx`, `layout.tsx`, and API routes live here. No business logic.
- **components/:** All React components. Flat structure (no nesting) because there are only 7 components. If the project grew past ~15 components, organize by feature (e.g., `components/map/`, `components/chat/`).
- **lib/:** Pure logic modules with no React dependency (except `types.ts` which is just interfaces). This separation allows unit testing without rendering components.
- **lib/graph-layout.ts:** Dedicated module for dagre layout computation. Keeps the ConceptMap component focused on rendering, not graph math.
- **public/sessions/:** Static files served directly. The demo.json is committed; other session files are dev-only artifacts.

## Architectural Patterns

### Pattern 1: Centralized Session State with Derived Views

**What:** All three panels derive their display from a single `Session` object and a `currentTurnIndex` number. The session is the single source of truth. No panel has its own independent data.

**When to use:** Any multi-panel app where panels show different views of the same data.

**Trade-offs:**
- Pro: Panels are always in sync. No race conditions. Simple mental model.
- Pro: Replay is trivial -- just change `currentTurnIndex`.
- Con: All re-render on turn change. Mitigated by React's reconciliation (only changed DOM updates).

**Example:**
```typescript
// page.tsx (simplified)
function ThreadTutorApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [mode, setMode] = useState<"replay" | "live">("replay");

  // Derive visible data from session + turnIndex
  const visibleTurns = session?.turns.slice(0, turnIndex + 1) ?? [];
  const allConcepts = visibleTurns.flatMap(t => t.concepts);
  const journalEntries = visibleTurns
    .filter(t => t.journalEntry)
    .map(t => t.journalEntry!);

  return (
    <div className="grid grid-cols-[1fr_2fr_1fr] h-screen">
      <ConceptMap concepts={allConcepts} />
      <ConversationPanel
        turns={visibleTurns}
        mode={mode}
        onSendMessage={handleSendMessage}
      />
      <LearningJournal entries={journalEntries} />
    </div>
  );
}
```

### Pattern 2: API Route as CORS Proxy with BYOK

**What:** The Next.js Route Handler receives the user's API key in the request body, uses it to call the Anthropic API server-side, and returns the structured response. The key is never stored, logged, or persisted on the server.

**When to use:** When calling an API that does not support browser CORS and you need users to bring their own keys.

**Trade-offs:**
- Pro: Anthropic API requires server-to-server calls (no CORS for browsers). This is the standard solution.
- Pro: BYOK means zero server-side cost for API calls.
- Con: Each request includes the API key in the body -- must use HTTPS (Vercel default) and never log request bodies.
- Con: No rate limiting or abuse prevention. Acceptable for a demo app.

**Example:**
```typescript
// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { turnSchema } from "@/lib/types"; // Zod schema for validation

export async function POST(request: Request) {
  const { messages, topic, apiKey } = await request.json();

  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { error: "No API key provided" },
      { status: 401 }
    );
  }

  const client = new Anthropic({ apiKey: key });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: buildSystemPrompt(topic),
    messages,
    output_config: {
      format: {
        type: "json_schema",
        schema: turnSchema, // JSON Schema for Turn structure
      },
    },
  });

  const turnData = JSON.parse(response.content[0].text);
  return Response.json(turnData);
}
```

### Pattern 3: Structured Output via Constrained Decoding

**What:** Use Anthropic's `output_config.format` with a JSON schema to guarantee Claude returns valid, parseable JSON matching the Turn schema. No need for manual JSON.parse error handling, regex stripping of markdown fences, or retry loops.

**When to use:** Whenever Claude's response must be machine-readable structured data rather than freeform text.

**Trade-offs:**
- Pro: Guaranteed schema compliance via constrained decoding. Zero parsing errors.
- Pro: Available on Claude Sonnet 4.5 (GA, no beta header needed).
- Con: First request with a new schema has extra latency for grammar compilation (cached for 24 hours after).
- Con: Slightly higher input token count due to injected format instructions.
- Con: Incompatible with message prefilling and citations.

**Important:** The SPEC mentions stripping markdown code fences from JSON. With `output_config.format`, this is unnecessary -- the response is guaranteed valid JSON. This is a significant simplification over prompt-only approaches.

**Schema definition with Zod (recommended):**
```typescript
// lib/types.ts
import { z } from "zod";

export const ConceptSchema = z.object({
  id: z.string(),
  label: z.string(),
  parentId: z.string().nullable(),
  description: z.string(),
});

export const ConfidenceCheckSchema = z.object({
  question: z.string(),
  assessment: z.enum(["tracking", "partial", "confused"]).optional(),
  feedback: z.string().optional(),
});

export const TurnResponseSchema = z.object({
  displayText: z.string(),
  concepts: z.array(ConceptSchema),
  confidenceCheck: ConfidenceCheckSchema.nullable(),
  journalEntry: z.string().nullable(),
});
```

## Data Flow

### Live Mode: Request Flow

```
User types message
    |
    v
ConversationPanel.onSendMessage(text)
    |
    v
page.tsx: append user Turn to session.turns
    |
    v
fetch("/api/chat", {
  body: { messages, topic, apiKey }
})
    |
    v
API Route (route.ts):
  1. Extract apiKey from body (or fallback to env var)
  2. Build system prompt with topic
  3. Call Anthropic SDK with output_config.format (JSON schema)
  4. Parse response.content[0].text as JSON (guaranteed valid)
  5. Return structured Turn data
    |
    v
page.tsx: append assistant Turn to session.turns
    |
    v
Three panels re-render with updated data:
  - ConversationPanel: new message appears
  - ConceptMap: new nodes/edges animate in via dagre re-layout
  - LearningJournal: new entry appears (if journalEntry non-null)
```

### Replay Mode: Stepping Flow

```
Page loads
    |
    v
Load /public/sessions/demo.json (or localStorage session)
    |
    v
Set session = loaded data, turnIndex = 0
    |
    v
User clicks "Next" (ReplayControls)
    |
    v
turnIndex += 1
    |
    v
Three panels re-render showing turns[0..turnIndex]:
  - ConversationPanel: next message revealed
  - ConceptMap: concepts from new turn animate in
  - LearningJournal: journal entry from new turn appears
```

### Concept Map: Data Transformation Flow

```
session.turns[0..turnIndex]
    |
    v
flatMap(turn => turn.concepts)  -->  Concept[]
    |
    v
Transform to React Flow format:
  concepts.map(c => ({
    id: c.id,
    type: "concept",           // custom node type
    data: { label: c.label, description: c.description },
    position: { x: 0, y: 0 }, // placeholder, dagre will set
  }))
    |
    v
Build edges from parentId:
  concepts
    .filter(c => c.parentId)
    .map(c => ({
      id: `${c.parentId}-${c.id}`,
      source: c.parentId,
      target: c.id,
    }))
    |
    v
Run dagre layout:
  graph-layout.ts: getLayoutedElements(nodes, edges, "TB")
  - Creates dagre graph
  - Adds each node with dimensions
  - Adds each edge
  - Runs dagre.layout()
  - Transforms center-anchor to top-left-anchor positions
    |
    v
React Flow renders with updated positions
  - New nodes appear with CSS transition/animation
  - Existing nodes animate to new positions via React Flow's built-in transitions
```

### State Management

```
                    ┌──────────────────────┐
                    │     page.tsx          │
                    │  useState(session)    │
                    │  useState(turnIndex)  │
                    │  useState(mode)       │
                    └──────────┬───────────┘
                               │ props
          ┌────────────────────┼────────────────────┐
          v                    v                    v
   ConceptMap          ConversationPanel     LearningJournal
   (reads concepts)    (reads turns,         (reads journalEntries)
                        sends messages)

  Interaction callbacks flow UP via props:
    - onSendMessage (ConversationPanel -> page.tsx)
    - onNextTurn (ReplayControls -> page.tsx)
    - onPrevTurn (ReplayControls -> page.tsx)
    - onTopicSelect (TopicPicker -> page.tsx)
    - onApiKeySet (ApiKeyInput -> page.tsx)
```

**Why not Context or Zustand?** The state is simple (one session object, one index number, one mode flag) and consumed by a small number of components at one level of nesting. Lifting state to `page.tsx` and passing props is the simplest, most debuggable approach. Adding a state library would be premature abstraction. If the app grew to need modals, settings panels, or deeply nested consumers, then Context or Zustand would be appropriate.

### Key Data Flows

1. **Live conversation:** User input -> API route -> Anthropic -> structured Turn -> append to session -> panels update
2. **Replay stepping:** turnIndex increment -> panels derive visible slice -> render
3. **Session persistence:** Session object -> JSON.stringify -> localStorage (on save/complete)
4. **Session export:** Session object -> JSON blob -> browser download
5. **API key flow:** User input -> localStorage (via api-key.ts) -> read from localStorage on each API call -> sent in request body

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is more than sufficient. localStorage per-browser, no server state, BYOK. Vercel free tier handles the API route proxying easily. |
| 1k-10k users | Still fine. Each user brings their own API key, so there is no server-side cost scaling. The API route is stateless. Vercel serverless functions scale horizontally. |
| 10k+ users | Consider adding rate limiting on the API route to prevent abuse. Could add simple IP-based throttling via Vercel middleware. The concept map will not hit performance limits since sessions are ~20-40 turns (max ~100 nodes). |

### Scaling Priorities

1. **First bottleneck: Anthropic API latency.** Each turn requires a round-trip to Anthropic (~1-3 seconds). This is inherent to the domain and not something architecture can fix. Users will see a loading state between turns. Consider adding a "typing" indicator or skeleton state.
2. **Second bottleneck: Concept map re-layout.** Dagre re-layouts the entire graph on each new turn. For small graphs (< 100 nodes), this is instant. For very large graphs, d3-hierarchy or elkjs could replace dagre, but this is unlikely to be needed given session sizes of ~20-40 turns with 1-3 concepts each (max ~120 nodes).

## Anti-Patterns

### Anti-Pattern 1: Streaming JSON Responses

**What people do:** Try to stream Claude's JSON response token-by-token and parse it incrementally for a "typing" effect.
**Why it's wrong:** Partial JSON is not parseable. You cannot update the concept map or learning journal until the full response is received. Streaming creates complexity (partial parse buffers, error recovery) for no benefit when the response must be consumed atomically.
**Do this instead:** Send a non-streaming request. Show a loading indicator while waiting. Parse the complete JSON response on arrival and update all panels simultaneously. The 1-3 second wait with a loading state is a better UX than a half-rendered concept map.

### Anti-Pattern 2: Independent Panel State

**What people do:** Give each panel its own state, with the ConversationPanel managing its own message list, the ConceptMap managing its own node list, and the LearningJournal managing its own entry list.
**Why it's wrong:** Panels get out of sync. In replay mode, stepping to the next turn must update all three panels atomically. With independent state, you need synchronization logic, which is fragile and hard to debug.
**Do this instead:** Single session object in the parent. All panels are pure views that derive their display from `session.turns[0..turnIndex]`. Zero synchronization needed.

### Anti-Pattern 3: Storing API Keys Server-Side

**What people do:** Accept the user's API key and store it in a database or session cookie for convenience.
**Why it's wrong:** You become responsible for securing other people's API keys. Breach liability. Regulatory concerns. Unnecessary complexity.
**Do this instead:** Store the key only in localStorage (client-side). Send it per-request in the POST body over HTTPS. Never log it. Never persist it server-side. The server-side Route Handler is stateless.

### Anti-Pattern 4: Using React Flow for Static Layout Without Dagre

**What people do:** Manually position nodes in the concept map using hardcoded x/y coordinates or simple grid math.
**Why it's wrong:** The graph structure is not known ahead of time (it depends on what Claude teaches). Manual positioning creates overlapping nodes, poor spacing, and visual chaos as the graph grows.
**Do this instead:** Use dagre to compute node positions from the graph topology. Dagre handles spacing, edge crossing minimization, and hierarchical layout automatically. The "TB" (top-to-bottom) direction matches the tree-like structure of concept hierarchies.

### Anti-Pattern 5: Parsing Claude JSON with Regex/String Manipulation

**What people do:** Ask Claude to return JSON via prompt instructions, then use regex to strip markdown fences and try/catch JSON.parse with retries.
**Why it's wrong:** Fragile. Claude occasionally wraps JSON in backticks, adds explanatory text, or produces malformed JSON. Retry loops waste tokens and time.
**Do this instead:** Use Anthropic's structured output via `output_config.format` with a JSON schema. Constrained decoding guarantees valid JSON matching your schema on every response. Define the schema in Zod and use `zodOutputFormat()` from the SDK. Zero parsing errors, zero retries.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Anthropic API** | Server-side SDK via Route Handler. `output_config.format` for guaranteed JSON. User's BYOK key passed per-request. | Model: `claude-sonnet-4-5-20250929`. Max tokens: 1024. No streaming (full response needed for structured data). First request with new schema has ~1s extra latency for grammar compilation (cached 24h). |
| **Vercel** | Standard Next.js deployment. Auto-deploy on push. Serverless functions for API route. | Free tier sufficient. No env vars needed in production (BYOK). In dev, `ANTHROPIC_API_KEY` in `.env.local`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **page.tsx <-> ConversationPanel** | Props down, callbacks up | `turns[]`, `onSendMessage(text)` |
| **page.tsx <-> ConceptMap** | Props down only | `concepts[]` (derived from turns). ConceptMap is read-only display. |
| **page.tsx <-> LearningJournal** | Props down only | `entries[]` (derived from turns). LearningJournal is read-only display. |
| **page.tsx <-> ReplayControls** | Props down, callbacks up | `turnIndex`, `maxIndex`, `onNext()`, `onPrev()`, `onAutoPlay()` |
| **page.tsx <-> API Route** | HTTP POST (fetch) | Request: `{ messages, topic, apiKey }`. Response: Turn JSON. |
| **API Route <-> Anthropic** | Anthropic SDK (server-side) | Injects system prompt, passes message history, receives structured JSON. |
| **Components <-> localStorage** | Via lib/ helper functions | Components never call localStorage directly. Always through `session-store.ts` and `api-key.ts`. |

## Build Order Implications

The architecture reveals a clear dependency chain that should inform phase ordering:

```
types.ts (no dependencies)
    |
    v
system-prompt.ts (depends on: types.ts for Turn schema)
    |
    v
api/chat/route.ts (depends on: system-prompt.ts, types.ts, @anthropic-ai/sdk)
    |
    v
session-store.ts (depends on: types.ts)
api-key.ts (no dependencies beyond browser APIs)
graph-layout.ts (depends on: types.ts, dagre)
    |
    v
ConversationPanel (depends on: types.ts)
ConceptMap (depends on: types.ts, graph-layout.ts, @xyflow/react)
LearningJournal (depends on: types.ts)
    |
    v
page.tsx (depends on: all components, session-store.ts, api-key.ts)
    |
    v
ReplayControls, TopicPicker, ApiKeyInput, SessionExport (depend on: page.tsx context)
```

**Recommended build sequence:**

1. **Foundation:** `types.ts`, `system-prompt.ts`, project scaffold (Next.js + Tailwind + TypeScript)
2. **API integration:** `api/chat/route.ts` -- get Claude responding with structured JSON via `output_config.format`. Test with curl or a simple form.
3. **Core conversation:** `ConversationPanel` + `page.tsx` wiring. Live session working end-to-end (text in, structured response rendered).
4. **Session persistence:** `session-store.ts` + localStorage integration. Save/load sessions.
5. **Concept map:** `graph-layout.ts` + `ConceptMap` component. Wire React Flow + dagre to render concepts from session.
6. **Learning journal:** `LearningJournal` component. Straightforward once session state exists.
7. **Replay mode:** `ReplayControls` + demo.json loading. Replay is just setting turnIndex.
8. **BYOK flow:** `api-key.ts` + `ApiKeyInput` + route.ts key-from-body handling.
9. **Polish:** Animations, responsive layout, TopicPicker, SessionExport, landing experience.

## Sources

- [React Flow Layouting Overview](https://reactflow.dev/learn/layouting/layouting) -- Dagre, d3-hierarchy, elkjs comparison (HIGH confidence)
- [React Flow Dagre Example](https://reactflow.dev/examples/layout/dagre) -- Integration pattern and code (HIGH confidence)
- [React Flow Dynamic Layouting](https://reactflow.dev/examples/layout/dynamic-layouting) -- Animated node repositioning pattern (HIGH confidence)
- [React Flow Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) -- Custom node component pattern (HIGH confidence)
- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- `output_config.format`, JSON schema, Zod integration, GA on Sonnet 4.5 (HIGH confidence)
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) -- App Router API route conventions (HIGH confidence)
- [Next.js Proxy API Route Guide](https://blog.nextsaaspilot.com/nextjs-proxy-api-route/) -- CORS proxy pattern for external APIs (MEDIUM confidence)
- [React State Lifting](https://react.dev/learn/sharing-state-between-components) -- Multi-panel synchronized state pattern (HIGH confidence)
- [Parsnip: Building AI Tutors That Work](https://parsnip.substack.com/p/knowledge) -- Pedagogical knowledge graph architecture patterns (MEDIUM confidence)
- [AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/) -- Chat UI architecture for AI apps (MEDIUM confidence)

---
*Architecture research for: ThreadTutor -- AI-assisted Socratic learning with real-time concept mapping*
*Researched: 2026-02-14*
