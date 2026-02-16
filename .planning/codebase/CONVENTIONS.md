# Coding Conventions

**Analysis Date:** 2026-02-15

## Naming Patterns

**Files:**
- TypeScript source files: kebab-case (e.g., `use-conversation.ts`, `graph-layout.ts`, `session-storage.ts`)
- React components: kebab-case (e.g., `concept-map.tsx`, `confidence-check.tsx`, `topic-picker.tsx`)
- API routes: `route.ts` (Next.js convention)
- Config files: kebab-case with extension (e.g., `eslint.config.mjs`, `next.config.ts`)

**Functions:**
- camelCase for all functions (e.g., `buildSystemPrompt`, `collectAllConcepts`, `saveSession`)
- React hooks: `use` prefix + camelCase (e.g., `useConversation`, `useReplayState`, `useInterval`)
- React components: PascalCase (e.g., `ConceptMap`, `Message`, `ConfidenceCheckCard`)
- Event handlers: `handle` prefix + action (e.g., `handleChange`, `handleSubmit`, `handleKeyDown`)

**Variables:**
- camelCase for all variables (e.g., `turnNumber`, `latestTurnNumber`, `existingConcepts`)
- Constants (module-level): SCREAMING_SNAKE_CASE (e.g., `NODE_WIDTH`, `NODE_HEIGHT`, `INLINE_ZOOM`, `TOPIC_POOL`)
- Private constants (string keys): camelCase with descriptive prefix (e.g., `STORAGE_KEY = "threadtutor:apiKey"`, `SESSION_PREFIX = "threadtutor:session:"`)

**Types:**
- Interfaces and types: PascalCase (e.g., `Turn`, `Session`, `Concept`, `ConceptNodeData`)
- Zod schemas: PascalCase + `Schema` suffix (e.g., `ConceptSchema`, `TurnResponseSchema`, `ConfidenceCheckSchema`)
- Type inference from Zod: `type Concept = z.infer<typeof ConceptSchema>`

## Code Style

**Formatting:**
- No dedicated formatter config detected (.prettierrc not present)
- Indentation: 2 spaces (observed consistently)
- Semicolons: Always used
- Quotes: Double quotes for strings, single quotes only in JSX attributes when needed
- Line length: Generally under 100 characters for code, allows longer for JSX

**Linting:**
- ESLint 9 with Next.js config (`eslint.config.mjs`)
- Uses Next.js vitals + TypeScript rules from `eslint-config-next`
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**TypeScript:**
- Strict mode enabled (`tsconfig.json`: `"strict": true`)
- Explicit return types omitted for most functions (relies on inference)
- `satisfies` operator used for type narrowing (e.g., `data: { ... } satisfies ConceptNodeData`)
- `type` imports for interfaces (e.g., `import type { Turn } from "@/lib/types"`)
- Unknown error types caught explicitly: `catch (error: unknown)` then narrowed with `instanceof`

## Import Organization

**Order:**
1. External packages (Next.js, React, third-party)
2. CSS imports (e.g., `@xyflow/react/dist/style.css`)
3. Internal components (prefixed with `@/components/`)
4. Internal lib utilities (prefixed with `@/lib/`)
5. Type imports (using `import type`)

**Example from `components/concept-map.tsx`:**
```typescript
import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { ReactFlow, /* ... */ } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ConceptNode } from "@/components/concept-node";
import { collectAllConcepts, buildGraphElements, /* ... */ } from "@/lib/graph-layout";
import type { Turn } from "@/lib/types";
```

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- All internal imports use `@/` prefix for consistency

## Error Handling

**Patterns:**
- API routes: Early validation with explicit error returns (HTTP status + JSON message)
  ```typescript
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing or empty 'messages' field." }, { status: 400 });
  }
  ```
- Try/catch with typed errors: `catch (error: unknown)` then narrow with `instanceof`
  ```typescript
  try {
    // API call
  } catch (error: unknown) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }
    // Fallback generic error
  }
  ```
- Client-side storage: Catch and warn (non-blocking)
  ```typescript
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("[session-storage] Failed to save:", err);
  }
  ```
- State management: Errors stored in state, cleared via action (no throw to UI)

