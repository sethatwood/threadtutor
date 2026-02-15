# Phase 4: Learning Journal - Research

**Researched:** 2026-02-15
**Domain:** React UI component consuming existing structured data (journalEntry from Turn type)
**Confidence:** HIGH

## Summary

This phase replaces the `JournalPlaceholder` component with a `LearningJournal` component that displays a running list of one-sentence summaries, one per assistant turn. The data pipeline is already complete: Claude returns a `journalEntry: string | null` in every assistant turn (enforced by the system prompt and Zod schema), the `useConversation` hook stores it in `Turn` objects, and `ConversationShell` already has access to `state.turns` (lifted in Phase 3). The work is purely presentational: extract journal entries from turns, render them as a scrollable list, and ensure new entries appear progressively.

No new dependencies are required. The component follows the exact same integration pattern established by the ConceptMap in Phase 3: receive `turns: Turn[]` as a prop from `ConversationShell`, derive display data via filtering, and render. The `JournalPlaceholder` import in `ConversationShell` is swapped for the new `LearningJournal` component.

**Primary recommendation:** Create a single `LearningJournal` component that receives `turns` as a prop, filters for assistant turns with non-null `journalEntry`, renders each as a numbered list item with auto-scroll on new entries, and uses the project's existing dark theme styling (zinc palette, indigo accents). No new libraries, hooks, or utilities needed.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component rendering, useMemo for filtering | Already installed; component is pure React |
| Tailwind CSS | 4.x | Styling (zinc/indigo palette, dark theme) | Already the project's styling system |

### Supporting
No additional libraries needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain list rendering | Virtualized list (react-window) | Unnecessary; journal entries are one sentence each, max ~20 over a session. DOM overhead is negligible. |
| CSS animations for entry | Framer Motion | Overkill for a simple fade-in on list items; CSS keyframes match the pattern used by concept nodes |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Data Flow: Turns to Journal Entries

The journal entry data already exists in every `Turn` object:

```
useConversation (hook)
  -> state.turns: Turn[]
    -> ConversationShell (owns state)
      -> LearningJournal (receives turns prop)
```

Each `Turn` has:
```typescript
interface Turn {
  turnNumber: number;
  role: "assistant" | "user";
  displayText: string;
  concepts: Concept[];
  confidenceCheck: ConfidenceCheck | null;
  journalEntry: string | null;  // <-- THIS IS THE DATA SOURCE
}
```

