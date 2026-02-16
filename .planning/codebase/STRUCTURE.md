# Codebase Structure

**Analysis Date:** 2026-02-15

## Directory Layout

```
threadtutor/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/                # Server-side API routes
│   │   ├── chat/           # Anthropic proxy endpoint
│   │   └── sessions/       # Dev-mode session file writer
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Landing page (renders TopicPicker)
│   └── globals.css         # Tailwind directives + global styles
├── components/             # React components (client-side)
├── lib/                    # Utilities, hooks, types, domain logic
├── public/                 # Static assets (demo.json, logos, session files)
│   └── sessions/           # Dev-mode generated session JSON files
├── .planning/              # GSD planning artifacts (not in runtime)
├── node_modules/           # Dependencies (not committed)
├── .next/                  # Next.js build output (not committed)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js configuration
├── postcss.config.mjs      # PostCSS for Tailwind
├── eslint.config.mjs       # ESLint configuration
├── CLAUDE.md               # Project guidance for Claude Code
├── README.md               # User-facing documentation
└── SPEC.md                 # Technical specification
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router pages and server-side API routes
- Contains: Root layout, landing page, API proxy routes
- Key files: `page.tsx` (entry), `layout.tsx` (fonts/meta), `api/chat/route.ts` (Anthropic proxy)

**app/api/chat/:**
- Purpose: Server-side proxy to Anthropic API
- Contains: `route.ts` (POST handler)
- Key files: `route.ts` — validates request, builds system prompt, calls Claude with structured output, sanitizes response

**app/api/sessions/:**
- Purpose: Dev-mode endpoint for writing session files to disk
- Contains: `route.ts` (POST handler)
- Key files: `route.ts` — writes JSON to `public/sessions/{id}.json`, gated by `NODE_ENV === 'development'`

**components/:**
- Purpose: React UI components (all client-side, "use client" directive)
- Contains: Shell components, panel components, individual elements
- Key files:
  - `topic-picker.tsx` — landing screen, mode branching logic
  - `conversation-shell.tsx` — live mode orchestrator
  - `replay-shell.tsx` — replay mode orchestrator
  - `conversation-panel.tsx` — message list + input area
  - `concept-map.tsx` — React Flow graph with inline/fullscreen modes
  - `learning-journal.tsx` — journal entry timeline
  - `message.tsx` — single message with markdown rendering
  - `confidence-check.tsx` — confidence check card (pending or assessed)
  - `app-header.tsx` — top navigation bar
  - `replay-controls.tsx` — play/pause/next/back controls
  - `session-list.tsx` — past sessions list (localStorage)

**lib/:**
- Purpose: Shared utilities, custom hooks, types, domain logic
- Contains: TypeScript modules for state, storage, prompts, layout
- Key files:
  - `types.ts` — Zod schemas and TypeScript types (Turn, Session, Concept, TurnResponse)
  - `use-conversation.ts` — conversation state hook (reducer, API calls)
  - `use-replay-state.ts` — replay state hook (step-through logic)
  - `use-interval.ts` — interval timer hook (for auto-play)
  - `session-storage.ts` — localStorage wrappers (save, load, list, delete sessions)
  - `api-key.ts` — localStorage wrapper for API key
  - `system-prompt.ts` — builds dynamic system prompt for Claude
  - `graph-layout.ts` — dagre layout computation, concept collection
  - `topics.ts` — curated topic pool and random picker

**public/:**
- Purpose: Static assets served at root path
- Contains: SVG logos, demo.json (pre-recorded session), session files (dev-mode)
- Key files:
  - `demo.json` — pre-recorded session for replay mode (no API key required)
  - `sessions/` — dev-mode generated session files (not committed, created on-demand)

**public/sessions/:**
- Purpose: Dev-mode storage for session JSON files
- Contains: UUID-named JSON files written by `/api/sessions`
- Generated: Yes (via API route during local dev)
- Committed: No (individual session files not committed, only demo.json)

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Application root (renders `TopicPicker`)
- `components/topic-picker.tsx`: Landing screen, mode selection logic
- `components/conversation-shell.tsx`: Live conversation orchestrator
- `components/replay-shell.tsx`: Replay mode orchestrator

**Configuration:**
- `package.json`: Dependencies and npm scripts
- `tsconfig.json`: TypeScript compiler settings
- `next.config.ts`: Next.js configuration (minimal)
- `postcss.config.mjs`: PostCSS plugins for Tailwind
- `eslint.config.mjs`: ESLint rules
- `CLAUDE.md`: Project guidance for Claude Code

**Core Logic:**
- `lib/types.ts`: Canonical data structures (Zod schemas + TS types)
- `lib/use-conversation.ts`: Conversation state management
- `lib/system-prompt.ts`: System prompt builder (Socratic tutoring logic)
- `lib/graph-layout.ts`: Concept graph layout (dagre wrapper)
- `app/api/chat/route.ts`: Anthropic API proxy

**Testing:**
- Not detected (no test files present)

## Naming Conventions

**Files:**
- Kebab-case: `conversation-shell.tsx`, `session-storage.ts`, `use-conversation.ts`
- Custom hooks: Prefixed with `use-` (e.g. `use-conversation.ts`)
- React components: Kebab-case files, PascalCase exports (e.g. `topic-picker.tsx` exports `TopicPicker`)
- API routes: `route.ts` (Next.js App Router convention)

**Directories:**
- Lowercase: `app`, `components`, `lib`, `public`
- API routes: Nested directories under `app/api/` (e.g. `app/api/chat/route.ts` → `/api/chat`)

**Components:**
- Shell components: Suffix with `Shell` (e.g. `ConversationShell`, `ReplayShell`)
- Panel components: Suffix with `Panel` (e.g. `ConversationPanel`)
- Feature components: Descriptive names (e.g. `ConceptMap`, `LearningJournal`, `TopicPicker`)

**Hooks:**
- Prefix: `use` (e.g. `useConversation`, `useReplayState`)
- Files: Kebab-case with `use-` prefix (e.g. `use-conversation.ts`)

## Where to Add New Code

**New Feature (e.g. confidence check analytics):**
- Primary code: `lib/analytics.ts` (if pure logic) or `components/analytics-panel.tsx` (if UI)
- Tests: No test infrastructure present (would go in `__tests__/` or co-located `*.test.ts`)

**New Component/Module:**
- Implementation: `components/{feature-name}.tsx` for UI, `lib/{feature-name}.ts` for logic
- Imports: Use `@/` path alias (maps to project root via tsconfig)

**New API Route:**
- Implementation: `app/api/{route-name}/route.ts`
- Accessible at: `/api/{route-name}`

**New Hook:**
- Implementation: `lib/use-{feature}.ts`
- Export: Named export matching filename (e.g. `export function useFeature()`)

**Utilities:**
- Shared helpers: `lib/{util-name}.ts`
- Domain logic: `lib/{domain}.ts` (e.g. `graph-layout.ts`, `system-prompt.ts`)

**UI Shell (new mode):**
- Shell component: `components/{mode}-shell.tsx`
- Branching logic: Add to `components/topic-picker.tsx` state/render logic

**Session Storage Extensions:**
- Extend: `lib/session-storage.ts` (add functions, update index logic)
- Types: Add to `lib/types.ts` if new data structures needed

## Special Directories

**.planning/:**
- Purpose: GSD planning artifacts (phases, milestones, codebase docs)
- Generated: Yes (by GSD commands)
- Committed: Yes
- Runtime: Not imported or used by application code

**.next/:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build` and `next dev`)
- Committed: No (.gitignore)

