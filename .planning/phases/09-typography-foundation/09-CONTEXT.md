# Phase 9: Typography Foundation - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the app's typographic identity using Libre Baskerville (serif) and Courier Prime (mono), with responsive fluid scaling and comfortable reading metrics. This phase covers font loading, type scale, spacing, and typographic conventions. Theme colors and component restyling are separate phases (10-12).

</domain>

<decisions>
## Implementation Decisions

### Font pairing boundaries
- AI messages: Libre Baskerville (serif) -- warm, approachable teaching voice
- User messages: Libre Baskerville (serif) -- consistent reading experience, both sides feel like the same conversation
- Concept map node labels: Courier Prime (mono) -- concepts feel like tags/identifiers, distinct from surrounding text
- Buttons and navigation: Claude's discretion per element based on context

### Heading scale & feel
- Subtle size differences between heading levels -- modern, restrained hierarchy where weight and spacing carry more than size alone
- Mixed font weights across heading levels (e.g., h1 bold, h2 regular/medium, h3 lighter) for nuanced hierarchy
- Page heading (topic name): understated -- the conversation content is the star, not the title
- Case treatment (uppercase, small-caps): Claude's discretion per heading level

### Text spacing & rhythm
- Balanced density -- moderate spacing, enough to read comfortably without feeling empty or wasteful of the three-panel layout
- Conversation messages flow together with minimal separation -- feels like a continuous dialogue, not discrete blocks
- Paragraphs within AI responses separated by vertical space (standard web style), not book-style indentation
- ~65 character line width: Claude applies where it makes sense per component

### Claude's Discretion
- Buttons/navigation font choice (serif vs mono per element)
- Heading case treatment (standard case, small-caps, uppercase per level)
- Line width measure application per component
- Label/badge casing and letter-spacing conventions (Bitcoin Echo as inspiration, not gospel)
- Italic usage conventions
- Confidence check prompt font treatment
- Overall typographic personality beyond Bitcoin Echo -- trusted to delight users with good design sense

</decisions>

<specifics>
## Specific Ideas

- Bitcoin Echo is a starting point for typographic direction, not dogmatic gospel -- Claude designed it and is trusted to use that same design sense to make decisions that delight users
- Conversation should feel like a flowing dialogue, not a series of message cards
- Concept map nodes in mono creates a nice system/content distinction
- Hierarchy should feel subtle and modern, not loud or editorial

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 09-typography-foundation*
*Context gathered: 2026-02-15*
