# Feature Research

**Domain:** AI-assisted Socratic learning / tutoring demo app
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Context

ThreadTutor is a showcase/portfolio app, not a full EdTech SaaS product. This shifts what "table stakes" means. Users are not paying students expecting a curriculum -- they are visitors evaluating whether this app demonstrates a compelling AI-assisted learning experience. The audience is: potential employers, fellow developers, and curious learners who want to try Socratic learning with Claude.

This distinction matters. Features like "adaptive learning paths across semesters" are table stakes for Khanmigo but irrelevant for ThreadTutor. The bar here is: does the demo feel polished, does live mode work, and does the concept map deliver a "wow" moment.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Streaming responses** | Every AI chat product streams. Waiting for a full response before displaying feels broken in 2026. | MEDIUM | Anthropic SDK supports streaming. Use it. A non-streaming chat will make visitors think the app is frozen. |
| **Markdown rendering in chat** | Claude's responses include bold, italics, lists, and potentially code blocks. Raw markdown looks amateurish. | LOW | Use react-markdown or similar. Memoize parsed blocks to avoid re-render cost during streaming. |
| **Mobile-responsive layout** | 50%+ of web traffic is mobile. A three-panel layout that breaks on phones is a dealbreaker for a portfolio piece. | MEDIUM | Stack panels vertically on mobile. Conversation primary, concept map secondary, journal collapsible. |
| **Loading/typing indicators** | Users need feedback that the system is working while waiting for Claude's response. | LOW | Show a typing indicator or "thinking..." state. Without this, users will click buttons repeatedly or leave. |
| **Error handling for API failures** | API keys expire, rate limits hit, network drops. Unhandled errors destroy trust. | LOW | Display clear, friendly error messages. Distinguish between bad API key, rate limit, and network errors. |
| **Conversation history within a session** | Users expect to scroll back through the conversation. Basic chat UX. | LOW | Already planned. Standard scrollable chat panel. |
| **Topic selection** | Users need to pick what they want to learn about. A blank screen with no guidance is hostile. | LOW | TopicPicker with suggestions and free-text entry. Include 3-5 suggested topics for inspiration. |
| **Clear mode distinction** | Visitors must immediately understand whether they are watching a replay or having a live session. | LOW | Mode indicator in header. Different visual treatment or badge for Replay vs Live. |
| **Session persistence (localStorage)** | If the user refreshes mid-session in live mode, losing everything is unacceptable. | MEDIUM | Save session state to localStorage on each turn. Restore on page load. Already planned. |
| **BYOK (Bring Your Own Key) flow** | Since users provide their own API key, the input UX must be clear, secure-feeling, and trustworthy. | LOW | Explain that the key stays in localStorage and is never stored server-side. Show/hide toggle. Link to Anthropic's API key page. |

### Differentiators (Competitive Advantage)