**node_modules/:**
- Purpose: npm package dependencies
- Generated: Yes (by `npm install`)
- Committed: No (.gitignore)

**public/sessions/:**
- Purpose: Dev-mode session file storage (for demo creation workflow)
- Generated: Yes (by `/api/sessions` endpoint)
- Committed: Partially (demo.json is committed, individual session files are not)

**.vscode/:**
- Purpose: VSCode workspace settings
- Generated: Yes (by editor)
- Committed: Selectively (virtualTab.json present)

## Path Alias

**@/ → Project Root:**
- Configured in: `tsconfig.json` (`"@/*": ["./*"]`)
- Usage: `import { Turn } from "@/lib/types"` instead of `../../lib/types`
- Applies to: All TypeScript files (components, lib, app)

## Import Organization

**Observed Pattern:**
1. React imports (from "react", "react-dom")
2. External library imports (from "@anthropic-ai/sdk", "@xyflow/react", etc.)
3. Internal imports (from "@/lib/...", "@/components/...")
4. Type-only imports (using `type` modifier)
5. CSS imports (e.g. `import "@xyflow/react/dist/style.css"`)

**Example from `concept-map.tsx`:**
```typescript
import { useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ReactFlow, Panel, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ConceptNode } from "@/components/concept-node";
import { collectAllConcepts } from "@/lib/graph-layout";
import type { Turn } from "@/lib/types";
```

## File Size Patterns

**Large files (>200 lines):**
- `components/concept-map.tsx` (310 lines) — complex inline/fullscreen dual-mode component
- `components/topic-picker.tsx` (297 lines) — landing screen with multi-mode branching
- `lib/use-conversation.ts` (220 lines) — reducer + API logic with detailed comments
- `app/api/chat/route.ts` (174 lines) — API proxy with extensive error handling and sanitization

**Medium files (100-200 lines):**
- `components/conversation-shell.tsx` (166 lines)
- `components/conversation-panel.tsx` (194 lines)
- `lib/session-storage.ts` (162 lines)

**Small files (<100 lines):**
- Most component files (single-purpose UI elements)
- Most lib utilities (focused modules)
- All API routes except `/api/chat`

---

*Structure analysis: 2026-02-15*
