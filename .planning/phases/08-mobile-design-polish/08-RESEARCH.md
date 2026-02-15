# Phase 8: Mobile & Design Polish - Research

**Researched:** 2026-02-15
**Domain:** Responsive mobile layout, design system polish, em dash enforcement
**Confidence:** HIGH

## Summary

Phase 8 converts a desktop-only three-panel layout into a responsive mobile experience and polishes the visual design to meet a "Notion-like" educational aesthetic. The existing codebase has **zero responsive breakpoint classes** -- every layout component uses fixed `w-1/4` / `w-1/2` splits with `flex` on the outer container. The mobile work is therefore additive (layering responsive classes on top of existing markup) rather than a rewrite.

The design polish work focuses on three areas: (1) fixing the font stack (Geist fonts are loaded but overridden by a hardcoded `font-family: Arial` on `body`), (2) improving spacing and whitespace for a clean educational feel, and (3) enforcing the no-em-dash constraint across all sources (static code, system prompt, and runtime Claude output). The system prompt already prohibits em dashes, and a grep of all source files and data files confirms zero em dashes exist in the codebase today.

**Primary recommendation:** Use Tailwind CSS 4's mobile-first breakpoint system (`md:` for desktop, unprefixed for mobile) to convert the three-panel layout to a stacked mobile layout. Use the native HTML `<details>`/`<summary>` element for the collapsible journal on mobile (zero dependencies, accessible by default, styleable with Tailwind's `open:` modifier).

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.1.18 | Responsive utilities, design tokens | Already in use; mobile-first breakpoints are built in |
| @tailwindcss/typography | 0.5.19 | Prose styling for markdown content | Already in use; `prose-invert` for dark mode |
| @xyflow/react | 12.10.0 | Concept map visualization | Already in use; has built-in touch/pinch support |
| Next.js | 16.1.6 | Framework | Auto-generates viewport meta tag |

### Supporting (no new dependencies needed)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| HTML `<details>`/`<summary>` | Collapsible journal panel on mobile | Native element, no JS needed for toggle |
| Tailwind `open:` modifier | Style details element open/closed states | Pair with `<details>` for animated accordion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<details>`/`<summary>` | Headless UI Disclosure | Adds dependency for something HTML does natively |
| Custom responsive hook | CSS-only responsive | JS-based approach adds complexity; Tailwind breakpoints suffice |
| CSS Grid | Flexbox (current) | Grid would be cleaner for the three-panel layout but flex is already working; not worth rewriting |

**Installation:** No new packages needed. Zero new dependencies.

## Architecture Patterns

### Current Layout Structure (desktop-only)
```
ConversationShell / ReplayShell
├── AppHeader                          (full width)
└── div.flex.flex-1.overflow-hidden    (three-panel row)
    ├── div.w-1/4   ConceptMap         (left)
    ├── div.w-1/2   ConversationPanel  (center)
    └── div.w-1/4   LearningJournal    (right)
```

### Target Layout Structure (responsive)
```
Mobile (< md / < 768px):
ConversationShell / ReplayShell
├── AppHeader                          (full width, compact)
└── div.flex.flex-col                  (stacked column)
    ├── ConversationPanel              (top, takes available height)
    ├── ConceptMap                     (below, fixed height ~250-300px)
    └── LearningJournal               (collapsible via <details>)

Desktop (>= md / >= 768px):
Same as current three-panel side-by-side layout
```

### Pattern 1: Mobile-First Responsive Shell
**What:** Convert the flex container from always-horizontal to column-on-mobile, row-on-desktop
**When to use:** Both ConversationShell and ReplayShell (they share identical layout structure)
**Example:**
```tsx
// Source: Tailwind CSS 4 responsive design docs
// Mobile: stacked column. Desktop: side-by-side row.
<div className="flex flex-1 flex-col overflow-hidden md:flex-row">
  {/* Concept Map: hidden on mobile by default, shown below conversation */}
  <div className="order-2 h-[250px] border-t border-zinc-800 md:order-first md:h-auto md:w-1/4 md:border-r md:border-t-0">
    <ConceptMap turns={turns} onConceptClick={handleConceptClick} />
  </div>

  {/* Conversation: always first on mobile */}
  <div className="order-1 flex min-h-0 flex-1 flex-col md:order-2 md:w-1/2">
    <ConversationPanel ... />
  </div>

  {/* Journal: collapsible on mobile */}
  <div className="order-3 border-t border-zinc-800 md:w-1/4 md:border-l md:border-t-0">
    <LearningJournal turns={turns} />
  </div>
