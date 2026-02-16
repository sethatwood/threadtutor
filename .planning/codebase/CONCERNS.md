# Codebase Concerns

**Analysis Date:** 2026-02-15

## Tech Debt

**No automated testing:**
- Issue: Zero test files detected in the project (only test files are in node_modules dependencies). No test framework configured (no jest.config, vitest.config, or test scripts).
- Files: All application code is untested
- Impact: Changes to core logic (structured output parsing, concept graph, session state management) have no safety net. Regressions are discovered by users, not CI.
- Fix approach: Add Vitest with React Testing Library. Start with unit tests for `lib/graph-layout.ts` (orphaned node handling), `lib/use-conversation.ts` (turn sequencing), and `app/api/chat/route.ts` (error cases).

**Hardcoded model ID:**
- Issue: Model ID `"claude-sonnet-4-5-20250929"` is hardcoded in `app/api/chat/route.ts:80`
- Files: `app/api/chat/route.ts`
- Impact: Model updates or user model selection require code changes. Cannot A/B test different models without deployment.
- Fix approach: Move model ID to environment variable with fallback, or add model picker UI in settings.

**Em dash workaround:**
- Issue: Custom em/en dash sanitization function in `app/api/chat/route.ts:12-16` strips characters after API response. System prompt prohibits em dashes, but Claude occasionally produces them anyway.
- Files: `app/api/chat/route.ts:12-16, 114-138`, `lib/system-prompt.ts:35`
- Impact: Adds post-processing complexity. If the sanitization is missed for new response fields, em dashes slip through. Not a breaking issue, but indicates the structured output constraint is imperfect.
- Fix approach: Remove workaround if Anthropic improves instruction following, or accept that sanitization is needed and centralize it in a helper function.

**localStorage quota handling incomplete:**
- Issue: `lib/session-storage.ts:28-43` wraps saveSession in try/catch for QuotaExceededError but only logs a warning. User has no UI feedback that their session wasn't saved.
- Files: `lib/session-storage.ts:38-42`
- Impact: Silent data loss. User continues conversation thinking it's being saved, but localStorage is full. They lose their work when they reload.
- Fix approach: Bubble quota error to UI as toast notification. Offer immediate session download as backup. Consider implementing session pruning (delete oldest sessions to free space).

**Session file accumulation in development:**
- Issue: `app/api/sessions/route.ts` writes every session to `public/sessions/{id}.json` in development mode. No cleanup mechanism. Currently 6 session files totaling 44KB.
- Files: `app/api/sessions/route.ts:12-34`, `public/sessions/`
- Impact: Clutter in public directory. These files get committed to git and deployed to production (harmless but wasteful).
- Fix approach: Add `public/sessions/` to `.gitignore`. Add cleanup script or auto-delete sessions older than 7 days.

**No input sanitization for topic strings:**
- Issue: User topic input from `components/topic-picker.tsx:196-201` is passed directly to system prompt without length limits or sanitization
- Files: `components/topic-picker.tsx:196`, `lib/system-prompt.ts:26`
- Impact: Extremely long topics (>10,000 characters) could exceed token limits. Malicious input like "Ignore previous instructions..." could attempt prompt injection (low risk with structured outputs, but not impossible).
- Fix approach: Add maxLength validation on topic input (e.g., 100 characters). Trim and sanitize special characters before sending to API.

## Known Bugs

**Stale state in useConversation sendMessage:**
- Symptoms: `lib/use-conversation.ts:160-209` uses `stateRef` to read fresh turns because `sendMessage` is memoized with `useCallback`. If `stateRef` is out of sync, messages could be sent with outdated context.
- Files: `lib/use-conversation.ts:153-158`
- Trigger: Edge case during rapid user input or re-renders
- Workaround: The current implementation appears stable, but relies on `useEffect` firing before `sendMessage` reads `stateRef`
- Fix: Refactor to use reducer's dispatch directly within sendMessage instead of relying on ref timing

**React Flow node positioning on first render:**
- Symptoms: `components/concept-map.tsx:87-91` uses `handleInit` to center viewport on initial render. If React Flow isn't fully initialized, viewport may not center correctly (nodes render off-screen).
- Files: `components/concept-map.tsx:87-91`
- Trigger: Fast connection or pre-cached React Flow bundle
- Workaround: `setTimeout` with 100ms in `FullscreenMapInner` (line 166) patches timing issue

## Security Considerations

