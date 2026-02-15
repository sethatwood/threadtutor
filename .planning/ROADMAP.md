# Roadmap: ThreadTutor

## Overview

ThreadTutor delivers an AI-assisted Socratic learning app where Claude teaches any topic through guided questioning while building a real-time concept map. The roadmap moves from validated API integration (the core product is the system prompt) through conversation UI, concept map visualization, session persistence, and replay mode, culminating in a polished landing experience deployable on Vercel. Eight phases follow architectural dependencies: each phase delivers a verifiable capability that the next phase builds on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & API** - System prompt, structured outputs, and API route that reliably returns Socratic teaching JSON
- [ ] **Phase 2: App Shell & Live Conversation** - Three-panel layout with working conversation panel, topic picker, and API key input
- [ ] **Phase 3: Concept Map** - React Flow directed graph that builds progressively as concepts are introduced
- [ ] **Phase 4: Learning Journal** - Right panel displaying running one-sentence summaries from each teaching turn
- [ ] **Phase 5: Session Persistence** - localStorage save/load/export so sessions survive refresh and can be shared as JSON
- [ ] **Phase 6: Replay Mode** - Pre-recorded demo session with step-through controls for visitors without API keys
- [ ] **Phase 7: Landing Experience** - Visitor flow from replay demo to live mode with header branding and mode indicators
- [ ] **Phase 8: Mobile & Design Polish** - Responsive mobile layout and design system enforcement for production readiness

## Phase Details

### Phase 1: Foundation & API
**Goal**: Developer can call the API route and receive schema-valid structured JSON from Claude doing Socratic teaching on any topic
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06, API-07
**Success Criteria** (what must be TRUE):
  1. Calling the API route with a topic and API key returns valid JSON matching the ThreadTutor schema (displayText, concepts, confidenceCheck, journalEntry fields present)
  2. Claude asks guiding questions rather than giving direct answers, and confidence checks appear every 2-3 turns in a multi-turn conversation
  3. Sending a request without an API key in the body falls back to the ANTHROPIC_API_KEY environment variable
  4. Every response has stop_reason validated -- no truncated JSON from hitting the token limit
  5. The running concept list is sent back to Claude each turn, and subsequent responses reference consistent parentIds
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Project setup, Zod schemas, and system prompt
- [x] 01-02-PLAN.md -- API route with BYOK, structured outputs, and error handling

### Phase 2: App Shell & Live Conversation
**Goal**: User can open the app, enter an API key and topic, and have a live Socratic conversation with Claude in a three-panel desktop layout
**Depends on**: Phase 1
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, UI-01, LAND-02, LAND-03
**Success Criteria** (what must be TRUE):
  1. User can enter an API key (persisted in localStorage) and a topic, then begin a live Socratic conversation with Claude
  2. Conversation panel renders Claude's teaching responses with proper markdown formatting and displays confidence checks with the question, user's response, and assessment level
  3. User can type and submit responses to both regular conversation and confidence check prompts
  4. A loading indicator appears while waiting for Claude's response, and the send button is disabled during loading
  5. The three-panel desktop layout is present with ConceptMap (left), Conversation (center), and LearningJournal (right) placeholders
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md -- Dependencies, CSS setup, API key helpers, and conversation state hook
- [ ] 02-02-PLAN.md -- Leaf UI components (message, confidence check, skeleton, placeholders)
- [ ] 02-03-PLAN.md -- Assembly: conversation panel, three-panel shell, topic picker, page entry

### Phase 3: Concept Map
**Goal**: User sees a directed graph of concepts building in real time as Claude introduces new ideas during the conversation
**Depends on**: Phase 2
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06
**Success Criteria** (what must be TRUE):
  1. Concepts appear as nodes in a React Flow directed graph with dagre auto-layout, and the root concept starts centered
  2. New nodes animate in subtly as each teaching turn introduces concepts
  3. Edges connect child concepts to their parent concepts, and orphaned nodes (invalid parentId) are handled gracefully rather than breaking the graph
  4. Hovering a concept node expands it to show the one-sentence concept description
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Learning Journal
**Goal**: User has a running learning journal that grows with each teaching turn, completing the three-panel experience
**Depends on**: Phase 2
**Requirements**: JOUR-01, JOUR-02
**Success Criteria** (what must be TRUE):
  1. The right panel displays a running list of one-sentence summaries, one per assistant turn
  2. The journal grows progressively as the conversation advances -- new entries appear after each Claude response
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Session Persistence
**Goal**: User's learning sessions survive browser refresh, can be exported as JSON, and past sessions are browsable
**Depends on**: Phase 2
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06
**Success Criteria** (what must be TRUE):
  1. Sessions are recorded in React state during live conversation and saved to localStorage automatically
  2. Refreshing the browser does not lose the current session -- it can be resumed from the past sessions list
  3. User can export any session as a downloadable JSON file
  4. A past sessions list shows previously saved sessions and the user can load any of them
  5. In development mode, sessions are also written to /public/sessions/ on disk for demo generation
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Replay Mode
**Goal**: Visitors without API keys can step through a pre-recorded demo session and watch the concept map build progressively
**Depends on**: Phase 3, Phase 5
**Requirements**: REPL-01, REPL-02, REPL-03, REPL-04, REPL-05
**Success Criteria** (what must be TRUE):
  1. The default experience for new visitors loads demo.json and plays the Bitcoin proof-of-work session without requiring an API key
  2. Next and Back buttons step through the conversation one turn at a time, with the concept map building and un-building accordingly
  3. Auto-play mode advances turns automatically with a 2-3 second delay between turns
  4. Confidence checks during replay show the original user's response and Claude's assessment
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Landing Experience
**Goal**: New visitors have a clear, guided path from watching the replay demo to starting their own live learning session
**Depends on**: Phase 6
**Requirements**: LAND-01, LAND-04, LAND-05
**Success Criteria** (what must be TRUE):
  1. New visitors land on the replay demo with a visible, clear path to "Try it live" that guides them to enter an API key and topic
  2. A mode indicator in the header shows whether the user is in Live or Replay mode
  3. The header displays "ThreadTutor" branding, a tagline, and the current topic name
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Mobile & Design Polish
**Goal**: The app is production-ready with responsive mobile layout and consistent, clean educational design
**Depends on**: Phase 7
**Requirements**: UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. On mobile screens, the layout stacks vertically with conversation on top, concept map below, and journal collapsible
  2. The visual design is clean, minimal, and educational -- muted colors, good typography, generous whitespace (Notion-like, not Discord-like)
  3. No em dashes appear anywhere in the rendered application
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

Note: Phases 3 and 4 both depend on Phase 2 and can execute in either order. Phase 6 depends on both Phase 3 and Phase 5.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & API | 2/2 | Complete | 2026-02-15 |
| 2. App Shell & Live Conversation | 0/3 | Not started | - |
| 3. Concept Map | 0/TBD | Not started | - |
| 4. Learning Journal | 0/TBD | Not started | - |
| 5. Session Persistence | 0/TBD | Not started | - |
| 6. Replay Mode | 0/TBD | Not started | - |
| 7. Landing Experience | 0/TBD | Not started | - |
| 8. Mobile & Design Polish | 0/TBD | Not started | - |
