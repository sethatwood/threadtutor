# Phase 7: Landing Experience - Research

**Researched:** 2026-02-15
**Domain:** React component refactoring, UX flow design, header unification, mode-aware navigation
**Confidence:** HIGH

## Summary

Phase 7 delivers three specific requirements: LAND-01 (clear path from replay to live), LAND-04 (mode indicator in header), and LAND-05 (header with branding, tagline, and topic name). The current codebase already has the core pieces -- ReplayShell has a "Replay" badge and ConversationShell has "ThreadTutor / {topic}" branding. But the two headers are independently implemented with inconsistent features, and the replay-to-live transition path is weak (the "Exit" button returns to TopicPicker, which is a dead end for keyless users rather than a guided conversion path).

The primary work is: (1) extract a shared `AppHeader` component used by both shells, with consistent branding, tagline, topic name, and mode badge, (2) add a "Try it live" CTA within the ReplayShell (most likely in the header or as a prominent banner) that opens an inline API key entry flow without losing context, and (3) ensure the ConversationShell header also shows a "Live" mode indicator for symmetry with the Replay badge. No new libraries are needed. This is a pure UI refactoring and flow enhancement phase.

The codebase is small enough that a shared header component is straightforward. Both `ConversationShell` and `ReplayShell` currently inline their headers as `<header>` elements with similar structure. Extracting a shared `AppHeader` with mode-specific props is clean and avoids future drift.

**Primary recommendation:** Create a shared `AppHeader` component with props for mode ("live" | "replay"), topic name, and action slots (right-side buttons). Add a "Try it live" CTA to ReplayShell (either in the header or as a persistent banner below it) that triggers an inline API key + topic entry flow. Keep the flow within the three-panel view so the user does not lose the visual context of the demo.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component composition, props-driven rendering | Already in project |
| Next.js | 16.1.6 | App Router, page structure | Already in project |
| Tailwind CSS | 4 | Styling for header, badges, CTA buttons | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No new dependencies needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared AppHeader component | Keep separate headers in each shell | Drift between headers, harder to maintain consistency. Shared component is better. |
| Inline "Try it live" in ReplayShell | Separate modal/dialog for API key entry | Modal adds complexity and breaks visual context. Inline panel within the shell is simpler and keeps the demo visible. |
| Mode prop on header ("live" / "replay") | Separate header components per mode | Two components with nearly identical markup. Single component with mode prop is cleaner. |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Current Header State (what exists today)

Both shells have independently implemented `<header>` elements:

**ConversationShell header (lines 103-132):**
```
[ThreadTutor / {topic}]                           [Export] [New topic]
```
- Shows "ThreadTutor" brand and topic name separated by a `/`
- Right side: Export button (conditional on turns.length > 0) and "New topic" button
- No mode indicator
- No tagline

**ReplayShell header (lines 35-58):**
```
[ThreadTutor / {topic}]                           [Replay badge] [Exit]
```
- Shows "ThreadTutor" brand and topic name (same pattern)
- Right side: "Replay" pill badge (indigo text, indigo border) and "Exit" button
- No tagline
- No "Try it live" CTA

### Recommended File Structure
```
components/
  app-header.tsx          # NEW: Shared header with branding, mode badge, topic, action slots
  conversation-shell.tsx  # MODIFIED: Use AppHeader instead of inline header
  replay-shell.tsx        # MODIFIED: Use AppHeader, add "Try it live" CTA
  topic-picker.tsx        # MODIFIED: Accept onTryLive callback from ReplayShell flow
```

### Pattern 1: Shared AppHeader Component
**What:** A single `AppHeader` component that renders the header for both live and replay modes. Accepts `mode`, `topic`, an optional `tagline`, and children/action slot for right-side buttons.
**When to use:** Any time a header is needed in a shell component.

```typescript
// Source: Codebase analysis of existing headers in conversation-shell.tsx and replay-shell.tsx
interface AppHeaderProps {
  topic: string;
  mode: "live" | "replay";
  children?: React.ReactNode; // Right-side action slot
}

export function AppHeader({ topic, mode, children }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-zinc-100">
          ThreadTutor
        </span>
        <span className="text-zinc-600">/</span>
        <span className="text-sm text-zinc-400">{topic}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Mode badge */}
        <span className={`text-xs border rounded-full px-2.5 py-0.5 ${
          mode === "replay"
            ? "text-indigo-400 border-indigo-500/30"
            : "text-emerald-400 border-emerald-500/30"
        }`}>
          {mode === "replay" ? "Replay" : "Live"}
        </span>

        {/* Action slot (Export, New topic, Try it live, Exit, etc.) */}
        {children}
      </div>
    </header>
  );
}
```

