---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/use-progressive-reveal.ts
  - components/message.tsx
  - components/conversation-panel.tsx
autonomous: true

must_haves:
  truths:
    - "New assistant turns in live mode reveal text word-by-word at ~30-40 words/sec"
    - "Previously rendered turns display instantly (no re-animation on re-render)"
    - "Replay mode turns appear instantly with no progressive reveal"
    - "beforeContent (assessed confidence card) appears immediately, not after reveal"
    - "children (pending confidence card) appears only after text finishes revealing"
    - "Auto-scroll continues working during the progressive reveal"
  artifacts:
    - path: "lib/use-progressive-reveal.ts"
      provides: "Progressive text reveal hook"
      exports: ["useProgressiveReveal"]
    - path: "components/message.tsx"
      provides: "Message component with optional animate prop"
    - path: "components/conversation-panel.tsx"
      provides: "ConversationPanel that tracks new turns and passes animate prop"
  key_links:
    - from: "components/message.tsx"
      to: "lib/use-progressive-reveal.ts"
      via: "useProgressiveReveal hook call"
      pattern: "useProgressiveReveal"
    - from: "components/conversation-panel.tsx"
      to: "components/message.tsx"
      via: "animate prop on latest new assistant turn"
      pattern: "animate="
---

<objective>
Add client-side progressive text reveal so that new Claude responses in live mode appear word-by-word (~30-40 words/sec), giving the feel of watching Claude type. Replay mode is unaffected.

Purpose: The current UX shows a skeleton placeholder then dumps the full response in one tick. Progressive reveal makes the experience feel more dynamic and conversational.
Output: A `useProgressiveReveal` hook and integration into Message + ConversationPanel.
</objective>

<execution_context>
@/Users/yayseth/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yayseth/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@lib/use-progressive-reveal.ts (new file)
@components/message.tsx
@components/conversation-panel.tsx
@components/replay-conversation.tsx
@lib/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useProgressiveReveal hook</name>
  <files>lib/use-progressive-reveal.ts</files>
  <action>
Create a new React hook `useProgressiveReveal` in `lib/use-progressive-reveal.ts`.

Signature:
```ts
export function useProgressiveReveal(
  text: string,
  active: boolean,
): { displayedText: string; isRevealing: boolean }
```

Behavior:
- When `active` is `false`, return `{ displayedText: text, isRevealing: false }` immediately (no animation).
- When `active` is `true`, reveal `text` word-by-word at approximately 30-40 words/sec.
- Split `text` by whitespace to get a word array. Use a `wordIndex` state that starts at 0 and increments via `setInterval`.
- The interval should be ~28ms (approximately 35 words/sec). Use a `useRef` for the interval ID.
- `displayedText` = the first `wordIndex` words joined by spaces. This preserves markdown formatting because we split/join on spaces only (markdown syntax like `**bold**`, `- list item`, `## heading` stays intact as whole words).
- `isRevealing` = `true` while `wordIndex < words.length`, `false` once complete.
- When the text finishes revealing (wordIndex reaches words.length), clear the interval.
- Clean up interval on unmount.
- If `text` changes while active (unlikely but defensive), reset `wordIndex` to 0 and restart.
- If `active` transitions from `true` to `false` (e.g., user scrolled away), immediately show full text and clear interval.

Do NOT use requestAnimationFrame (setInterval is simpler and sufficient for this rate). Do NOT debounce or throttle -- just a plain interval.
  </action>
  <verify>
`npm run build` passes with no TypeScript errors. The hook file exports correctly.
  </verify>
  <done>
`lib/use-progressive-reveal.ts` exists, exports `useProgressiveReveal`, compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Integrate progressive reveal into Message and ConversationPanel</name>
  <files>components/message.tsx, components/conversation-panel.tsx</files>
  <action>
**Message component (`components/message.tsx`):**

Add an optional `animate` prop to `MessageProps`:
```ts
interface MessageProps {
  turn: Turn;
  children?: React.ReactNode;
  beforeContent?: React.ReactNode;
  animate?: boolean;  // NEW: trigger progressive reveal for this message
}
```

For assistant turns, call the hook:
```ts
const { displayedText, isRevealing } = useProgressiveReveal(
  turn.displayText,
  animate ?? false,
);
```

In the JSX for assistant turns:
- `beforeContent` renders immediately (no change -- it shows assessed confidence cards which should appear instantly).
- Replace `<Markdown>{turn.displayText}</Markdown>` with `<Markdown>{displayedText}</Markdown>`.
- Only render `{children}` (pending confidence card) when `!isRevealing`. This means the confidence check question appears after the text finishes revealing.