</div>
```

### Pattern 2: Collapsible Journal with `<details>`
**What:** Wrap LearningJournal in a `<details>` element on mobile, full panel on desktop
**When to use:** Mobile viewport only (journal is the least critical panel for mobile UX)
**Example:**
```tsx
// Source: Tailwind CSS open: modifier + HTML details element
// On mobile: collapsible. On desktop: always visible.
// Option A: Conditionally render details wrapper on mobile
<div className="order-3 border-t border-zinc-800 md:w-1/4 md:border-l md:border-t-0">
  {/* Mobile: collapsible */}
  <details className="md:hidden group">
    <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-300">
      Learning Journal
      <svg className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" ...>
        {/* chevron icon */}
      </svg>
    </summary>
    <div className="max-h-[300px] overflow-y-auto">
      <LearningJournal turns={turns} />
    </div>
  </details>

  {/* Desktop: always visible */}
  <div className="hidden md:flex md:h-full md:flex-col">
    <LearningJournal turns={turns} />
  </div>
</div>
```

### Pattern 3: Compact Mobile Header
**What:** Reduce header padding and hide secondary elements on mobile
**When to use:** AppHeader component
**Example:**
```tsx
// Source: Tailwind CSS 4 responsive design docs
<header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 md:px-6 md:py-3">
  <div className="flex items-center gap-2 md:gap-3">
    <LogoMark />
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-zinc-100 md:text-base">
        ThreadTutor
      </span>
      {/* Hide tagline on mobile */}
      <span className="hidden text-xs text-zinc-500 md:block">
        Socratic learning with AI
      </span>
    </div>
    {/* Hide topic breadcrumb divider on mobile */}
    <span className="hidden text-zinc-600 md:inline">/</span>
    <span className="hidden text-sm text-zinc-400 md:inline">{topic}</span>
  </div>
  ...