Features that set ThreadTutor apart. Not expected by default, but create the "wow" moments.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Real-time concept map visualization** | This is the core differentiator. No other Socratic AI tutor builds a visual knowledge graph as you learn. Khanmigo, Socra, and ChatGPT-based tutors are all text-only. Watching concepts appear and connect as understanding builds is visceral and memorable. | HIGH | React Flow with dagre layout. Nodes animate in as concepts are introduced. Edges show parent-child relationships. Hover reveals descriptions. This is the single most important feature to get right. |
| **Confidence checks with three-level assessment** | Most AI tutors either never check understanding or use binary right/wrong. ThreadTutor's tracking/partial/confused system with warm feedback is pedagogically sound and visually interesting. | MEDIUM | Driven entirely by system prompt design. The UI needs distinct visual treatment for each assessment level -- color coding on concept map nodes, inline badges in chat. |
| **Replay mode with step-through controls** | No competitor offers a "watch a pre-recorded AI tutoring session" experience. This is brilliant for the demo use case: visitors see the full value without needing an API key. The step-through pacing lets them absorb each concept. | MEDIUM | Load pre-recorded session JSON. Next/Back buttons. Concept map builds progressively. This is the landing experience -- it must be flawless. |
| **Learning journal** | Real-time running summary of what was covered. This transforms a chat into a structured learning artifact. Most AI chat apps have no summary capability during the session. | LOW | One-sentence journal entries per assistant turn, displayed in the right panel. Simple but effective. |
| **Session export as JSON** | Users can download their learning session. Useful for review, sharing, or feeding into other tools. Uncommon in AI tutoring apps. | LOW | Download button that serializes session state. Already planned. |
| **Concept map node coloring by confidence** | Nodes on the concept map could visually indicate whether the user demonstrated understanding (green), partial understanding (yellow), or confusion (red) at that concept. At a glance, you see your knowledge landscape. | MEDIUM | Requires linking confidence check results back to concept nodes. Powerful visual storytelling about the learning journey. |
| **Auto-play replay** | Auto-advance through the demo with timed delays between turns. Visitors can sit back and watch the learning unfold like a video, but interactive. | LOW | setInterval with 2-3 second delay. Play/Pause button. Simple to implement, high polish factor. |
| **System prompt transparency** | Show the system prompt that drives the Socratic teaching. Since "the system prompt is the product," making it viewable demonstrates the craft. Few AI demos expose their prompt engineering. | LOW | A "View System Prompt" drawer or modal. Educational and trust-building. Other builders can learn from it. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. ThreadTutor should explicitly NOT build these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User authentication / accounts** | "Users should be able to log in and save sessions across devices." | Massive scope increase. Requires a database, auth provider, session management, password resets, privacy policy. Completely orthogonal to the core value prop. The SPEC explicitly excludes this. | localStorage for persistence. JSON export for portability. Users who want to keep sessions can download them. |
| **Multi-topic sessions** | "Let users switch topics mid-conversation." | Concept maps become incoherent when topics change. The Socratic method works by building understanding linearly from fundamentals. Topic switching breaks the pedagogical model and produces messy graphs. | One topic per session. Start a new session for a new topic. Keep concept maps focused and clean. |
| **Gamification (badges, streaks, XP)** | "Duolingo does it, engagement goes up." | ThreadTutor is a demo/showcase, not a daily-use learning platform. Gamification requires persistent state, progression systems, and ongoing engagement loops. It trivializes the Socratic method and shifts focus from understanding to point accumulation. | The concept map itself IS the reward -- watching your understanding grow visually. The confidence checks provide natural "achievement" moments. |
| **Server-side database** | "Store sessions and user data properly." | Introduces hosting costs, data privacy obligations, GDPR concerns, backup requirements, and ops burden. For a portfolio project, this is pure overhead. | localStorage + JSON export covers all realistic use cases. |
| **Voice input/output** | "Let users speak their answers and hear Claude." | Adds speech-to-text and text-to-speech dependencies, increases API costs, creates accessibility complications (ironically), and the structured JSON response format does not lend itself to spoken output. | Text-based interaction is the right fit. The visual concept map is the differentiator, not audio. |
| **Multiple AI model support** | "Let users choose GPT-4, Gemini, etc." | Each model has different structured output capabilities, different system prompt behaviors, and different failure modes. Testing across models is a multiplier on QA effort. The system prompt is tuned for Claude specifically. | Claude Sonnet only. The system prompt IS the product -- it is optimized for one model. |
| **Real-time collaboration** | "Let multiple users learn together." | WebSocket infrastructure, conflict resolution, shared state management. Enormous complexity for minimal value in a demo app. | Single-user experience. Share via JSON export if someone wants to show a friend. |
| **Curriculum/course structure** | "Organize topics into courses with prerequisites." | Transforms the app from a demo into a full LMS. Months of work with no alignment to the core value of demonstrating Socratic AI teaching. | Each session is self-contained. The system prompt handles progressive teaching within a single topic. |
| **Paying for users' API calls** | "Make it free for everyone, no API key needed." | Unbounded cost liability. Bots, abuse, and viral traffic could generate thousands of dollars in API charges. The SPEC explicitly excludes this. | BYOK for live mode. Free replay mode for visitors who just want to see the demo. This is the correct split. |
| **Adaptive difficulty across sessions** | "Remember what the user knew last time and adjust." | Requires persistent user profiles, cross-session state, and complex spaced-repetition algorithms. Turns a demo into a learning management system. | Each session starts fresh. Within a session, the system prompt handles adaptation naturally through Socratic dialogue. |

---

## Feature Dependencies

```
[System Prompt + API Route]
    |
    ├── [Conversation Panel] (requires API responses)
    |       |
    |       ├── [Streaming Responses] (enhances conversation panel)
    |       ├── [Markdown Rendering] (enhances conversation panel)
    |       ├── [Confidence Checks UI] (requires conversation panel)
    |       └── [Loading Indicators] (enhances conversation panel)
    |
    ├── [Session Recording] (requires conversation data)
    |       |
    |       ├── [Session Persistence / localStorage] (requires session recording)
    |       ├── [Session Export / JSON Download] (requires session recording)
    |       └── [Replay Mode] (requires recorded session JSON)
    |               |
    |               ├── [Step-Through Controls] (requires replay mode)
    |               └── [Auto-Play] (enhances replay mode)
    |
    ├── [Concept Map] (requires structured concept data from API)
    |       |
    |       ├── [Node Animations] (enhances concept map)
    |       ├── [Hover Descriptions] (enhances concept map)
    |       └── [Confidence Coloring] (requires concept map + confidence checks)
    |
    ├── [Learning Journal] (requires journal entries from API)
    |
    ├── [Topic Picker] (input to API route)
    |
    └── [API Key Input / BYOK] (input to API route)

[Mobile Responsive Layout] ── independent, cross-cutting concern
[Error Handling] ── independent, cross-cutting concern
[Mode Indicator] ── independent, cross-cutting concern
```