For user turns, no changes needed (they don't animate).

**ConversationPanel (`components/conversation-panel.tsx`):**

Track which turn should animate using a ref that records the highest turn number we've seen:
```ts
const lastSeenTurnRef = useRef(0);
```

On each render, compute the "new assistant turn number": look at the last turn in `state.turns`. If it's an assistant turn AND its `turnNumber > lastSeenTurnRef.current`, that turn should animate. After identifying it, update the ref:

```ts
const lastTurn = state.turns[state.turns.length - 1];
const animatingTurnNumber =
  lastTurn &&
  lastTurn.role === "assistant" &&
  lastTurn.turnNumber > lastSeenTurnRef.current
    ? lastTurn.turnNumber
    : null;

// Update ref AFTER computing (use useEffect to avoid updating during render)
useEffect(() => {
  if (state.turns.length > 0) {
    lastSeenTurnRef.current = state.turns[state.turns.length - 1].turnNumber;
  }
}, [state.turns]);
```

In the `.map()`, pass `animate={turn.turnNumber === animatingTurnNumber}` to `<Message>`.

For auto-scroll during reveal: the existing `useEffect` triggers on `[state.turns, state.isLoading]` which fires when the turn arrives but NOT during word-by-word reveal. Add an additional scroll trigger: create a small `useEffect` that scrolls on a short interval while the animating turn is active. Alternatively, the simplest approach is to add a `MutationObserver` or just adjust the scroll dependency. The SIMPLEST effective approach: in the existing auto-scroll useEffect, also depend on a tick. But actually the cleanest approach is:

Add a new callback prop `onRevealTick` concept -- BUT that overcomplicates things. Instead, just add a second auto-scroll mechanism: a `useEffect` that runs a scroll interval (~100ms) while there are turns animating, then clears it. Track whether reveal is in progress by passing an `onRevealComplete` callback to Message, or simpler: derive it from the state.

SIMPLEST APPROACH for auto-scroll during reveal:
- After the `.map()`, add a small component or effect that detects content height changes. Actually, the very simplest: use `useRef` to track if we just received a new turn, and run a scrolling interval for ~10 seconds (longer than any reveal), clearing it early if the user scrolls up. But that's hacky.

RECOMMENDED APPROACH: Use a ResizeObserver on the message list container. When content height changes (which it does as words are added), scroll to bottom. This is clean, automatic, and doesn't require passing callbacks between components.

```ts
// Add ResizeObserver for auto-scroll during progressive reveal
const messageListRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = messageListRef.current;
  if (!el) return;

  const observer = new ResizeObserver(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  });
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

Add `ref={messageListRef}` to the message list `<div>` (the `flex-1 overflow-y-auto` div). This replaces the existing `useEffect` scroll trigger on `[state.turns, state.isLoading]` -- actually, keep both. The ResizeObserver handles continuous scroll during reveal, while the existing effect handles the initial scroll when turns change.

IMPORTANT: `ReplayConversation` is a separate component and does NOT receive these changes. It does not pass `animate` to `Message`, so `animate` defaults to `undefined`/`false` and the hook returns full text immediately. No changes needed to replay-conversation.tsx.
  </action>
  <verify>
1. `npm run build` passes with no errors.
2. `npm run dev` -- start a live conversation. When Claude responds, text should appear word-by-word rather than all at once. The confidence check card should appear after text finishes.
3. Navigate to replay mode -- turns should appear instantly with no progressive reveal.
  </verify>
  <done>
- New assistant turns in live mode reveal word-by-word at ~30-40 wps
- `beforeContent` (assessed confidence) appears immediately
- `children` (pending confidence card) appears after reveal completes
- Replay mode is unaffected (no animate prop passed)
- Auto-scroll works during the reveal
- Build passes cleanly
  </done>
</task>

</tasks>

<verification>
1. `npm run build` -- no TypeScript or compilation errors
2. Live mode: send a message, observe word-by-word text reveal on Claude's response
3. Live mode: after text finishes, confidence check card appears (if applicable)
4. Live mode: already-rendered messages show instantly (no re-animation on scroll or re-render)
5. Replay mode: step through turns -- all text appears instantly
6. Auto-scroll follows the text as it reveals
</verification>

<success_criteria>
- Progressive text reveal works at ~30-40 words/sec for new assistant turns in live mode
- Replay mode has no progressive reveal
- beforeContent renders immediately, children render after reveal completes
- Auto-scroll works continuously during reveal
- No TypeScript errors, clean build
</success_criteria>

<output>
After completion, create `.planning/quick/5-add-client-side-progressive-text-reveal-/5-01-SUMMARY.md`
</output>