</header>
```

### Anti-Patterns to Avoid
- **Using JS to detect mobile viewport:** Do not use `window.innerWidth` or `useMediaQuery` hooks for layout. Use CSS-only responsive classes. JS-based detection causes flash of wrong layout on SSR.
- **Hiding the concept map entirely on mobile:** The concept map is a core feature. Show it in a fixed-height container below the conversation instead.
- **Using max-width breakpoints as primary strategy:** Tailwind is mobile-first. Style mobile FIRST (unprefixed), then add desktop overrides with `md:`. Never use `max-md:` as the primary approach.
- **Rendering LearningJournal twice (mobile + desktop):** If the journal component is rendered in two different wrappers (one for mobile, one for desktop), use CSS visibility (`hidden`/`md:block`) rather than conditional rendering to avoid duplicate React mount/state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible panel | Custom toggle state + animation | HTML `<details>`/`<summary>` + Tailwind `open:` | Native accessibility (keyboard, screen readers), zero JS, browser-handled animation |
| Responsive layout switching | `useMediaQuery` hook + conditional rendering | Tailwind responsive classes (`md:flex-row`, `md:hidden`) | Avoids SSR hydration mismatch, no JS needed |
| Touch-friendly concept map | Custom touch handlers | React Flow built-in `zoomOnPinch`, `panOnDrag` | React Flow v12 handles touch natively since v10+ |
| Em dash detection | Manual string scanning | `grep -r $'\u2014'` in CI or lint step | Unicode literal grep is definitive |

**Key insight:** This phase is primarily a CSS exercise. Almost everything can be achieved with Tailwind utility classes. The only meaningful JS change is potentially restructuring how the journal wrapper renders on mobile vs desktop.

## Common Pitfalls

### Pitfall 1: React Flow Container Height on Mobile
**What goes wrong:** React Flow renders as 0-height if its container has no explicit height. On mobile, switching from `h-screen` flex layout to a stacked layout can cause the concept map container to collapse.
**Why it happens:** React Flow measures its container via ResizeObserver. A container with `flex-1` in a column that also has other `flex-1` siblings can get 0 height.
**How to avoid:** Give the mobile concept map container a fixed height (`h-[250px]` or `h-[300px]`) instead of relying on flex-grow. On desktop, the `w-1/4` container inherits full height from the flex row.
**Warning signs:** Concept map appears blank on mobile, or shows only a sliver.

### Pitfall 2: Font Stack Override
**What goes wrong:** The body currently has `font-family: Arial, Helvetica, sans-serif` hardcoded in `globals.css` (line 28), which overrides the Geist font loaded via `next/font/google`. The Geist font CSS variables (`--font-geist-sans`, `--font-geist-mono`) are set on `<body>` via className, and the `@theme` block maps `--font-sans` to them, but the hardcoded `font-family` on `body` takes precedence.
**Why it happens:** The hardcoded rule was likely a default from the Next.js starter template that was never updated after configuring Geist fonts.
**How to avoid:** Replace `font-family: Arial, Helvetica, sans-serif;` with `font-family: var(--font-sans), sans-serif;` in globals.css, or remove the hardcoded rule entirely and rely on Tailwind's `font-sans` utility.
**Warning signs:** Text renders in Arial instead of Geist Sans across the entire app.

### Pitfall 3: Mobile Scroll Context
**What goes wrong:** On mobile, the stacked layout means the overall page could scroll (the concept map and journal are below the fold). But each panel also has its own internal scroll (`overflow-y-auto`). Nested scroll contexts on mobile cause confusing "scroll traps" where users can't scroll past a panel.
**Why it happens:** Desktop layout has `h-screen` with `overflow-hidden` on the outer container and `overflow-y-auto` on each panel. Mobile needs different scroll behavior.
**How to avoid:** On mobile, make the conversation panel take a fixed portion of the viewport height (e.g., `h-[60vh]`) with its own scroll, and let the overall page scroll to reveal the concept map and journal below. Or use a tab/accordion pattern where only one panel scrolls at a time.
**Warning signs:** Users get "stuck" scrolling inside the conversation panel and can't reach the concept map below.

### Pitfall 4: Touch Target Sizes
**What goes wrong:** Buttons and interactive elements designed for desktop (small padding, tight spacing) become hard to tap on mobile.
**Why it happens:** Desktop design uses `py-1.5 px-3` and `text-sm` for buttons, which can be under the recommended 44x44px minimum touch target.
**How to avoid:** Increase padding on interactive elements at mobile viewport. Use `min-h-[44px] min-w-[44px]` as a baseline. The replay controls ("Back", "Auto-play", "Next") and the header buttons are prime candidates.
**Warning signs:** Mistaps on mobile, buttons too close together.

### Pitfall 5: Em Dashes in Runtime Claude Output
**What goes wrong:** Even though the system prompt says "no em dashes", Claude occasionally produces them anyway, especially in longer responses.
**Why it happens:** LLM instruction following is probabilistic, not deterministic. The system prompt constraint reduces but does not eliminate em dashes.
**How to avoid:** Add a runtime sanitization step in the API response handler that replaces `\u2014` (em dash) and optionally `\u2013` (en dash) with appropriate alternatives (comma, hyphen, or nothing). This is the belt-and-suspenders approach.
**Warning signs:** Em dashes appearing in rendered conversation text during live sessions.

### Pitfall 6: Concept Map Tooltip Positioning on Mobile
**What goes wrong:** The NodeToolbar component (used for concept descriptions on hover) may position tooltips off-screen on small viewports.
**Why it happens:** Tooltips are positioned relative to the node, not the viewport. On mobile, nodes near edges push tooltips out of bounds.
**How to avoid:** On mobile, hover-based tooltips don't work anyway (no hover on touch). Consider either: (a) showing description on tap instead of hover, or (b) removing tooltips on mobile and showing description inline. React Flow's NodeToolbar already supports click-based visibility.
**Warning signs:** Tooltips cut off or invisible on mobile.

## Code Examples

### Responsive Three-Panel to Stacked Layout
```tsx
// Source: Tailwind CSS 4 responsive design documentation
// Mobile-first: stacked column, then md: breakpoint for desktop row

