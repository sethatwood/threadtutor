---
phase: 01-foundation-api
plan: 01
subsystem: api
tags: [next.js, typescript, zod, anthropic-sdk, system-prompt, tailwind]

# Dependency graph
requires: []
provides:
  - "Next.js 16 project scaffold with TypeScript and Tailwind CSS"
  - "Zod schemas (ConceptSchema, ConfidenceCheckSchema, TurnResponseSchema) for Claude structured output"
  - "TypeScript types (Concept, ConfidenceCheck, TurnResponse, Turn, Session) for application state"
  - "buildSystemPrompt function with Socratic teaching rules and concept graph injection"
  - "@anthropic-ai/sdk and zod@3 installed and verified"
affects:
  - 01-foundation-api (plan 02 builds API route using these schemas and prompt)
  - 02-conversation-ui (uses Turn and Session types)
  - 03-concept-map (uses Concept type for graph nodes)
  - 05-session-persistence (uses Session type)

# Tech tracking
tech-stack:
  added: [next.js 16.1.6, react 19.2.3, typescript 5, tailwind 4, @anthropic-ai/sdk 0.74, zod 3.25]
  patterns:
    - "Zod schemas for Claude response validation (not manual JSON parsing)"
    - "System prompt builder function with dynamic concept injection"
    - "App Router with no src/ directory, @/* alias maps to project root"
    - "No Edge Runtime anywhere (Node.js runtime for Vercel Fluid Compute)"

key-files:
  created:
    - lib/types.ts
    - lib/system-prompt.ts
    - app/layout.tsx
    - app/page.tsx
    - app/globals.css
    - .env.local.example
    - package.json
    - tsconfig.json
    - next.config.ts
    - eslint.config.mjs
    - postcss.config.mjs
  modified:
    - .gitignore

key-decisions:
  - "No src/ directory: @/* alias maps to project root for shorter imports"
  - "Zod schemas kept separate from application types (Turn, Session) since schemas serve API validation while app types include additional fields like turnNumber and role"
  - "ConceptRef interface in system-prompt.ts uses minimal {id, label} instead of full Concept type to keep prompt builder decoupled from Zod schemas"

patterns-established:
  - "Structured JSON responses from Claude via Zod schemas (not plain text parsing)"
  - "System prompt as product: prompt builder centralizes all Socratic teaching rules"
  - "No em dashes in any generated content (stylistic constraint enforced in system prompt)"

# Metrics
duration: 4min
completed: 2026-02-15
---

# Phase 1 Plan 1: Project Scaffold and Core Types Summary

**Next.js 16 scaffold with Zod schemas for Claude structured output and Socratic system prompt builder with concept graph injection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-15T02:38:39Z
- **Completed:** 2026-02-15T02:43:07Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments

- Scaffolded Next.js 16 with TypeScript, Tailwind CSS 4, ESLint, and App Router (no src/ directory)
- Defined complete Zod schemas for Claude's structured tutoring responses (concepts, confidence checks, journal entries)
- Built system prompt with Socratic teaching rules, confidence check protocol, and dynamic concept graph state injection
- Installed and verified @anthropic-ai/sdk and zod@3 dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js project and install dependencies** - `d903d91` (chore)
2. **Task 2: Define Zod schemas and TypeScript types** - `19e8a34` (feat)
3. **Task 3: Build the system prompt with concept injection** - `2d3f5df` (feat)

**Plan metadata:** `92a039f` (docs: complete plan)

## Files Created/Modified

- `package.json` - Project config with Next.js 16, React 19, Anthropic SDK, Zod
- `tsconfig.json` - TypeScript config with @/* alias mapping to project root
- `next.config.ts` - Next.js config (minimal, no Edge Runtime)
- `eslint.config.mjs` - ESLint config with Next.js core web vitals and TypeScript rules
- `postcss.config.mjs` - PostCSS config for Tailwind CSS 4
- `app/layout.tsx` - Root layout with Geist fonts and ThreadTutor metadata
- `app/page.tsx` - Minimal placeholder page
- `app/globals.css` - Tailwind CSS import with theme variables
- `app/favicon.ico` - Default favicon
- `lib/types.ts` - Zod schemas (ConceptSchema, ConfidenceCheckSchema, TurnResponseSchema) and TypeScript types (Concept, ConfidenceCheck, TurnResponse, Turn, Session)
- `lib/system-prompt.ts` - buildSystemPrompt function with Socratic teaching rules and concept injection
- `.env.local.example` - Documents ANTHROPIC_API_KEY for local development
- `.gitignore` - Updated with comprehensive ignore patterns
- `public/` - Default SVG assets from scaffold

## Decisions Made

- **No src/ directory:** Plan specified `--src-dir=false` but create-next-app ignored the flag. Manually structured project without src/ to keep import paths shorter (`@/lib/types` instead of `@/src/lib/types`). The `@/*` alias maps to `./*`.
- **ConceptRef minimal interface:** system-prompt.ts defines its own `ConceptRef` with just `{id, label}` instead of importing the full `Concept` type. This keeps the prompt builder decoupled from Zod schemas and makes the dependency direction cleaner.
- **Zod schemas separate from app types:** `ConceptSchema`/`TurnResponseSchema` validate API responses while `Turn`/`Session` are application-level types with additional fields (turnNumber, role). These serve different purposes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app could not scaffold in directory with existing files**
- **Found during:** Task 1 (project initialization)
- **Issue:** `npx create-next-app . --src-dir=false` refused to run in a directory containing existing files (.planning/, CLAUDE.md, etc.)
- **Fix:** Scaffolded in /tmp, then copied relevant files into project. Also manually fixed the src/ directory structure since the flag was ignored.
- **Files modified:** All scaffolded files (package.json, tsconfig.json, etc.)
- **Verification:** `npm run build` succeeds, all paths correct
- **Committed in:** d903d91 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary workaround for create-next-app limitation. No scope change.

## Issues Encountered

- create-next-app v16 ignores `--src-dir=false` when using `yes ""` pipe for non-interactive mode, defaulting to src/ directory. Resolved by manually moving app/ out of src/ and updating tsconfig paths from `./src/*` to `./*`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Types and schemas ready for API route implementation (plan 01-02)
- System prompt builder ready for chat endpoint integration
- No blockers for plan 01-02 (API route and chat endpoint)

---
*Phase: 01-foundation-api*
*Completed: 2026-02-15*
