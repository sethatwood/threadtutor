# Requirements: ThreadTutor

**Defined:** 2026-02-14
**Core Value:** The system prompt is the product. A well-prompted Claude that teaches through Socratic questioning, with a UI built around learning rather than chatting.

## v1 Requirements

### API & System Prompt

- [ ] **API-01**: API route proxies Claude calls via Edge Runtime to avoid Vercel Hobby 10s timeout
- [ ] **API-02**: System prompt enforces Socratic teaching: progressive concepts, confidence checks every 2-3 turns, warm assessment feedback
- [ ] **API-03**: Claude returns structured JSON via Anthropic structured outputs (output_config.format) with guaranteed schema compliance
- [ ] **API-04**: API route accepts user-provided API key from request body (BYOK model)
- [ ] **API-05**: API route falls back to ANTHROPIC_API_KEY env var when no key in request (local dev)
- [ ] **API-06**: max_tokens set to 2048 with stop_reason validation on every response
- [ ] **API-07**: Running concept list passed back to Claude each turn for parentId consistency

### Conversation

- [ ] **CONV-01**: User can have a live Socratic conversation with Claude about any topic
- [ ] **CONV-02**: Conversation panel renders teaching exchanges with markdown formatting
- [ ] **CONV-03**: Confidence checks display the question, user's response, and assessment (tracking/partial/confused) with feedback
- [ ] **CONV-04**: User can type responses to confidence checks and general conversation
- [ ] **CONV-05**: Loading indicator shown while waiting for Claude's response

### Session Management

- [ ] **SESS-01**: Sessions are recorded in React state during live conversation
- [ ] **SESS-02**: Completed sessions saved to localStorage (key: threadtutor:session:{id})
- [ ] **SESS-03**: User can export session as JSON via download button
- [ ] **SESS-04**: Past sessions list shows previously saved sessions
- [ ] **SESS-05**: User can replay any past session from localStorage
- [ ] **SESS-06**: In dev mode, sessions also written to /public/sessions/ on disk

### Concept Map

- [ ] **MAP-01**: Directed graph rendered with React Flow (@xyflow/react) and dagre layout
- [ ] **MAP-02**: Nodes appear with subtle animation as concepts are introduced each turn
- [ ] **MAP-03**: Edges connect child concepts to parent concepts via parentId
- [ ] **MAP-04**: Root concept (parentId: null) starts centered
- [ ] **MAP-05**: Hovering a node expands it to show one-sentence concept description
- [ ] **MAP-06**: parentId references validated before rendering (prevent orphaned nodes)

### Learning Journal

- [ ] **JOUR-01**: Right panel displays running list of one-sentence summaries from each assistant turn
- [ ] **JOUR-02**: Journal grows progressively as conversation advances

### Replay Mode

- [ ] **REPL-01**: Default experience for new visitors loads demo.json (no API key required)
- [ ] **REPL-02**: Next/Back buttons step through conversation one turn at a time
- [ ] **REPL-03**: Concept map builds progressively as each assistant turn is revealed
- [ ] **REPL-04**: Auto-play mode with 2-3 second delay between turns
- [ ] **REPL-05**: Confidence checks show user's response and Claude's assessment during replay

### Landing & User Flow

- [ ] **LAND-01**: New visitors see replay mode with clear path to "Try it live"
- [ ] **LAND-02**: Topic picker screen for live mode where user enters what they want to learn
- [ ] **LAND-03**: API key input with localStorage persistence
- [ ] **LAND-04**: Mode indicator showing Live or Replay in header
- [ ] **LAND-05**: Header with "ThreadTutor" branding, tagline, and topic name

### Layout & Design

- [ ] **UI-01**: Three-panel desktop layout: ConceptMap (left) | Conversation (center) | LearningJournal (right)
- [ ] **UI-02**: Mobile layout: stack vertically with conversation on top, concept map below, journal collapsible
- [ ] **UI-03**: Clean, minimal, educational design direction (Notion-like: muted colors, good typography, generous whitespace)
- [ ] **UI-04**: No em dashes anywhere in the project

## v2 Requirements

### Enhanced Visualization

- **VIS-01**: Color-coded concept nodes based on confidence check results
- **VIS-02**: Concept map zoom and pan controls for large graphs

### Social & Sharing

- **SHARE-01**: Share a replay session via URL
- **SHARE-02**: Embed replay widget on external sites

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication | API key entry is not auth; no user accounts needed |
| Server-side database | No backend storage of user data or sessions |
| Multiple topics per session | One topic per session keeps interaction focused |
| Server-side API key storage | Keys are per-request only, never stored or logged |
| Paying for users' API calls | BYOK model; each user provides their own key |
| Streaming text display | Structured JSON must be consumed atomically; use loading indicator instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1: Foundation & API | Pending |
| API-02 | Phase 1: Foundation & API | Pending |
| API-03 | Phase 1: Foundation & API | Pending |
| API-04 | Phase 1: Foundation & API | Pending |
| API-05 | Phase 1: Foundation & API | Pending |
| API-06 | Phase 1: Foundation & API | Pending |
| API-07 | Phase 1: Foundation & API | Pending |
| CONV-01 | Phase 2: App Shell & Live Conversation | Pending |
| CONV-02 | Phase 2: App Shell & Live Conversation | Pending |
| CONV-03 | Phase 2: App Shell & Live Conversation | Pending |
| CONV-04 | Phase 2: App Shell & Live Conversation | Pending |
| CONV-05 | Phase 2: App Shell & Live Conversation | Pending |
| UI-01 | Phase 2: App Shell & Live Conversation | Pending |
| LAND-02 | Phase 2: App Shell & Live Conversation | Pending |
| LAND-03 | Phase 2: App Shell & Live Conversation | Pending |
| MAP-01 | Phase 3: Concept Map | Pending |
| MAP-02 | Phase 3: Concept Map | Pending |
| MAP-03 | Phase 3: Concept Map | Pending |
| MAP-04 | Phase 3: Concept Map | Pending |
| MAP-05 | Phase 3: Concept Map | Pending |
| MAP-06 | Phase 3: Concept Map | Pending |
| JOUR-01 | Phase 4: Learning Journal | Pending |
| JOUR-02 | Phase 4: Learning Journal | Pending |
| SESS-01 | Phase 5: Session Persistence | Pending |
| SESS-02 | Phase 5: Session Persistence | Pending |
| SESS-03 | Phase 5: Session Persistence | Pending |
| SESS-04 | Phase 5: Session Persistence | Pending |
| SESS-05 | Phase 5: Session Persistence | Pending |
| SESS-06 | Phase 5: Session Persistence | Pending |
| REPL-01 | Phase 6: Replay Mode | Pending |
| REPL-02 | Phase 6: Replay Mode | Pending |
| REPL-03 | Phase 6: Replay Mode | Pending |
| REPL-04 | Phase 6: Replay Mode | Pending |
| REPL-05 | Phase 6: Replay Mode | Pending |
| LAND-01 | Phase 7: Landing Experience | Pending |
| LAND-04 | Phase 7: Landing Experience | Pending |
| LAND-05 | Phase 7: Landing Experience | Pending |
| UI-02 | Phase 8: Mobile & Design Polish | Pending |
| UI-03 | Phase 8: Mobile & Design Polish | Pending |
| UI-04 | Phase 8: Mobile & Design Polish | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after roadmap creation*