Key facts about `journalEntry`:
- The system prompt instructs Claude: "Every response must include a journalEntry (one sentence summarizing what was covered)."
- The Zod schema defines it as `z.string().nullable()` -- it can be null but structured outputs enforce the field exists.
- User turns always have `journalEntry: null` (set in the reducer's `ADD_USER_TURN` action).
- Only assistant turns contain journal entries.

### Integration Point: ConversationShell

The integration is a direct mirror of how ConceptMap was connected in Phase 3:

```typescript
// Current state in conversation-shell.tsx (after Phase 3):
<div className="w-1/4 border-l border-zinc-800">
  <JournalPlaceholder />
</div>

// After Phase 4:
<div className="w-1/4 border-l border-zinc-800">
  <LearningJournal turns={state.turns} />
</div>
```

No state lifting needed -- Phase 3 already lifted `useConversation` into `ConversationShell`.

### Recommended Component Structure

```
components/
  learning-journal.tsx    # New: replaces journal-placeholder.tsx
  journal-placeholder.tsx # Deleted after replacement
```

### Pattern: Derive Journal Entries from Turns

```typescript
// Filter and map in useMemo (same pattern as collectAllConcepts in graph-layout.ts)
const entries = useMemo(() => {
  return turns
    .filter((t): t is Turn & { journalEntry: string } =>
      t.role === "assistant" && t.journalEntry !== null
    )
    .map((t, index) => ({
      number: index + 1,
      text: t.journalEntry,
      turnNumber: t.turnNumber,
    }));
}, [turns]);
```

### Pattern: Auto-Scroll on New Entries

Same pattern as ConversationPanel's scroll sentinel:

```typescript
const scrollRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  scrollRef.current?.scrollIntoView({ behavior: "smooth" });
}, [entries.length]);
```

### Pattern: Inline Prop Type (from prior decision [03-02])

Per the decision in Phase 3 Plan 02, ConversationPanel receives state as an inline type rather than importing a separate interface. The LearningJournal component should follow the same pattern for consistency, though since it only needs `turns`, a simple named interface is cleaner:

```typescript
interface LearningJournalProps {
  turns: Turn[];
}
```

### Anti-Patterns to Avoid

- **Duplicating journal entries in separate state:** The journal is a pure derivation of `turns`. Never store journal entries in a separate state slice or context. Use `useMemo` to derive from the single source of truth.
- **Filtering on every render without memoization:** While the list is small, use `useMemo` keyed on `turns` for consistency with the project's existing patterns (ConceptMap does the same).
- **Rendering user turns in the journal:** User turns have `journalEntry: null`. The filter must check both `role === "assistant"` and `journalEntry !== null`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entry numbering | Manual counter tracking state | Array index + 1 from filtered list | Derived value, not state; no off-by-one risk |
| Scroll behavior | IntersectionObserver or manual scroll math | `scrollIntoView({ behavior: "smooth" })` on a sentinel div | Same pattern already working in ConversationPanel |

**Key insight:** This component is a pure presentational derivation. Every piece of data it needs already flows through `state.turns`. The only work is filtering and rendering.

## Common Pitfalls

### Pitfall 1: journalEntry is null on some assistant turns
**What goes wrong:** Component renders "null" as text or crashes on `.length` of null.
**Why it happens:** While the system prompt says "every response must include a journalEntry," the Zod schema allows `null`. Edge cases (errors, unusual responses) might produce null.
**How to avoid:** Always filter with `t.journalEntry !== null` before rendering. Use TypeScript type narrowing.
**Warning signs:** "null" appearing as text in the journal list.

### Pitfall 2: Empty state not handled
**What goes wrong:** Right panel shows nothing (blank white/dark space) before first assistant response.
**Why it happens:** No journal entries exist until the first assistant turn arrives.
**How to avoid:** Show a muted empty state message (matching the ConceptMap's pattern: "Your learning journal will appear here").
**Warning signs:** Blank right panel before first response.

### Pitfall 3: Scroll container not properly constrained
**What goes wrong:** Journal list pushes the entire page layout instead of scrolling within its panel.
**Why it happens:** Missing `overflow-y-auto` or `h-full` on the journal container. The parent `div.w-1/4` in ConversationShell provides width but the child must fill height.
**How to avoid:** Use `h-full overflow-y-auto` on the journal's outermost div, matching the ConversationPanel's scroll pattern.
**Warning signs:** Page grows vertically instead of journal scrolling internally.

### Pitfall 4: Animation fights with scroll
**What goes wrong:** New entry animates in but is below the fold, or scroll jumps awkwardly.
**Why it happens:** CSS animation and `scrollIntoView` competing for timing.
**How to avoid:** Use the same pattern as concept nodes: CSS-only animation (opacity/translate), with scroll triggered in the same render cycle via useEffect. The animation is visual polish; scroll is the functional behavior.
**Warning signs:** Entry appears jumpy or invisible briefly.

## Code Examples

### Complete LearningJournal Component (Verified Pattern)

```typescript
// components/learning-journal.tsx
"use client";

import { useMemo, useRef, useEffect } from "react";
import type { Turn } from "@/lib/types";

interface LearningJournalProps {
  turns: Turn[];
}

export function LearningJournal({ turns }: LearningJournalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => {
    return turns
      .filter(
        (t): t is Turn & { journalEntry: string } =>
          t.role === "assistant" && t.journalEntry !== null
      )
      .map((t, index) => ({
        number: index + 1,
        text: t.journalEntry,
        turnNumber: t.turnNumber,
      }));
  }, [turns]);

  // Auto-scroll to newest entry
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-zinc-600">
          Your learning journal will appear here
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-300">
          Learning Journal
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.turnNumber}
              className="journal-entry text-sm text-zinc-400"
            >
              <span className="mr-2 text-xs font-medium text-indigo-400/60">
                {entry.number}.
              </span>
              {entry.text}
            </li>
          ))}
        </ol>
        {/* Scroll sentinel */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
```

### CSS for Entry Animation (Optional, in globals.css)

```css
/* Journal entry fade-in */
.journal-entry {
  animation: journal-enter 300ms ease-out;
}

@keyframes journal-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Integration in ConversationShell

```typescript
// In conversation-shell.tsx, the only change:
// 1. Replace import
import { LearningJournal } from "@/components/learning-journal";
// (remove JournalPlaceholder import)

// 2. Replace usage in JSX
<div className="w-1/4 border-l border-zinc-800">
  <LearningJournal turns={state.turns} />
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | N/A | N/A | This is a new component with no migration path |

This phase involves no library changes or API migrations. It is purely additive UI work on existing data structures.

**Deprecated/outdated:**
- Nothing relevant. The component uses standard React patterns.

## Open Questions

1. **Should journal entries be clickable (scroll to conversation turn)?**
   - What we know: The concept map has click-to-scroll via `onConceptClick`. The journal entries have `turnNumber` available.
   - What's unclear: Whether this is in scope for JOUR-01/JOUR-02 (requirements only mention "displays running list" and "grows progressively").
   - Recommendation: Do NOT add click-to-scroll in this phase. The requirements are explicitly about display and progressive growth. Click-to-scroll can be added later as a refinement. Keep the component simple.

2. **Should the panel header be sticky?**
   - What we know: The ConversationPanel does not have a sticky header. The ConceptMap has no header (the React Flow canvas fills the panel).
   - What's unclear: Whether a "Learning Journal" header is needed at all.
   - Recommendation: Add a small header ("Learning Journal") with `border-b border-zinc-800` to match the app's header/divider pattern. It naturally stays at the top since it is outside the scrollable region (flex-col layout with header outside overflow area).

3. **Should there be a visual indicator for the newest entry?**
   - What we know: The concept map highlights the newest nodes with a subtle glow. Requirements JOUR-01 and JOUR-02 do not mention highlighting.
   - What's unclear: Whether consistency with the concept map demands similar treatment.
   - Recommendation: Skip highlighting for Phase 4. The entry's animation on appearance provides sufficient visual feedback. This can be added in Phase 8 (design polish) if desired.

## Sources

### Primary (HIGH confidence)
- Existing codebase files (direct inspection):
  - `lib/types.ts` - Turn interface with `journalEntry: string | null`
  - `lib/use-conversation.ts` - Reducer sets journalEntry from TurnResponse
  - `lib/system-prompt.ts` - "Every response must include a journalEntry" instruction
  - `components/conversation-shell.tsx` - State already lifted, JournalPlaceholder import location
  - `components/journal-placeholder.tsx` - Current placeholder to replace
  - `components/concept-map.tsx` - Reference pattern for turns-consuming component
  - `app/globals.css` - Existing animation patterns (concept-enter, journal-enter can follow)

### Secondary (MEDIUM confidence)
- Phase 3 research and plans (`.planning/phases/03-concept-map/`) - Verified state lifting pattern and integration approach

### Tertiary (LOW confidence)
- None. All findings are based on direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; uses existing React + Tailwind
- Architecture: HIGH - Follows exact pattern established by ConceptMap integration in Phase 3; data flow verified by reading all relevant source files
- Pitfalls: HIGH - Pitfalls identified by direct code analysis (nullable journalEntry, scroll container constraints) rather than external research

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (no external dependencies to go stale)
