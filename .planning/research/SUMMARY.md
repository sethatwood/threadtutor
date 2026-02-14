# Project Research Summary

**Project:** ThreadTutor - AI-assisted Socratic learning app with real-time concept visualization
**Domain:** AI-powered educational technology with structured LLM output and interactive graph visualization
**Researched:** 2026-02-14
**Confidence:** HIGH

## Executive Summary

ThreadTutor is an AI-assisted Socratic tutoring application that visualizes a learner's knowledge graph in real-time as Claude guides them through a topic using the Socratic method. This is a portfolio/demo application, not a full EdTech SaaS product, which fundamentally shapes feature priorities. The core differentiator is the real-time concept map visualization paired with structured confidence checks - no competitor (Khanmigo, Socra, ChatGPT) offers this combination.

The recommended architecture uses Next.js 15 with React 19 and Tailwind v4 for the foundation, Anthropic's official SDK with structured outputs for guaranteed JSON schema compliance, and React Flow with dagre layout for the concept map visualization. The critical architectural decision is using Claude's `output_config.format` feature to guarantee schema-valid JSON on every response, eliminating the entire class of parsing failures that plague prompt-only approaches. The BYOK (Bring Your Own Key) model eliminates server-side API costs while the localStorage-based persistence removes database complexity.

The primary risk is "Socratic drift" - LLMs naturally gravitate toward providing direct answers rather than asking guiding questions. This must be addressed through system prompt design with structural enforcement (requiring confidence checks every N turns), explicit negative constraints ("NEVER provide the final answer"), and rigorous multi-turn testing. Secondary risks include JSON truncation from the 1024 max_tokens limit (increase to 2048), concept graph inconsistencies from hallucinated parent IDs (validate references client-side), and Vercel Hobby tier 10-second timeouts (use Edge Runtime or streaming).

## Key Findings

### Recommended Stack

Next.js 15.5.x with React 19 and TypeScript 5.9.x provides the foundation with stable App Router support and full-stack capabilities. Critically, the stack avoids Next.js 16 (too new, breaking changes) and stays on the battle-tested 15.x line. Tailwind CSS v4 is recommended over v3 (legacy) for its CSS-first configuration and 5x faster builds.

**Core technologies:**
- **Next.js 15.5.x**: Full-stack React framework with App Router for API routes and SSR. Avoid 16 (Turbopack breaking changes), avoid 14 (two versions behind).
- **@anthropic-ai/sdk 0.74.x**: Official Anthropic TypeScript SDK with structured outputs via `output_config.format` for guaranteed JSON schema compliance. Use directly, not through Vercel AI SDK wrappers.
- **@xyflow/react 12.10.x**: React Flow for concept map visualization. The definitive React library for node-based UIs. Note: old `reactflow` package is deprecated.
- **@dagrejs/dagre 2.0.x**: Directed graph layout algorithm for auto-positioning concept map nodes in tree-like hierarchies.
- **Tailwind CSS 4.1.x**: Utility-first CSS with new CSS-first configuration. Do NOT use v3 (legacy).
- **React 19.x**: Current version with `use()` hook and improved Suspense, default for Next.js 15.

**Critical version requirements:**
- Node.js 20 LTS minimum (Next.js 15 requires 18.18+, but 20 LTS is recommended baseline)
- Claude model: `claude-sonnet-4-5-20250929` (per SPEC) with max_tokens: 1024 (needs increase to 2048 to avoid truncation)
- All dependencies verified as compatible February 14, 2026

### Expected Features

ThreadTutor's feature set is shaped by its identity as a demo/showcase app rather than a full learning platform. The concept map is not just a feature - it IS the product's identity.

**Must have (table stakes):**
- **Streaming responses** - Every AI chat product streams; non-streaming feels broken in 2026
- **Markdown rendering in chat** - Claude uses formatting; raw markdown looks amateurish
- **Mobile-responsive layout** - 50%+ web traffic is mobile; broken layout is a portfolio dealbreaker
- **Session persistence (localStorage)** - Losing state on refresh is unacceptable
- **BYOK flow** - Clear, trustworthy API key input since users provide their own keys
- **Error handling** - API failures, rate limits, and bad keys must be handled gracefully
- **Replay mode with step-through** - This is the landing experience for visitors without API keys

**Should have (competitive advantage):**
- **Real-time concept map visualization** - The core differentiator. No competitor offers visual knowledge graph building during tutoring.
- **Confidence checks with three-level assessment** - tracking/partial/confused system with warm feedback is pedagogically sound and visually interesting
- **Learning journal** - Real-time running summary transforms chat into structured learning artifact
- **Confidence coloring on concept map** - Nodes colored by assessment level create powerful visual storytelling
- **Auto-play replay** - Timed auto-advance for the demo creates video-like polish

