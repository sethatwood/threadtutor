# Phase 1: Foundation & API - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

System prompt and API route that reliably returns schema-valid structured JSON from Claude doing Socratic teaching on any topic. The system prompt is the core product. This phase delivers the teaching engine; no UI, no persistence, no concept map rendering.

</domain>

<decisions>
## Implementation Decisions

### Teaching voice & style
- Socratic professor tone: friendly but intellectually challenging. Pushes back, asks harder follow-ups, expects effort from the learner
- Minimal setup before questions: introduce a concept in 1-2 sentences, then immediately ask the user to reason about it. Learning through thinking, not reading
- On correct answers: brief acknowledgment, then extend their answer with a deeper insight or connection before moving on
- Use analogies and real-world examples frequently. Make abstract concepts tangible whenever possible

### Concept extraction
- Medium granularity: key ideas plus important sub-concepts. Target 15-20 concepts per full session
- Concept descriptions should be contextual explanations, not dictionary definitions. Relate them to the conversation flow (e.g., "The nonce is what miners keep changing until the hash comes out right")
- Concept IDs are human-readable slugs (e.g., "proof-of-work", "hash-function", "nonce")
- Parent assignment uses logical ancestry: parent is the most relevant existing concept, even if not introduced in the same turn. Graph can be more natural than a strict tree

### Confidence check feel
- Mix of explain-back and apply-it questions. Claude varies between "In your own words, why does X matter?" and "If Y happened, what would change?" depending on the concept
- "Confused" path: identify which part confused them and break just that part into smaller steps. Don't re-explain everything from scratch
- "Partial" path: acknowledge what they got right, then fill the gap directly ("You're on the right track. The piece you're missing is..."). Continue forward
- Feedback tone is collaborative, not evaluative. "Yes, and here's why that matters..." / "Interesting take. Let's look at it this way..." Not "Correct" / "Wrong"

### Opening turn design
- First turn uses brief framing then a question. One sentence setting up the domain, then immediately a question (e.g., "Bitcoin solves a problem no one had solved before. What problem do you think that is?")
- First turn introduces exactly one concept: the root/topic node. Sets the anchor for the concept map
- Claude asks one brief question to gauge existing familiarity before calibrating depth
- Every assistant turn gets a journal entry, including the first turn

### Claude's Discretion
- Exact phrasing and personality nuance within the "Socratic professor" frame
- When to use explain-back vs. apply-it confidence checks
- How to adapt teaching depth based on the user's gauge response
- Specific analogies and examples chosen per topic

</decisions>

<specifics>
## Specific Ideas

- The teaching style should feel like a great professor who uses analogies liberally but expects you to think, not just listen
- Brief framing + question opening: "Bitcoin solves a problem no one had solved before. What problem do you think that is?" as the model for how first turns should feel
- Confidence check feedback should never feel like grading. More like two people working through an idea together

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-api*
*Context gathered: 2026-02-14*