### Dependency Notes

- **Concept Map requires System Prompt**: The concept map is driven entirely by structured JSON output from Claude. If the system prompt does not reliably produce concept data with parentId relationships, the map will be empty or broken. The system prompt must be validated before concept map work begins.
- **Replay Mode requires Session Recording**: You cannot build replay without first having the recording format and at least one recorded session (demo.json). Session recording must come first.
- **Confidence Coloring requires both Concept Map and Confidence Checks**: This feature bridges two systems -- it needs concept nodes to exist and confidence check assessments to be linked to those concepts. Build both prerequisites first.
- **Streaming conflicts with JSON parsing**: Claude returns structured JSON, but streaming delivers it token-by-token. You need to either: (a) stream the response and parse JSON after completion, displaying a loading state, or (b) stream the displayText portion and parse structured data after. This is a key architectural decision.
- **Markdown Rendering enhances Conversation Panel**: Markdown rendering only matters once conversation text is displaying. But the library choice (react-markdown, etc.) should be decided upfront to avoid rework.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the concept and deploy to threadtutor.com.

- [ ] **System prompt + API route** -- The core engine. Claude must reliably return structured JSON with concepts, confidence checks, and journal entries.
- [ ] **Conversation panel with markdown rendering** -- Display the teaching conversation with proper formatting.
- [ ] **Basic concept map** -- React Flow rendering concepts as they are introduced. Dagre layout. This is the hero feature.
- [ ] **Learning journal panel** -- Running summary in the right panel.
- [ ] **Session recording + localStorage persistence** -- Save sessions so they survive refresh.
- [ ] **Replay mode with step-through** -- Load demo.json, step through with Next/Back. This is the landing experience.
- [ ] **Topic picker + API key input** -- Entry points for live mode.
- [ ] **Error handling** -- Graceful failures for API errors, bad keys, rate limits.
- [ ] **Loading indicators** -- Typing/thinking state while waiting for Claude.
- [ ] **Mobile-responsive layout** -- Three-panel on desktop, stacked on mobile.

### Add After Validation (v1.x)

Features to add once the core is working and deployed.

- [ ] **Streaming responses** -- Upgrade from wait-for-full-response to streaming. Trigger: if users report the app feeling slow or unresponsive during Claude's thinking time.
- [ ] **Confidence coloring on concept map** -- Color nodes by assessment level. Trigger: once confidence checks are reliably working.
- [ ] **Auto-play replay** -- Timed auto-advance for the demo. Trigger: once step-through replay is solid.
- [ ] **Session export (JSON download)** -- Download button. Trigger: once session format is stable.
- [ ] **Node hover descriptions** -- Show concept descriptions on hover/tap. Trigger: once concept map layout is polished.
- [ ] **Past sessions list** -- Show previously saved sessions from localStorage. Trigger: once multiple sessions can be stored.

### Future Consideration (v2+)

Features to defer until the app is live and getting feedback.