**Defer (v2+):**
- **System prompt transparency** - Showing the prompt is educational but wait until prompt is stable
- **Multiple demo sessions** - One great demo is better than three mediocre ones
- **Shareable session URLs** - Requires hosting session data or encoding in URLs (complex)

**Anti-features (explicitly NOT building):**
- **User authentication/accounts** - Massive scope increase orthogonal to core value
- **Multi-topic sessions** - Breaks concept map coherence and Socratic pedagogical model
- **Gamification** - This is a demo, not a daily-use learning platform
- **Server-side database** - localStorage + JSON export covers all realistic use cases
- **Multiple AI model support** - System prompt is optimized for Claude specifically

### Architecture Approach

The architecture follows a centralized session state pattern where all three panels (ConversationPanel, ConceptMap, LearningJournal) derive their display from a single Session object and currentTurnIndex number. This ensures panels stay synchronized with zero race conditions and makes replay trivial (just change turnIndex).

**Major components:**
1. **API Route (app/api/chat/route.ts)** - CORS proxy to Anthropic API using structured outputs with `output_config.format`. Receives user's API key in request body, never stores it server-side. Returns guaranteed schema-valid JSON.
2. **ConceptMap** - React Flow component wrapping dagre layout engine. Derives nodes/edges from visible turns, animates node appearance, handles hover descriptions. Critical dependency on parentId validation to prevent orphaned nodes.
3. **ConversationPanel** - Chat UI rendering messages with markdown support. Owns user input in live mode, displays confidence checks with visual treatment by assessment level.
4. **Session State Management** - Centralized in page.tsx using React useState. All panels receive props derived from session + turnIndex. No independent panel state to avoid sync issues.
5. **System Prompt Builder** - Pure function generating prompt with topic injection. This is the core of the product - the prompt drives all Socratic behavior and structured output.
6. **Session Store (localStorage)** - Pure functions for CRUD operations against localStorage. Handles save/load/export with QuotaExceededError handling.

**Key architectural patterns:**
- **Structured Output via Constrained Decoding**: Use `output_config.format` with JSON schema to guarantee schema compliance. Eliminates all parsing errors, code fence stripping, and retry loops.
- **API Route as CORS Proxy with BYOK**: Next.js Route Handler receives API key in body, calls Anthropic server-side, returns structured response. Key never stored/logged.
- **Centralized State with Derived Views**: Single session object, all panels derive display from turns[0..turnIndex]. Simplifies replay and ensures synchronization.
- **Dagre Auto-Layout**: Compute node positions from graph topology, not manual placement. Handles spacing and hierarchy automatically.

**Build order implications:**
The research reveals a clear dependency chain: types.ts → system-prompt.ts → api/chat/route.ts (get Claude working) → ConversationPanel → session-store.ts → ConceptMap + graph-layout.ts → LearningJournal → ReplayControls. The API integration and system prompt must be validated before any UI work begins.

### Critical Pitfalls

Research identified five critical pitfalls that must be addressed in specific phases:

1. **JSON Truncation from max_tokens Limit (Phase 1: API Route)** - The SPEC's 1024 token limit will cause truncation on complex turns where Claude writes lengthy explanations plus concepts plus confidence checks. The response is cut mid-JSON, causing parse failures. Solution: Increase to 2048 tokens, check `stop_reason` on every response, use structured outputs for schema guarantee (but they don't prevent truncation, only ensure schema validity when complete).

2. **Socratic Drift (Phase 1: System Prompt)** - LLMs default to providing direct answers rather than guiding questions. Over multi-turn conversations, Claude gradually shifts from questioning to lecturing. Solution: Enforce structurally via JSON schema (require confidenceCheck every N turns), add explicit negative constraints ("NEVER provide the final answer"), include few-shot examples, test with 15+ turn conversations not just 2-3.

3. **Concept Graph Inconsistency (Phase 2-3: Concept Map)** - Claude introduces concepts with parentId referencing concepts that were never introduced, or uses inconsistent ID slugs across turns. Creates orphaned nodes or disconnected graph islands. Solution: Include running concept list in each API request, validate parentId references client-side before rendering, consider client-side ID generation.

4. **Vercel Hobby Tier Serverless Timeout (Phase 1: API Route)** - The 10-second timeout on Vercel's free tier can interrupt Claude responses during complex turns or cold starts. Solution: Use Edge Runtime (`export const runtime = 'edge'`) with 25s timeout, or implement streaming (timeout applies to time-to-first-byte, not total duration). Must test on actual Vercel deployment.

