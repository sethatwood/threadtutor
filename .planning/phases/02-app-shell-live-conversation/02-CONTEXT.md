# Phase 2: App Shell & Live Conversation - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

User can open the app, enter an API key and topic, and have a live Socratic conversation with Claude in a three-panel desktop layout. Concept map rendering, learning journal content, session persistence, and replay mode are separate phases. This phase delivers the shell structure, start flow, conversation UI, and live API interaction.

</domain>

<decisions>
## Implementation Decisions

### Session start flow
- Topic picker is front and center on first visit, with API key entry as a secondary element nearby
- Free text input for topic with a few example topics shown as clickable chips/pills below the input
- After picking a topic, a second inline step asks for the API key before the conversation starts
- Returning users (API key already in localStorage) go straight to the topic picker, skipping API key entry

### Conversation appearance
- Flat, full-width messages with subtle dividers or spacing between them (ChatGPT/Claude.ai style, not chat bubbles)
- Confidence checks render in a distinct colored card/box within the conversation flow (e.g., colored border)
- Clean and minimal visual tone (Notion-like): lots of whitespace, muted colors, clean sans-serif type
- Assessment results ("tracking", "partial", "confused") shown as text labels with subtle muted accent colors, not bold traffic-light colors

### Input experience
- Auto-growing textarea that starts as one line and grows as user types
- Enter to send, Shift+Enter for newline
- When a confidence check is active, a dedicated response input area appears inside the confidence check card itself (input moves into the card)
- Loading state: skeleton message placeholder with shimmer animation where Claude's response will appear

### Panel layout & shell
- Conversation panel dominant at ~50% width, left and right panels ~25% each
- Left panel (Concept Map) shows a simple "Concept Map" label as placeholder until Phase 3
- Right panel (Learning Journal) shows a simple "Learning Journal" label as placeholder until Phase 4
- Header contains ThreadTutor branding on the left and current topic name displayed
- Subtle thin borders between panels for visual separation

### Claude's Discretion
- Exact color palette and accent colors for confidence check cards and assessment labels
- Typography choices (font family, sizes, weights)
- Spacing and padding values
- Skeleton shimmer animation details
- Example topic suggestions (the specific topics shown as chips)
- Right panel placeholder styling

</decisions>

<specifics>
## Specific Ideas

- Notion-like feel: clean, minimal, educational, not cluttered
- Flat messages like Claude.ai/ChatGPT, not chat bubbles
- Confidence check input lives inside the check card, not in the main input area
- Topic chips should be inviting examples that make users want to try the app

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-app-shell-live-conversation*
*Context gathered: 2026-02-15*