- [ ] **System prompt transparency** -- View the prompt powering the teaching. Defer because: the prompt will iterate significantly during v1 development; exposing it too early invites premature feedback on something still in flux.
- [ ] **Concept map animations** -- Smooth entrance animations for new nodes. Defer because: layout stability comes first; animations on top of buggy layout are lipstick on a pig.
- [ ] **Multiple demo sessions** -- More than one pre-recorded session for different topics. Defer because: one great demo is better than three mediocre ones. Get one right first.
- [ ] **Shareable session URLs** -- Generate a link to share a recorded session. Defer because: requires hosting session data or encoding it in URLs (which get very long).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| System prompt + API route | HIGH | MEDIUM | P1 |
| Conversation panel + markdown | HIGH | LOW | P1 |
| Concept map (React Flow) | HIGH | HIGH | P1 |
| Learning journal | MEDIUM | LOW | P1 |
| Replay mode + step-through | HIGH | MEDIUM | P1 |
| Session recording + localStorage | HIGH | MEDIUM | P1 |
| Topic picker | HIGH | LOW | P1 |
| API key input (BYOK) | HIGH | LOW | P1 |
| Error handling | HIGH | LOW | P1 |
| Loading indicators | HIGH | LOW | P1 |
| Mobile-responsive layout | HIGH | MEDIUM | P1 |
| Streaming responses | MEDIUM | MEDIUM | P2 |
| Confidence coloring on map | MEDIUM | MEDIUM | P2 |
| Auto-play replay | MEDIUM | LOW | P2 |
| Session export (JSON) | LOW | LOW | P2 |
| Node hover descriptions | MEDIUM | LOW | P2 |
| Past sessions list | LOW | LOW | P2 |
| System prompt viewer | LOW | LOW | P3 |
| Map entrance animations | LOW | MEDIUM | P3 |
| Multiple demo sessions | LOW | MEDIUM | P3 |
| Shareable session URLs | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Khanmigo | Socra | ChatGPT (tutoring prompt) | ThreadTutor (Planned) |
|---------|----------|-------|---------------------------|----------------------|
| Socratic questioning | Yes, core method | Yes, "Adaptive Socratic Teaching" | Only if manually prompted | Yes, system-prompt-driven |
| Visual concept map | No | No | No | **Yes -- core differentiator** |
| Confidence assessment | Implicit (adapts difficulty) | Unclear | No | Yes, explicit three-level system |
| Learning journal | No | "Artifact generation" (different) | No | Yes, real-time per-turn summaries |
| Session replay | No | No | No | **Yes -- demo-first experience** |
| BYOK / API key model | No (subscription) | No (subscription) | N/A (OpenAI product) | Yes, localStorage-based |
| Session export | No | Yes (artifact export) | Copy-paste only | Yes, JSON download |
| Multi-subject | Yes (math, science, etc.) | Yes | Yes | Single topic per session (by design) |
| User accounts | Yes (required) | Yes (required) | Yes (required) | **No (by design)** |
| Pricing | ~$4/month | Freemium | ChatGPT Plus ($20/mo) | Free replay, BYOK for live |
| Structured output | Backend only | Backend only | No | Yes, JSON driving all UI |
| Progress tracking | Yes (cross-session) | Yes | No | Within-session only (by design) |

**Key insight:** ThreadTutor's differentiation is entirely visual and structural. No competitor combines Socratic teaching with a real-time concept map and session replay. The concept map is not just a feature -- it is the product's identity.

---

## Sources

- [Edutopia: AI Tutors Can Work With the Right Guardrails](https://www.edutopia.org/article/ai-tutors-work-guardrails/) -- MEDIUM confidence, verified with UPenn study data
- [Khanmigo AI Review 2025](https://aiflowreview.com/khanmigo-ai-review-2025/) -- MEDIUM confidence, third-party review
- [AI Tutor App Complete Guide 2026](https://www.jenova.ai/en/resources/ai-tutor-app) -- LOW confidence, marketing content
- [Top Must-Have Features for Online Tutoring 2026](https://kapdec.com/blog/10-essential-tutoring-features-you-need-to-master-in-2025/) -- LOW confidence, marketing content
- [FunBlocks Socra Launch](https://www.funblocks.net/blog/2026/01/01/Hello-Meet-Socra-Your-New-AI-Thought-Partner-for-Smarter-Learning) -- MEDIUM confidence, first-party blog
- [Khan Academy AI Education UX (Medium)](https://medium.com/@blessingokpala/ai-in-education-ux-how-khan-academy-is-shaping-human-ai-learning-experiences-9ec3492dbcc7) -- LOW confidence, single blog post
- [AI Socratic Tutors: Teaching the World to Think](https://aicompetence.org/ai-socratic-tutors/) -- LOW confidence, could not fully verify content
- [BYOK pattern - Vercel AI Gateway](https://vercel.com/docs/ai-gateway/byok) -- HIGH confidence, official Vercel docs
- [Interactive Product Walkthrough Examples 2026](https://supademo.com/blog/interactive-product-walkthrough-examples) -- MEDIUM confidence, multiple sources agree on replay/walkthrough patterns
- [Next.js Markdown Chatbot with Memoization](https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization) -- HIGH confidence, official Vercel AI SDK docs
- [SocratiQ: AI-Powered Learning Companion (arXiv)](https://arxiv.org/html/2502.00341v1) -- MEDIUM confidence, academic preprint
- [Education Next: AI Tutors Hype or Hope](https://www.educationnext.org/ai-tutors-hype-or-hope-for-education-forum/) -- MEDIUM confidence, credible education publication

---
*Feature research for: AI-assisted Socratic learning demo app (ThreadTutor)*
*Researched: 2026-02-14*