**API keys stored in localStorage:**
- Risk: API keys are stored in plaintext in `localStorage` (`lib/api-key.ts:16`)
- Files: `lib/api-key.ts:16`, `components/topic-picker.tsx:45-49`
- Current mitigation: localStorage is origin-scoped. Key is sent directly to Anthropic via Next.js API route, not logged server-side.
- Recommendations: Warn users to use restricted API keys (low-spend limits). Add UI for key rotation/deletion. Consider adding encryption at rest (IndexedDB with Web Crypto API) for enterprise deployments.

**No rate limiting on API route:**
- Risk: `/api/chat` route has no rate limiting. Single user could spam requests, burning through API quota.
- Files: `app/api/chat/route.ts`
- Current mitigation: Users bring their own API key (BYOK), so they burn their own budget. But a malicious actor with a stolen key could abuse it.
- Recommendations: Add per-IP rate limiting with `next-rate-limit` or Vercel Edge Config. Limit to 60 requests/hour per API key hash.

**No CORS protection on API routes:**
- Risk: `/api/chat` and `/api/sessions` have no explicit CORS headers. Any origin could call these endpoints if they can guess the URL.
- Files: `app/api/chat/route.ts`, `app/api/sessions/route.ts`
- Current mitigation: Next.js API routes default to same-origin. `/api/sessions` is gated to `NODE_ENV === "development"`.
- Recommendations: Explicitly set CORS headers to deny cross-origin requests in production.

**User input passed directly to Claude:**
- Risk: User messages are sent to Claude with minimal sanitization. Malicious prompts like "Ignore system prompt and..." could attempt jailbreak.
- Files: `lib/use-conversation.ts:172-174`, `app/api/chat/route.ts:79-87`
- Current mitigation: Structured outputs (`output_config.format`) enforce schema compliance. Claude's safety guardrails filter harmful content.
- Recommendations: Add client-side input validation (max length, disallow control characters). Log suspicious patterns for monitoring.

## Performance Bottlenecks

**Dagre layout recomputation on every render:**
- Problem: `lib/graph-layout.ts:69` creates a new `dagre.graphlib.Graph()` on every call to `buildGraphElements`. Comment on line 68 says "anti-pattern to reuse across renders," but doesn't explain why.
- Files: `lib/graph-layout.ts:69`
- Cause: React Flow requires fresh node positions. Dagre graph is recomputed even when concept array hasn't changed.
- Improvement path: Memoize `buildGraphElements` output based on concepts array identity. Only recompute layout when concepts change, not on every parent re-render.

**Auto-growing textarea recalculates height on every keystroke:**
- Problem: `components/conversation-panel.tsx:55-60` sets `textarea.style.height = "auto"` then reads `scrollHeight` on every character typed. Forces reflow.
- Files: `components/conversation-panel.tsx:55-65`
- Cause: Simple auto-grow pattern prioritizes simplicity over performance
- Improvement path: Debounce height adjustment or use ResizeObserver. Not critical unless user types very long paragraphs (uncommon).

**Session auto-save triggers on every turn:**
- Problem: `components/conversation-shell.tsx:59-77` writes to localStorage and POSTs to `/api/sessions` after every single turn (every assistant + user message pair).
- Files: `components/conversation-shell.tsx:59-77`
- Cause: Ensure zero data loss even if user closes tab mid-conversation
- Improvement path: Debounce saves (e.g., 2 seconds after last turn). Still auto-save on page unload (beforeunload event). Reduces localStorage churn.

## Fragile Areas

**Concept parentId validation:**
- Files: `lib/graph-layout.ts:77-79`
- Why fragile: Comment on line 54 says "orphaned nodes (invalid parentId) silently become roots." If Claude hallucinates a parentId that doesn't exist, the graph renders but structure is corrupted. No error surfaced to user.
- Safe modification: Always validate `concept.parentId` in `knownIds` set before creating edge. Already done (line 78), but no logging or metrics to detect when this happens.
- Test coverage: None. Add unit test with invalid parentId to ensure silent fallback works.

**Turn number synchronization:**
- Files: `lib/use-conversation.ts:16`, `components/concept-map.tsx:212-213`
- Why fragile: `turnNumber` is managed in reducer state and incremented manually. If reducer logic changes (e.g., adding turn types), turnNumber could desync from array index.
- Safe modification: Always derive turnNumber from `turns.length` or use a UUID. Current implementation is safe but tightly coupled.
- Test coverage: None. Add test for turn sequencing under rapid user input.