5. **Prompt-Only JSON Enforcement is Unreliable (Phase 1: API Route)** - Without structured outputs, Claude occasionally wraps JSON in code fences, adds preamble text, produces invalid JSON, or has schema drift. Solution: Use `output_config.format` with Zod schema from Day 1. This is now GA on Claude Sonnet 4.5 and eliminates the entire class of parsing failures.

**Additional significant pitfalls:**
- **Dagre layout recalculation causing nodes to "jump"** - Animate position transitions, don't let nodes teleport
- **localStorage overflow (5MB limit)** - Wrap setItem in try-catch, implement session cleanup
- **React Flow performance with 20+ nodes** - Memoize custom node components with React.memo
- **API key exposure in production** - Gate env var fallback to NODE_ENV === 'development' only
- **No loading state during Claude response** - Show typing indicator, disable send button

## Implications for Roadmap

Based on combined research findings, the recommended phase structure follows architectural dependencies and prioritizes risk mitigation:

### Phase 1: Foundation & API Integration
**Rationale:** The API route and system prompt are the core of the product. All downstream work depends on reliable structured JSON responses from Claude. This phase must solve the two most critical pitfalls (Socratic drift and JSON parsing) before building UI.

**Delivers:**
- TypeScript types/schemas (Session, Turn, Concept, ConfidenceCheck)
- System prompt builder with Socratic constraints and few-shot examples
- API route with structured outputs (`output_config.format`), max_tokens: 2048, stop_reason checking
- Validated with curl or simple form - Claude reliably returns schema-valid JSON

**Addresses features:** BYOK flow foundation, error handling infrastructure

**Avoids pitfalls:**
- JSON truncation (2048 tokens, stop_reason check)
- Prompt-only JSON enforcement (structured outputs from Day 1)
- Socratic drift (system prompt design with structural enforcement)
- Vercel timeout (Edge Runtime or streaming decision)

**Research flag:** LOW - Anthropic structured outputs are well-documented in official docs. Standard Next.js API route pattern.

### Phase 2: Core Conversation UI
**Rationale:** Once the API is working, build the primary user interface for live tutoring sessions. This validates the full request/response cycle and user interaction patterns before adding complexity.

**Delivers:**
- ConversationPanel with markdown rendering
- Page layout with state management (session, turnIndex, mode)
- User input handling and API call integration
- Loading states and basic error display
- Session recording to memory (not localStorage yet)

**Uses:** Next.js 15 App Router, React 19, @anthropic-ai/sdk, react-markdown

**Implements:** Centralized session state pattern, API route integration

**Avoids pitfalls:**
- No loading state (typing indicator implemented)
- Independent panel state (centralized from start)

**Research flag:** LOW - Standard React patterns, well-documented markdown rendering libraries.

### Phase 3: Concept Map Visualization
**Rationale:** The concept map is the core differentiator and the most complex component. Build it after conversation is working so you have real session data to test against. This is the highest-risk component technically (dagre layout, React Flow integration, parentId validation).

**Delivers:**
- ConceptMap component with React Flow
- Dagre auto-layout integration (graph-layout.ts helper)
- Node/edge derivation from session concepts
- ParentId validation to prevent orphaned nodes
- Animated position transitions (no node jumping)
- Custom node components with hover descriptions

**Uses:** @xyflow/react 12.x, @dagrejs/dagre 2.x

**Implements:** Dagre auto-layout pattern, derived view from centralized state

**Avoids pitfalls:**
- Concept graph inconsistency (parentId validation)
- Dagre recalculation jank (memoization, position animations)
- React Flow performance (React.memo on custom nodes)
- Manual positioning anti-pattern (dagre from start)

**Research flag:** MEDIUM - React Flow and dagre are well-documented, but the integration of parentId validation with running concept list needs careful design. Consider light research on graph validation patterns.

### Phase 4: Session Persistence & Management
**Rationale:** Once core functionality works in-memory, add persistence so sessions survive refresh. This enables both localStorage save/load and the foundation for replay mode.

**Delivers:**
- session-store.ts with save/load/list/export functions
- localStorage integration with QuotaExceededError handling
- Session save after each turn (not just completion)
- Session export as JSON download
- Past sessions list (optional, can defer)

**Addresses features:** Session persistence, session export, past sessions list

**Avoids pitfalls:**
- localStorage overflow (try-catch, size management)
- Safari private mode failures (try-catch on all access)
- Refresh losing state (save after each turn)

**Research flag:** LOW - Standard localStorage patterns, well-known quota limits.