// In ConversationShell (and identically in ReplayShell):
<div className="flex h-screen flex-col">
  <AppHeader topic={topic} mode="live">
    {/* ... buttons ... */}
  </AppHeader>

  <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
    {/* Concept Map */}
    <div className="order-2 h-[250px] shrink-0 border-t border-zinc-800 md:order-first md:h-auto md:w-1/4 md:border-r md:border-t-0">
      <ConceptMap turns={state.turns} onConceptClick={handleConceptClick} />
    </div>

    {/* Conversation */}
    <div className="order-1 flex min-h-0 flex-1 flex-col md:order-2 md:w-1/2">
      <ConversationPanel state={state} sendMessage={sendMessage} clearError={clearError} />
    </div>

    {/* Journal */}
    <div className="order-3 border-t border-zinc-800 md:w-1/4 md:border-l md:border-t-0">
      {/* Mobile: collapsible */}
      <details className="group md:hidden">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-300">
          Learning Journal
          <ChevronIcon className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="max-h-[250px] overflow-y-auto">
          <JournalContent turns={state.turns} />
        </div>
      </details>
      {/* Desktop: always visible */}
      <div className="hidden md:flex md:h-full md:flex-col">
        <LearningJournal turns={state.turns} />
      </div>
    </div>
  </div>
</div>
```

### Fix Font Stack in globals.css
```css
/* Source: verified from codebase inspection */
/* BEFORE (broken - ignores Geist font): */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

/* AFTER (uses Geist font via Tailwind theme variable): */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

### Runtime Em Dash Sanitization
```typescript
// Source: Unicode specification - em dash is U+2014, en dash is U+2013
// Add to API response processing (e.g., in the API route or useConversation hook)
function sanitizeEmDashes(text: string): string {
  return text
    .replace(/\u2014/g, ' - ')   // em dash -> space-hyphen-space
    .replace(/\u2013/g, '-');     // en dash -> hyphen
}

// Apply to all text fields in the structured response:
// displayText, journalEntry, confidenceCheck.question, confidenceCheck.feedback,
// concept.description, concept.label
```

### React Flow Mobile Touch Configuration
```tsx
// Source: React Flow API reference (reactflow.dev/api-reference/react-flow)
// Current props already disable most interaction (nodesDraggable=false, etc.)
// For mobile, ensure these are set:
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  nodesDraggable={false}
  nodesConnectable={false}
  elementsSelectable={false}
  zoomOnPinch={true}           // Allow pinch-to-zoom on mobile (default: true)
  panOnDrag={true}             // Allow pan via touch drag (default: true)
  preventScrolling={false}     // On mobile, allow page scroll when over the flow
  colorMode="dark"
  fitView
  fitViewOptions={{ padding: 0.3 }}
  proOptions={{ hideAttribution: true }}
  minZoom={0.2}
  maxZoom={2}
/>
```

