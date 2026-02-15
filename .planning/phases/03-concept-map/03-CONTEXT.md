# Phase 3: Concept Map - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

React Flow directed graph that builds progressively as Claude introduces concepts during teaching turns. Concepts appear as nodes with edges connecting children to parents. The map occupies the left panel of the three-panel layout. Session persistence and replay interactions with the map are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Node & edge styling
- Rounded rectangle nodes, clean and modern
- Single muted accent color for all nodes (consistent with existing muted indigo theme)
- Concept name only as the default label -- description shown on hover
- Smooth curved (bezier) edges connecting parent to child

### Growth animation
- New nodes enter with fade-in + scale-up animation (~300ms)
- Multiple concepts from a single turn: Claude's discretion on staggered vs simultaneous
- Layout adjustment when new nodes arrive: Claude's discretion (avoid jarring jumps)
- Auto-fit viewport only when new nodes would be offscreen; otherwise preserve user's current view

### Interaction behavior
- Hover: floating tooltip popup showing the one-sentence concept description
- Click: scrolls the conversation panel to the turn where that concept was introduced
- No node dragging -- dagre controls all positioning, users pan/zoom viewport only
- Small "fit all" button (corner icon) to reset viewport to show all nodes

### Map density & scaling
- Graph grows beyond the panel; users scroll/pan to explore (no forced zoom-out)
- Layout direction (top-to-bottom vs left-to-right): Claude's discretion based on panel aspect ratio
- Newest nodes get a subtle highlight (faint glow or brighter border) that fades after a few seconds
- Empty state: centered muted placeholder text ("Concepts will appear here as you learn" or similar)

### Claude's Discretion
- Layout direction (TB vs LR) based on panel constraints
- Staggered vs simultaneous entry for multi-concept turns
- Layout reflow strategy when new nodes are added
- Exact animation timing and easing
- Tooltip positioning and styling details
- Fit-all button icon and placement

</decisions>

<specifics>
## Specific Ideas

- Click-to-scroll linking between concept map and conversation creates a connected experience -- the map is navigational, not just decorative
- Recency highlight helps users track what's new in a growing graph
- The map should feel like watching knowledge build, not like staring at a static diagram

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 03-concept-map*
*Context gathered: 2026-02-15*