**Error messages:**
- User-facing: Descriptive strings in JSON response or UI state
- Developer-facing: `console.error` or `console.warn` with context prefix (e.g., `[session-storage]`)

## Logging

**Framework:** Built-in `console` methods

**Patterns:**
- Production: Minimal logging (only errors/warnings)
- Error logging: `console.error("Chat API error:", message)` in API routes
- Warning logging: `console.warn("[session-storage] Failed to save...")` for non-critical failures
- No debug/info logging observed in production code
- Context prefixes used in warnings: `[session-storage]`, `[api-key]` (implied pattern)

## Comments

**When to Comment:**
- File-level: Purpose and key design decisions (JSDoc style)
- Function-level: JSDoc comments for public APIs and complex functions
  ```typescript
  /**
   * Builds the system prompt for Claude's Socratic tutoring mode.
   *
   * @param topic - The subject being taught
   * @param existingConcepts - Concepts already in the graph
   * @returns Complete system prompt string
   */
  ```
- Section dividers: Banner comments to separate logical sections
  ```typescript
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  ```
- Inline: Explain non-obvious logic or defensive patterns
  ```typescript
  // Belt-and-suspenders: the system prompt prohibits em dashes, but Claude may produce them anyway.
  ```
- Implementation notes: Call out architectural constraints or edge cases
  ```typescript
  // Fresh graph each call -- anti-pattern to reuse across renders
  ```

**JSDoc/TSDoc:**
- Used for public API functions in `lib/` modules
- Documents parameters with `@param` and return values with `@returns`
- Type information omitted (TypeScript provides it)

## Function Design

**Size:**
- Small, focused functions (typically under 50 lines)
- Complex UI components broken into inner components (e.g., `InlineMapInner`, `FullscreenMapInner` in `concept-map.tsx`)
- Long functions only for API routes with extensive validation/error handling

**Parameters:**
- Prefer object parameters for 3+ arguments
- Type all parameters explicitly
- Use destructuring for object params

**Return Values:**
- Explicit return type annotations omitted (relies on inference)
- Complex return types extracted as named types or interfaces
- Void functions for side effects (e.g., `saveSession(session: Session): void`)
- Async functions return `Promise<T>` (inferred)

## Module Design

**Exports:**
- Named exports only (no default exports except Next.js conventions like `layout.tsx`, `page.tsx`)
- Export functions/types at declaration point: `export function foo() { ... }`
- Group related exports in single file (e.g., `lib/session-storage.ts` exports save/load/list/delete)

**Barrel Files:**
- Not used (each component/util imported directly)
- Example: `import { ConceptMap } from "@/components/concept-map"` (not from `@/components`)

## React Patterns

**Component Structure:**
- "use client" directive at top of file for client components
- Interfaces defined inline before component
- Component body uses hooks, then handlers, then render
- Sub-components defined after main component or in separate inner functions

**Hooks:**
- Custom hooks in `lib/use-*.ts` files
- Use `useCallback` for handlers passed as props
- Use `useMemo` for derived data
- Refs for DOM access and stable references: `const stateRef = useRef(state); useEffect(() => { stateRef.current = state }, [state])`

**State Management:**
- `useReducer` for complex state (e.g., `useConversation`)
- Action types defined as discriminated unions
- State updates immutable (spread operators)

**Props:**
- Inline interfaces for component props (not exported)
- Destructure props in function signature
- Optional props marked with `?`

## Special Conventions

**Em dash prohibition:**
- Project-wide rule: No em dashes (U+2014) or en dashes (U+2013)
- Enforced in system prompt and sanitized in API responses
- Use commas, semicolons, colons, or parentheses instead
- Sanitization function in `app/api/chat/route.ts` converts dashes to hyphens

**Type safety:**
- Use `satisfies` for narrowing object literals: `data: { ... } satisfies ConceptNodeData`
- Use discriminated unions for action types: `type Action = { type: "FOO" } | { type: "BAR", payload: X }`
- Prefer `unknown` over `any` for error handling

**Constants:**
- Magic numbers extracted to named constants: `const NODE_WIDTH = 240;`
- Reusable string literals centralized: `const STORAGE_KEY = "threadtutor:apiKey";`

---

*Convention analysis: 2026-02-15*