### Phase 5: Replay Mode & Demo Experience
**Rationale:** Build the landing experience for visitors without API keys. This requires session persistence (Phase 4) and validates that the architecture supports both live and replay modes cleanly.

**Delivers:**
- ReplayControls component (Next/Back/Auto-play)
- demo.json pre-recorded session
- Replay mode routing and state management
- Concept map progressive reveal (concepts removed on Back)
- Mode indicator in UI (replay vs live)
- Clear path from replay to live mode

**Addresses features:** Replay mode, step-through controls, auto-play, mode distinction

**Avoids pitfalls:**
- Replay Back button not removing concepts (proper slice logic)
- Auto-advancing too fast (generous delays, pause/resume)
- No clear path to live mode (prominent CTA)

**Research flag:** LOW - State manipulation patterns, standard UI controls.

### Phase 6: Learning Journal & Confidence Visualization
**Rationale:** Add the secondary panels (journal, confidence coloring) after core functionality is solid. These enhance the experience but are not blocking for basic tutoring.

**Delivers:**
- LearningJournal component (right panel)
- Confidence check visual treatment in ConversationPanel
- Confidence coloring on concept map nodes (link assessment to concepts)
- Three-level color scheme (tracking/partial/confused)

**Addresses features:** Learning journal, confidence coloring on map

**Avoids pitfalls:**
- Assessment shown too prominently (subtle color/icon)

**Research flag:** LOW - Straightforward UI components.

### Phase 7: Polish & Production Readiness
**Rationale:** Final phase for mobile responsiveness, API key UX, topic picker, and deployment validation.

**Delivers:**
- Mobile-responsive layout (three-panel → stacked)
- TopicPicker with suggested topics
- ApiKeyInput with show/hide toggle, validation
- api-key.ts localStorage helpers
- Production deployment to Vercel
- Environment variable gating (API key fallback only in dev)
- Full error handling coverage

**Addresses features:** Mobile layout, topic selection, BYOK UI

**Avoids pitfalls:**
- Mobile layout unusable (stacking, collapsible panels)
- API key security in production (env var gating)
- No API key validation (test call or graceful failure)

**Research flag:** LOW - Standard responsive design, deployment patterns.

### Phase Ordering Rationale

This sequence follows three key principles from the research:

1. **Risk-first**: The two highest-risk areas (API integration with structured outputs, concept map with graph validation) are tackled in Phases 1 and 3 respectively, when there's maximum flexibility to iterate.

2. **Dependency-driven**: The build order follows architectural dependencies revealed in the research: types → API route → conversation UI → concept map → persistence → replay → polish. Each phase depends on the previous being stable.

3. **Demo-optimized**: Since this is a portfolio/showcase app, the roadmap prioritizes getting to a deployable demo (Phases 1-5) before adding secondary features. Replay mode (Phase 5) is prioritized over some "nice-to-have" features because it's the landing experience.

**Groupings based on architecture patterns:**
- Phase 1 isolates system prompt design (the core product) for focused iteration
- Phases 2-3 build the core three-panel UI following centralized state pattern
- Phases 4-5 add persistence and replay using the same session data structure
- Phases 6-7 are progressive enhancement after core value is proven

**Pitfall avoidance strategy:**
The five critical pitfalls are addressed in the phases where they naturally occur:
- API pitfalls (truncation, timeout, parsing) → Phase 1
- Socratic drift → Phase 1 (system prompt iteration)
- Concept graph issues → Phase 3 (validation built into component)
- Storage pitfalls → Phase 4 (proper error handling)
- UX pitfalls → Phases 5-7 (loading states, mobile, etc.)

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Concept Map)**: Complex integration of React Flow + dagre + parentId validation. May benefit from focused research on graph validation patterns and incremental layout strategies if the basic approach has issues.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (API Route)**: Anthropic structured outputs are well-documented in official docs. Next.js API routes are standard.
- **Phase 2 (Conversation UI)**: Standard React patterns, well-known markdown libraries.
- **Phase 4 (localStorage)**: Well-understood browser APIs with known limitations.
- **Phase 5 (Replay Mode)**: State manipulation patterns, straightforward UI.
- **Phase 6 (Journal/Confidence)**: Simple display components.
- **Phase 7 (Polish)**: Standard responsive design and deployment.