### Responsive Typography Scaling
```tsx
// Source: Tailwind CSS typography plugin docs
// Scale prose size based on viewport
<div className="prose prose-sm prose-invert md:prose-base max-w-none
                prose-p:text-zinc-200 prose-headings:text-zinc-100
                prose-strong:text-zinc-100 prose-code:text-indigo-300
                prose-code:bg-zinc-800 prose-pre:bg-zinc-800">
  <Markdown>{turn.displayText}</Markdown>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `tailwind.config.js` breakpoints | Tailwind v4 CSS `@theme { --breakpoint-* }` | Tailwind 4.0 (Jan 2025) | Breakpoints configured in CSS, not JS |
| Tailwind v3 `dark:` modifier for prose | Tailwind v4 `prose-invert` (already in use) | Tailwind Typography 0.5+ | Simpler dark mode |
| React Flow v10 limited touch support | React Flow v12 full touch/pinch support | v11.5+ (2024) | Touch drag connections, pinch zoom, auto-pan all work natively |
| `@media (max-width: ...)` | Tailwind `max-md:` variant | Tailwind 4.0 | Cleaner max-width targeting, but mobile-first (`md:`) is still preferred |

**Deprecated/outdated:**
- `tailwind.config.js` for breakpoints: In Tailwind v4, use `@theme { --breakpoint-* }` in CSS
- JS-based `useMediaQuery` for layout: CSS responsive classes are preferred to avoid SSR hydration mismatches

## Open Questions

1. **Concept Map Mobile Interaction Model**
   - What we know: React Flow supports touch natively (pan, pinch zoom). Node tooltips use hover, which doesn't work on touch.
   - What's unclear: Should tapping a concept node on mobile show its description (replacing hover tooltip), or should the click-to-scroll behavior take priority?
   - Recommendation: Keep click-to-scroll as primary action. Show concept descriptions inline on mobile (below the node label) rather than via tooltip. This is a minor enhancement that can be deferred if needed.

2. **Mobile Scroll Strategy**
   - What we know: The desktop layout uses `h-screen` + `overflow-hidden` + per-panel scrolling. Mobile needs different behavior with stacked panels.
   - What's unclear: Should the mobile layout use a single scrolling page (conversation scrolls within a fixed-height container, page scrolls to reveal map and journal), or should it use a tab-based approach?
   - Recommendation: Use fixed-height containers for each section with the page itself scrollable. Conversation gets `flex-1` (most of viewport), concept map gets `h-[250px]`, journal is collapsible. The `h-screen` outer container should become `min-h-screen` on mobile to allow natural page scrolling.

3. **Design Polish Scope**
   - What we know: Requirements say "clean, minimal, educational - muted colors, good typography, generous whitespace (Notion-like, not Discord-like)."
   - What's unclear: Exactly how much visual redesign is expected. The existing dark theme with indigo accents and zinc grays is already fairly clean.
   - Recommendation: Focus on: (1) fix font stack to use Geist, (2) increase whitespace/padding especially on messages, (3) refine heading hierarchy, (4) ensure consistent spacing scale. Do NOT redesign the color palette or component structure - those are already well-established from prior phases.

## Sources

### Primary (HIGH confidence)
- Tailwind CSS 4 responsive design docs: https://tailwindcss.com/docs/responsive-design - breakpoints, mobile-first strategy, max-* variants, @theme customization
- React Flow API reference: https://reactflow.dev/api-reference/react-flow - touch props (zoomOnPinch, panOnDrag, preventScrolling)
- React Flow touch device example: https://reactflow.dev/examples/interaction/touch-device - mobile connection patterns
- Codebase inspection: All 16 component files read, globals.css, layout.tsx, package.json verified

### Secondary (MEDIUM confidence)
- Next.js metadata docs: https://nextjs.org/docs/app/api-reference/functions/generate-metadata - viewport meta tag auto-generation confirmed
- Tailwind CSS typography plugin: https://github.com/tailwindlabs/tailwindcss-typography - prose-invert, prose scaling

### Tertiary (LOW confidence)
- None. All findings verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified; no new dependencies
- Architecture: HIGH - responsive patterns are standard Tailwind CSS 4; codebase fully inspected
- Pitfalls: HIGH - font stack bug verified directly in globals.css; em dash constraint verified via grep; React Flow mobile behavior documented in official API reference
- Design direction: MEDIUM - "Notion-like" is subjective; recommendations based on existing decisions from prior phases

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable libraries, standard CSS patterns)