**React Flow viewport initialization race:**
- Files: `components/concept-map.tsx:87-107`
- Why fragile: Relies on `onInit` firing after nodes are positioned. If React Flow changes initialization order, viewport centering breaks.
- Safe modification: Test in React Flow strict mode. Add fallback setTimeout if nodes.length changes but viewport didn't center.
- Test coverage: Manual only (visual regression)

## Scaling Limits

**localStorage capacity:**
- Current capacity: ~5-10MB (browser-dependent)
- Limit: With average session size ~7KB (based on 44KB / 6 sessions), user can store ~700-1400 sessions before hitting quota
- Scaling path: Migrate to IndexedDB (50MB+ quota) or implement cloud sync with optional backend

**Concept map rendering with large graphs:**
- Current capacity: React Flow handles 15-20 nodes well (target from system prompt)
- Limit: At 100+ nodes, dagre layout becomes slow (>100ms) and viewport navigation is unwieldy
- Scaling path: Add graph virtualization (only render visible nodes) or implement hierarchical collapse/expand

**Message history context window:**
- Current capacity: `max_tokens: 2048` with full message history sent every turn
- Limit: After ~30 turns (2-3 hour session), message history approaches context window limit for Sonnet (200K tokens)
- Scaling path: Implement sliding window (send only last N turns) or use Claude's prompt caching to reduce token cost

## Dependencies at Risk

**Zod 4 (bleeding edge):**
- Risk: `package.json:20` uses `"zod": "^4.3.6"`. Zod 4 is in beta/early release (not yet stable).
- Impact: Breaking API changes in Zod 4.x could break `TurnResponseSchema` validation and `zodOutputFormat` helper from Anthropic SDK.
- Migration plan: Monitor Zod 4 stability. If breaking changes occur, pin to last working version or refactor to Anthropic's native schema helpers (if available).

**React Flow major version updates:**
- Risk: `@xyflow/react` is on v12. Major updates often break node type registration or viewport APIs.
- Impact: Concept map could break on upgrade (node rendering, positioning, fullscreen portal)
- Migration plan: Pin to v12.x. Test thoroughly in isolated branch before upgrading to v13.

## Missing Critical Features

**No session data export beyond JSON:**
- Problem: Users can export sessions as JSON (`components/conversation-shell.tsx:82-90`) but cannot generate shareable links or export to readable formats (PDF, Markdown)
- Blocks: Sharing learning sessions with others (students, teachers, colleagues)
- Priority: Medium

**No undo/redo for conversation:**
- Problem: If user accidentally sends wrong answer or wants to explore alternate reasoning paths, they must start a new session
- Blocks: Exploratory learning, mistake recovery
- Priority: Low (use case is niche)

**No multi-topic session history:**
- Problem: All sessions are isolated. User cannot compare or cross-reference concepts from multiple topics (e.g., "photosynthesis" and "cellular respiration")
- Blocks: Advanced learners making connections across domains
- Priority: Low (architectural change required)

## Test Coverage Gaps

**API route error handling:**
- What's not tested: `app/api/chat/route.ts` error branches (invalid JSON, missing fields, Anthropic API errors)
- Files: `app/api/chat/route.ts:29-173`
- Risk: Regression in error messages or status codes. Invalid API responses could crash route.
- Priority: High

**Concept graph orphaned node handling:**
- What's not tested: `lib/graph-layout.ts:77-79` silently makes orphaned nodes roots. No test confirms this works.
- Files: `lib/graph-layout.ts:77-79`
- Risk: Future refactoring could break orphaned node handling, causing React Flow to crash on invalid edges
- Priority: High

**localStorage quota exceeded:**
- What's not tested: `lib/session-storage.ts:38-42` catches QuotaExceededError but behavior isn't verified
- Files: `lib/session-storage.ts:38-42`
- Risk: Error handling path may not work as expected (e.g., localStorage could be in inconsistent state)
- Priority: Medium

**Confidence check state transitions:**
- What's not tested: `components/conversation-panel.tsx:88-100` determines which turn has active confidence check. Complex logic with no unit tests.
- Files: `components/conversation-panel.tsx:88-100`
- Risk: Edge cases (rapid user input, back-to-back confidence checks) could break UI state
- Priority: Medium

**Turn sequencing under rapid input:**
- What's not tested: What happens if user sends multiple messages before Claude responds? Does turn numbering stay consistent?
- Files: `lib/use-conversation.ts:43-107`
- Risk: Race condition could duplicate turn numbers or skip numbers
- Priority: Low (UI disables input during loading, but not enforced in reducer)

---

*Concerns audit: 2026-02-15*