The overall research confidence is high enough that most phases can proceed with implementation planning rather than additional research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified via npm registry as of 2026-02-14. Next.js 15 + React 19 + Tailwind v4 + Anthropic SDK 0.74.x compatibility confirmed via official docs and peerDeps checking. |
| Features | MEDIUM-HIGH | Feature landscape derived from competitor analysis (Khanmigo, Socra) and EdTech UX patterns. Table stakes identified clearly. Anti-features justified. Main uncertainty: whether streaming is truly "expected" or just "nice to have" - research says expected, but implementation can be deferred if needed. |
| Architecture | HIGH | React Flow + dagre pattern documented in official React Flow examples. Anthropic structured outputs with `output_config.format` officially supported (GA). Centralized state pattern is standard React. BYOK via API route proxy is well-established pattern. |
| Pitfalls | HIGH | Critical pitfalls verified against official Anthropic docs (stop_reason, structured outputs), React Flow performance guide, Vercel function duration limits. Socratic drift documented in academic research on LLM tutoring. All major pitfalls have concrete prevention strategies. |

**Overall confidence:** HIGH

The research converges on a clear technical approach with well-documented technologies and established patterns. The main unknowns are domain-specific (how to prevent Socratic drift via prompt engineering) rather than technical (how to integrate the stack). All critical dependencies are verified compatible and actively maintained as of February 2026.

### Gaps to Address

**Gap 1: System prompt effectiveness for Socratic teaching**
- **Nature**: Prompt engineering is inherently iterative. Research provides constraints and patterns but cannot guarantee effectiveness without testing.
- **How to handle**: Phase 1 should include extensive prompt iteration with 15+ turn test conversations. Budget time for this. The prompt IS the product.
- **Validation**: Confidence checks appear at expected frequency, Claude asks questions rather than lectures, users report "Socratic" feeling in feedback.

**Gap 2: Optimal max_tokens value**
- **Nature**: Research identifies 1024 as too low and suggests 2048, but the actual optimal value depends on system prompt verbosity and average concept count per turn.
- **How to handle**: Start with 2048 in Phase 1, monitor stop_reason in testing, adjust up if needed. Track whether typical responses use 1200, 1500, or 1800+ tokens.
- **Validation**: Zero `stop_reason: "max_tokens"` occurrences in testing across diverse topics.

**Gap 3: React Flow performance ceiling with concept count**
- **Nature**: Research says "< 100 nodes is fine" but ThreadTutor sessions could theoretically reach 100+ nodes on very long conversations.
- **How to handle**: Test Phase 3 concept map with a fabricated 100-node session. If performance degrades, implement node virtualization or switch layout algorithm. Most realistic sessions are 20-40 turns × 1-3 concepts = 60-120 nodes, which should be fine per research.
- **Validation**: No jank with 100-node test session at 60fps.

**Gap 4: Mobile concept map UX**
- **Nature**: Research identifies mobile responsiveness as table stakes but does not provide specific guidance on whether concept maps work well on small screens with touch interaction.
- **How to handle**: Phase 7 mobile implementation may reveal that the concept map needs a different interaction model on mobile (e.g., collapsible, zoom controls, or simplified view). Be prepared to adapt.
- **Validation**: Manual testing on iOS Safari and Android Chrome with actual tutoring sessions.

All gaps can be addressed during implementation through testing and iteration. None require additional research before beginning development.

## Sources

### Primary (HIGH confidence)
- **npm registry** (direct queries via `npm view`) - All package versions and compatibility verified 2026-02-14
- **Anthropic Platform Docs** - Structured outputs documentation, model IDs, stop_reason handling, streaming API
- **Next.js Official Docs** - App Router, Route Handlers, deployment to Vercel
- **React Flow Official Docs** - Layouting guide, dagre integration example, performance guide, custom nodes
- **Tailwind CSS v4 Docs** - Next.js installation guide, CSS-first configuration
- **Vercel Docs** - Serverless function duration limits, Edge Runtime specifications
- **MDN Web Docs** - localStorage quotas and eviction criteria

### Secondary (MEDIUM confidence)
- **Edutopia** - AI tutors with guardrails (UPenn study data)
- **AI tutoring research (arXiv)** - LLM-powered tutoring challenges, Socratic drift
- **Khanmigo AI Review** - Feature comparison, third-party review
- **FunBlocks Socra Launch** - Competitor feature set, first-party blog
- **Towards AI** - The Socratic Prompt methodology for preventing answer-giving
- **Parsnip** - Pedagogical knowledge graph architecture patterns
- **Simon Willison** - Anthropic CORS support documentation
- **Next.js SaaS Pilot** - CORS proxy pattern guide

### Tertiary (LOW confidence)
- **Jenova.ai** - AI tutor app guide (marketing content, general patterns only)
- **Kapdec** - Online tutoring features (marketing content, general patterns only)
- **Medium posts** - Various EdTech UX patterns (single-author perspectives)

---
*Research completed: 2026-02-14*
*Ready for roadmap: yes*