### Pattern 2: "Try it Live" CTA in Replay Mode
**What:** A prominent call-to-action visible during replay that guides users to start their own live session. Two viable placements: (a) a button in the header right-side action area, or (b) a persistent banner below the header.
**When to use:** Whenever ReplayShell is displayed.

**Option A: Header button (recommended for simplicity)**
```typescript
// In ReplayShell, passed as children to AppHeader
<AppHeader topic={session.topic} mode="replay">
  <button onClick={onTryLive} className="...indigo CTA styles...">
    Try it live
  </button>
  <button onClick={onBack} className="...subtle exit styles...">
    Exit
  </button>
</AppHeader>
```

**Option B: Banner below header (more prominent, more complex)**
```typescript
<AppHeader topic={session.topic} mode="replay">
  <button onClick={onBack}>Exit</button>
</AppHeader>
<div className="border-b border-zinc-800 bg-indigo-500/5 px-6 py-2 text-center">
  <span className="text-sm text-zinc-400">Like what you see? </span>
  <button onClick={onTryLive} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
    Try it live with your own topic
  </button>
</div>
```

**Recommendation:** Option A (header button) for Phase 7. It is simpler, consistent with the existing header action pattern, and avoids adding vertical space that reduces the three-panel area. A prominent indigo-styled button in the header right side will be sufficiently visible next to the "Replay" badge.

### Pattern 3: "Try it Live" Flow (Replay to Live Transition)
**What:** When a user clicks "Try it live" from ReplayShell, they need to enter an API key (if they don't have one) and a topic. The existing TopicPicker already handles both of these. The simplest approach is to exit replay and show the TopicPicker.
**When to use:** When user clicks "Try it live" CTA.

**Current flow (what exists):**
```
ReplayShell [Exit] -> setDemoSession(null) -> TopicPicker form
```

**Proposed flow (enhanced):**
```
ReplayShell [Try it live] -> setDemoSession(null) -> TopicPicker form (same as Exit, but semantically different)
```

The flow is technically identical to "Exit" in the current implementation. The difference is UX semantics: the button label "Try it live" is a positive CTA, whereas "Exit" is a neutral escape. Both lead to the TopicPicker form where users can enter a topic and API key. The TopicPicker form already has all the needed UI (topic input, example chips, API key entry, past sessions list). No new flow logic is needed.

**Important consideration:** The "Try it live" button does not need a separate flow from "Exit." Both return to the TopicPicker. The value is in the labeling and visual prominence, not in routing logic. Avoid overengineering a special "try it live" modal when the TopicPicker already does the job.

### Pattern 4: Tagline in Header
**What:** LAND-05 requires the header to display a tagline. The current TopicPicker shows "Socratic learning with AI" as a subtitle, but neither shell header shows it.
**When to use:** In the AppHeader component, displayed below the "ThreadTutor" brand name or inline.

**Options for tagline placement:**
- (a) Below the brand name in a second line (takes more vertical space)
- (b) After the brand name, before the topic separator (clutters the horizontal flow)
- (c) Only on the TopicPicker landing page, not in the shell headers (current behavior, but doesn't satisfy LAND-05)

**Recommendation:** Option (a), subtle second line. The tagline should be visually subordinate (smaller, muted color) so it doesn't compete with the topic name. On desktop this works well. On mobile (Phase 8) it can be hidden.

```typescript
<div className="flex flex-col">
  <span className="text-base font-semibold text-zinc-100">ThreadTutor</span>
  <span className="text-xs text-zinc-500">Socratic learning with AI</span>
</div>
```

### Anti-Patterns to Avoid
- **Duplicating header code across shells:** Currently both shells have inline `<header>` blocks. Extract to shared component. Future changes (adding a settings button, changing branding) should be single-point edits.
- **Building a modal for "Try it live":** The TopicPicker already handles topic input and API key entry. Don't build a modal overlay in the ReplayShell when returning to TopicPicker works.
- **Overcomplicating mode state:** Mode is implicit in which shell is rendered. ConversationShell = "live", ReplayShell = "replay". Don't add global state for mode. Pass it as a prop to AppHeader.
- **Hiding the mode indicator:** The mode badge should always be visible. Don't make it conditional on some state. If the user is in replay, show "Replay". If in live, show "Live". Always.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode badge styling | Custom badge component | Tailwind utility classes on a `<span>` | Existing ReplayShell already uses this pattern. A dedicated Badge component is overkill for two variants. |
| API key entry flow | New modal/dialog from scratch | Existing TopicPicker form | TopicPicker already handles topic input, example chips, API key entry, localStorage persistence, and past sessions list. |
| Header layout | Custom flexbox from scratch | Copy existing header pattern from ConversationShell/ReplayShell | The current pattern (flex justify-between, border-b, px-6 py-3) is already established and consistent. |

**Key insight:** Phase 7 is primarily a refactoring and UX enhancement phase, not a new feature build. The existing components already contain all the needed UI patterns. The work is extracting them into shared components, adding the mode badge to ConversationShell, adding "Try it live" CTA to ReplayShell, and adding the tagline.

## Common Pitfalls

### Pitfall 1: Header Height Inconsistency Between Modes
**What goes wrong:** If the tagline is present in one mode but not the other, the header height changes when switching modes, causing a jarring layout shift.
**Why it happens:** Adding a tagline as a second line increases the header's natural height.
**How to avoid:** Either always show the tagline in both modes (recommended), or ensure both modes have the same header height via min-height or consistent content.
**Warning signs:** The three-panel area jumps when transitioning between replay and live mode.

### Pitfall 2: "Try it Live" Button Lost Among Other Actions
**What goes wrong:** The CTA blends in with the other header buttons ("Exit", "Export", "New topic") and users don't notice it.
**Why it happens:** All header buttons currently use the same subtle text-zinc-400 style.
**How to avoid:** Style the "Try it live" button with the primary indigo-600 filled style (matching the "Start learning" button in TopicPicker) to make it visually distinct from the subtle action buttons.
**Warning signs:** Users click "Exit" instead of "Try it live" because they look the same.

### Pitfall 3: Losing Replay Position When Going to "Try it Live"
**What goes wrong:** User clicks "Try it live," fills in API key and topic, but then wants to go back to the demo. They have to start over from the beginning.
**Why it happens:** The current `onBack` from ReplayShell sets `demoSession` to `null`, discarding it. Re-fetching it starts the replay from turn 0.
**How to avoid:** This is acceptable behavior for Phase 7. The user is making a deliberate choice to switch modes. Starting the demo over from turn 0 is fine because the demo is short (16 turns). Don't add complexity to preserve replay state across mode switches.
**Warning signs:** Not a real problem for this phase. Flag for future enhancement if needed.

### Pitfall 4: Missing "Live" Badge in ConversationShell
**What goes wrong:** The "Replay" badge exists but no "Live" badge is added to ConversationShell, so LAND-04 is only half satisfied.
**Why it happens:** Easy to forget because the requirement says "mode indicator" and the Replay badge already exists.
**How to avoid:** The shared AppHeader component receives a `mode` prop and always renders a badge. Both shells pass their mode. This ensures both modes have visible indicators.
**Warning signs:** No badge visible when in live mode.

### Pitfall 5: Tagline on the TopicPicker vs. Shell Headers
**What goes wrong:** The tagline currently exists only on the TopicPicker landing page ("Socratic learning with AI"). Adding it to the shell headers might feel redundant when the TopicPicker also has it.
**Why it happens:** The TopicPicker is a separate rendering path from the shells.
**How to avoid:** The TopicPicker landing page and shell headers serve different contexts. The TopicPicker's tagline is part of a centered hero-style layout. The AppHeader's tagline is a subtle brand element in a compact toolbar. Both are appropriate and not redundant.
**Warning signs:** The tagline feels oversized or prominent in the compact header bar.

## Code Examples

Verified patterns from the existing codebase:

### Existing Replay Badge (to be absorbed into AppHeader)
```typescript
// Source: components/replay-shell.tsx lines 45-47
<span className="text-xs text-indigo-400 border border-indigo-500/30 rounded-full px-2.5 py-0.5">
  Replay
</span>
```

### Existing Header Pattern (to be extracted into AppHeader)
```typescript
// Source: components/conversation-shell.tsx lines 103-132
<header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
  <div className="flex items-center gap-3">
    <span className="text-base font-semibold text-zinc-100">
      ThreadTutor
    </span>
    <span className="text-zinc-600">/</span>
    <span className="text-sm text-zinc-400">{topic}</span>
  </div>

  <div className="flex items-center gap-2">
    {/* action buttons */}
  </div>
</header>
```

### Existing CTA Button Style (for "Try it live")
```typescript
// Source: components/topic-picker.tsx lines 211-221
// The "Start learning" button uses this filled indigo style:
<button
  type="button"
  className="... rounded-lg bg-indigo-600 px-4 py-3 text-base font-medium text-white
             hover:bg-indigo-500 ..."
>
  Start learning
</button>

// For the header, scale down to match header button sizing:
// rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500
```

### TopicPicker Render Priority Chain (unchanged)
```typescript
// Source: components/topic-picker.tsx -- render flow (simplified)
// This chain is already correct and does not need modification:
if (loadedSession) return <ConversationShell ... />;
if (started) return <ConversationShell ... />;
if (demoSession && !started && !loadedSession) return <ReplayShell ... />;
if (!apiKeyLoaded) return null;
if (demoLoading && !apiKey) return <LoadingState />;
return <TopicPickerForm />;
```

### Shared AppHeader (target implementation)
```typescript
// Target: components/app-header.tsx
interface AppHeaderProps {
  topic: string;
  mode: "live" | "replay";
  children?: React.ReactNode;
}

export function AppHeader({ topic, mode, children }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-zinc-100">
            ThreadTutor
          </span>
          <span className="text-xs text-zinc-500">
            Socratic learning with AI
          </span>
        </div>
        <span className="text-zinc-600">/</span>
        <span className="text-sm text-zinc-400">{topic}</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`text-xs border rounded-full px-2.5 py-0.5 ${
            mode === "replay"
              ? "text-indigo-400 border-indigo-500/30"
              : "text-emerald-400 border-emerald-500/30"
          }`}
        >
          {mode === "replay" ? "Replay" : "Live"}
        </span>
        {children}
      </div>
    </header>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline headers in each shell | Shared AppHeader component | This phase | Single point of edit for branding, badge, tagline |
| "Exit" as only replay escape path | "Try it live" CTA + "Exit" | This phase | Guided conversion funnel from replay to live mode |
| No mode indicator in live mode | Mode badge in both modes | This phase | Users always know which mode they are in |

**Deprecated/outdated:**
- None. This phase builds on stable React patterns.

## Open Questions

1. **Tagline Content**
   - What we know: The TopicPicker currently shows "Socratic learning with AI" as the tagline. This aligns with the metadata description in layout.tsx ("AI-assisted Socratic learning with visual concept maps").
   - What's unclear: Whether the header tagline should match exactly or be a shorter variant.
   - Recommendation: Use "Socratic learning with AI" (the existing text from TopicPicker) for consistency. It is already concise.

2. **"Try it Live" Button Placement: Header vs Banner**
   - What we know: Both options work. Header placement is simpler and consistent with existing patterns. Banner placement is more prominent but takes vertical space.
   - What's unclear: Which better serves conversion without feeling pushy.
   - Recommendation: Header button. It is clean, visible, and does not reduce the three-panel area. The indigo-600 fill style will make it stand out from the subtle action buttons.

3. **Live Mode Badge Color**
   - What we know: Replay uses indigo-400 text with indigo-500/30 border (matches the app's accent color). Live mode needs a visually distinct color.
   - What's unclear: Whether to use emerald/green (common for "active/live" semantics) or a different color.
   - Recommendation: Emerald/green for Live badge. Green universally signals "active" or "live." Indigo for Replay (already established) + Emerald for Live creates clear visual differentiation.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of `components/conversation-shell.tsx` lines 103-132 -- Current ConversationShell header implementation
- Codebase analysis of `components/replay-shell.tsx` lines 35-58 -- Current ReplayShell header implementation with Replay badge
- Codebase analysis of `components/topic-picker.tsx` lines 164-284 -- TopicPicker form with branding, tagline, API key entry
- `.planning/REQUIREMENTS.md` lines 59-63 -- LAND-01, LAND-04, LAND-05 requirement definitions
- `.planning/ROADMAP.md` lines 117-125 -- Phase 7 success criteria

### Secondary (MEDIUM confidence)
- `.planning/phases/06-replay-mode/06-02-SUMMARY.md` -- Confirmed render priority chain and "Watch demo" button patterns
- `.planning/phases/02-app-shell-live-conversation/02-03-SUMMARY.md` -- Original three-panel shell and header decisions

### Tertiary (LOW confidence)
- None. All findings are verified against the codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries. Pure refactoring with existing tools.
- Architecture: HIGH -- All patterns derived from reading the current codebase. The shared header extraction is straightforward React composition.
- Pitfalls: HIGH -- Identified from direct analysis of the two shell headers and the TopicPicker flow.

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable patterns, no external dependencies changing)
