# Pitfalls Research

**Domain:** AI-assisted Socratic learning app with structured LLM output and concept visualization
**Researched:** 2026-02-14
**Confidence:** HIGH (verified against official Anthropic docs, React Flow docs, and multiple community sources)

## Critical Pitfalls

### Pitfall 1: JSON Truncation from max_tokens Limit

**What goes wrong:**
Claude's response is cut off mid-JSON because the `max_tokens: 1024` limit is reached before the complete JSON object is generated. The result is syntactically invalid JSON that crashes `JSON.parse()`. This is especially likely on turns where Claude writes a longer `displayText` explanation AND introduces multiple concepts with descriptions AND includes a confidence check -- all of which compete for the same 1024-token budget.

**Why it happens:**
1024 tokens is approximately 750-800 words. A single tutoring turn with a 3-paragraph explanation, 2-3 concepts (each with id, label, parentId, description), a confidence check object, and a journal entry can easily exceed this. The JSON overhead (keys, braces, quotes) adds roughly 30-40% token cost on top of the content itself. The `stop_reason` will be `"max_tokens"` rather than `"end_turn"`, but if the code does not check this field, the truncated response is silently treated as valid.

**How to avoid:**
1. **Check `stop_reason` on every API response.** If `response.stop_reason === "max_tokens"`, do not attempt to parse the content as JSON. Show a graceful error or retry with a higher limit.
2. **Use Claude's structured outputs feature** (`output_config.format` with `json_schema`) instead of relying on prompt-only JSON enforcement. Structured outputs use constrained decoding to guarantee schema-valid JSON. However, even with structured outputs, truncation at `max_tokens` still produces incomplete output -- the schema guarantee only holds when `stop_reason` is `"end_turn"`.
3. **Increase `max_tokens` to 2048 or higher.** 1024 is too tight for a schema this complex. The spec says "tutoring turns should be concise," but conciseness applies to `displayText`, not the entire JSON envelope. Budget at least 1500-2048 tokens.
4. **Instruct Claude in the system prompt to keep `displayText` under 150 words** so the overall token budget is not consumed by prose.

**Warning signs:**
- `JSON.parse()` errors in production logs
- `stop_reason: "max_tokens"` appearing in API responses
- Longer teaching topics (e.g., advanced technical subjects) failing more than simple ones
- Turns with both concepts AND confidence checks failing more than turns with just one

**Phase to address:**
Phase 1 (API route and system prompt). This must be solved before any UI work begins, because every downstream component depends on reliable JSON parsing.

---

### Pitfall 2: Claude Gives Answers Instead of Asking Questions (Socratic Drift)

**What goes wrong:**
LLMs default to providing direct answers rather than guiding through questions. Over the course of a multi-turn conversation, Claude gradually shifts from Socratic questioning to lecturing. It "forgets" to ask confidence checks, stops probing understanding, and starts delivering monologues. The conversation devolves from interactive tutoring into a one-way knowledge dump.

**Why it happens:**
This is a well-documented failure mode in LLM-based Socratic tutoring research. The root cause is "uncontrolled fluency" -- LLMs are trained on massive amounts of expository text and naturally gravitate toward comprehensive answers. Each turn where Claude explains without asking reinforces this pattern through the conversation history. Additionally, as the conversation grows longer, the system prompt's Socratic instructions become proportionally less influential relative to the accumulated conversation context.

**How to avoid:**
1. **Enforce Socratic behavior structurally via the JSON schema.** The `confidenceCheck` field being nullable is dangerous because Claude can simply set it to `null` every turn. Instead, track turn count and either (a) require `confidenceCheck` to be non-null every 2-3 turns in your application logic, or (b) add explicit turn-counting instructions in the system prompt: "You MUST ask a confidence check on turns 3, 6, 9, 12, etc."
2. **Add explicit negative constraints:** "You are ONLY allowed to ask questions and give hints. NEVER provide the final answer until the student has attempted the problem." (Per research from "The Socratic Prompt" methodology.)
3. **Include few-shot examples** in the system prompt showing the desired question-asking behavior, not just a description of it.
4. **Monitor in testing:** Run 10+ turn conversations and check if confidence checks actually appear at the expected frequency.

**Warning signs:**
- Three or more consecutive turns without a `confidenceCheck`
- `displayText` growing longer over the course of a session (Claude is lecturing more)
- User responses becoming shorter (they have nothing to answer because Claude is not asking)
- The concept map growing rapidly without any assessment (concepts introduced without understanding verified)

**Phase to address:**
Phase 1 (system prompt design). This is the single most important design challenge in the project. The system prompt is the core of the product. Iterate on it extensively before building UI.

---

### Pitfall 3: Concept Graph Inconsistency (Orphaned Nodes and Broken References)

**What goes wrong:**
Claude introduces a concept with a `parentId` referencing a concept that was never introduced, or uses inconsistent `id` slugs across turns (e.g., "proof-of-work" in one turn, "pow" in the next when referencing the same concept). This creates edges pointing to nonexistent nodes in React Flow, which either crashes the graph renderer or produces disconnected floating nodes that undermine the visual coherence of the concept map.

**Why it happens:**
Claude does not have persistent memory of what concept IDs it has previously used. It regenerates IDs from scratch each turn based on the conversation context. Without the full list of previously introduced concepts in the conversation history, Claude will hallucinate IDs or use reasonable-but-wrong slugs. This is a specific instance of the general LLM consistency problem with structured references across turns.

**How to avoid:**
1. **Include the running concept list in each API request.** Before each Claude call, append a summary like: `"Previously introduced concepts: [{ id: 'hashing', label: 'Cryptographic Hashing' }, { id: 'nonce', label: 'Nonce' }]"` to the user message or as a system prompt addendum. This gives Claude the exact IDs to reference.
2. **Validate `parentId` references on the client side.** Before adding a concept to the graph, check that `parentId` either is `null` or matches an existing concept `id`. If the reference is invalid, fall back to connecting to the root node or the most recently introduced concept.
3. **Normalize IDs deterministically.** Consider generating concept IDs on the client side (e.g., `concept-${turnNumber}-${index}`) rather than letting Claude choose them, and pass these IDs back to Claude for reference.

**Warning signs:**
- React Flow rendering disconnected nodes that float away from the main graph
- Console warnings about edges referencing nonexistent node IDs
- The concept map having multiple separate "islands" instead of one connected tree
- Different sessions on the same topic producing wildly different concept structures

**Phase to address:**
Phase 2-3 (ConceptMap component). Must be solved when wiring up React Flow. The validation layer should be built into the concept processing pipeline, not as an afterthought.

---

### Pitfall 4: Vercel Hobby Tier Serverless Timeout (10 Seconds)

**What goes wrong:**
The API route that proxies Claude calls times out on Vercel's free tier before Claude finishes generating its response. Vercel's Hobby plan enforces a 10-second timeout on serverless functions. Claude Sonnet typically takes 3-8 seconds for a structured response, but can take 10-15+ seconds on complex turns, during cold starts, or under load. The user sees a 504 Gateway Timeout error with no teaching response.

**Why it happens:**
Vercel's Hobby plan limits serverless function execution to 10 seconds. Claude's response time is variable and depends on: (a) the length of conversation history being sent, (b) the complexity of the topic, (c) Anthropic API latency. As conversations grow longer (more turns = more input tokens), response times increase.

**How to avoid:**
1. **Use streaming responses.** Stream Claude's response token-by-token through the API route. Vercel treats streaming differently -- the timeout applies to time-to-first-byte, not total response time. As long as the first token arrives within 10 seconds (which it almost always will), the stream can continue beyond the limit.
2. **Alternatively, use Edge Runtime** for the API route (`export const runtime = 'edge'`). Edge functions have a 25-second timeout and are well-suited for proxy patterns. However, ensure the Anthropic SDK works in Edge Runtime (it should, as it is a fetch-based HTTP client).
3. **Implement client-side timeout handling.** Show a "Claude is thinking..." state with a spinner, and if the response takes more than 15 seconds, offer a "Retry" button rather than letting the UI hang silently.

**Warning signs:**
- 504 errors appearing only in production, never in local development
- Longer conversations (turn 8+) timing out more frequently than early turns
- Intermittent failures that cannot be reproduced locally (where there is no timeout)

**Phase to address:**
Phase 1 (API route). This must be addressed before deployment. Using streaming or Edge Runtime should be a Day 1 decision, not a post-deployment fix.

---

### Pitfall 5: Prompt-Only JSON Enforcement is Unreliable

**What goes wrong:**
The spec describes instructing Claude via system prompt to "always respond with a JSON object." Without using the structured outputs API feature, Claude will occasionally: (a) wrap JSON in markdown code fences (```json ... ```), (b) add conversational preamble before the JSON ("Sure! Here's my response:"), (c) produce syntactically invalid JSON (trailing commas, single quotes), or (d) omit required fields or add unexpected ones (schema drift).

**Why it happens:**
Prompt-based JSON enforcement relies on Claude's instruction-following, which is very good but not guaranteed. The SPEC already acknowledges this ("Claude occasionally wraps JSON in markdown code fences. Strip those if present."), but code fence stripping alone does not handle all failure modes. Schema drift (extra or missing fields) is harder to detect and fix with string manipulation.

**How to avoid:**
1. **Use the Anthropic structured outputs feature** (`output_config.format` with `type: "json_schema"`). This is now generally available for Claude Sonnet 4.5 and guarantees schema compliance through constrained decoding at the token level. The model literally cannot produce tokens that violate the schema.
2. **Define the Turn schema as a Zod schema** in TypeScript and use the `zodOutputFormat` helper from `@anthropic-ai/sdk/helpers/zod` to convert it for the API call. This gives you both API-level enforcement and TypeScript type safety.
3. **If structured outputs cannot be used for any reason**, implement a robust parsing pipeline: (a) strip code fences, (b) attempt `JSON.parse()`, (c) validate against schema with Zod, (d) on failure, retry the API call once with an appended message "Your previous response was not valid JSON. Please respond with ONLY a JSON object."
4. **Note the tradeoff:** Structured outputs add first-request latency for grammar compilation (cached for 24 hours after), and they inject an additional system prompt that increases input token cost slightly. For a tutoring app, this tradeoff is strongly worth it.

**Warning signs:**
- `JSON.parse()` errors in production
- Responses starting with text like "Here's" or "Sure" before the JSON
- TypeScript type errors when accessing response fields that should exist but are missing
- The `concepts` array occasionally being a single object instead of an array

**Phase to address:**
Phase 1 (API route). This is a foundational decision. Choose structured outputs from the start rather than building a fragile prompt-based approach and migrating later.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Prompt-only JSON enforcement (no structured outputs) | Simpler API call, no schema definition needed | Parsing failures in production, need for retry logic, code fence stripping hacks | Never -- structured outputs are GA and free to use |
| Storing entire conversation history in every API request | Simple implementation | Token costs grow quadratically with conversation length, eventually hitting context limits | Acceptable for MVP (sessions are ~15 turns), but add summarization or windowing before scaling |
| Using `localStorage` for both API key and session storage without quota management | No database needed, works immediately | Silent data loss when 5MB limit is hit (throws `QuotaExceededError`), no cross-device access | Acceptable for MVP with proper error handling around `setItem()` |
| Recalculating dagre layout from scratch every turn | Simpler than incremental layout | Nodes "jump" to new positions as the graph grows, disorienting the user | Acceptable if you animate the transition (position interpolation), but feels wrong if nodes teleport |
| Hardcoding `max_tokens: 1024` | Follows spec | Truncation on complex turns | MVP only -- make it configurable or increase to 2048 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Anthropic API (structured outputs) | Using the deprecated `output_format` parameter | Use `output_config: { format: { ... } }` -- the old parameter still works temporarily but will be removed |
| Anthropic API (model name) | Hardcoding model string as `"claude-3-5-sonnet"` or similar outdated names | Use the current model identifier: `"claude-sonnet-4-5-20250929"` (as specified in SPEC). Verify the latest available model name in official docs before deployment. |
| Anthropic API (streaming) | Treating streaming responses the same as non-streaming | With streaming, `stop_reason` is `null` until the `message_delta` event. Check for it in the delta, not the initial message. |
| Anthropic API (CORS) | Building a proxy API route without knowing direct browser access is possible | Anthropic supports CORS via `anthropic-dangerous-direct-browser-access: true` header. For BYOK apps, this eliminates the proxy entirely. However, the spec explicitly calls for a proxy route, and the proxy provides additional benefits (rate limiting, logging, error handling). Keep the proxy. |
| Vercel deployment | Assuming serverless function behavior matches local `next dev` | Serverless has cold starts, 10s timeout on Hobby, no persistent filesystem. Test on Vercel Preview before releasing. |
| React Flow + dagre | Importing dagre as `import dagre from 'dagre'` (default export) | Dagre uses `const dagre = require('dagre')` or `import * as dagre from 'dagre'` depending on bundler config. The named import often fails silently. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending full conversation history every API call | Token costs are low on early turns | Implement conversation windowing: send system prompt + last N turns + concept summary. Or summarize older turns. | Turn 15+: input tokens exceed 4000+, costs multiply, latency increases |
| Re-running dagre layout on every React render | Imperceptible on small graphs | Run dagre only when `concepts` array changes (new turn), not on every render. Memoize the layout result. | 20+ nodes: layout computation causes visible jank during unrelated re-renders |
| CSS animations on every React Flow node | Smooth on 5 nodes | Use entrance animations only (animate once on mount), not continuous animations. Memoize custom node components with `React.memo`. | 30+ nodes: accumulated CSS transitions cause frame drops |
| Storing every session in localStorage | Works for first few sessions | Implement session cleanup: limit to N most recent sessions, show storage usage, offer export-and-delete. Wrap `setItem` in try-catch for `QuotaExceededError`. | 10+ sessions: approaching 5MB localStorage limit (each session is 50-200KB depending on length) |
| Not memoizing React Flow custom node components | Fine with few nodes | Declare custom node components outside the parent component or wrap in `React.memo`. Creating them inside the render function causes React Flow to unmount and remount every node on every render. | Any graph size: causes flickering and breaks animations |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging the user's API key in the API route | Key appears in Vercel function logs, accessible to project owner | Never `console.log()` the request body or key. Destructure the key out before any logging. Add an ESLint rule or code comment convention. |
| Storing API key in a cookie instead of localStorage | Cookies are sent with every request including to third-party domains if not scoped properly; more XSS attack surface | Use localStorage (as spec says). It is only accessible via JavaScript on the same origin. Not sent automatically with requests. |
| Not validating the API key format before sending to Anthropic | Invalid keys cause confusing Anthropic 401 errors that might be misinterpreted as auth issues on the proxy | Validate format client-side (Anthropic keys start with `sk-ant-`). Show clear error message for invalid format. |
| Exposing the `.env.local` API key in production | If the fallback logic (use env var when no client key provided) is left active in production, anyone can use the deployed app without their own key, incurring charges on the developer's account | Add explicit environment check: only fall back to env var when `process.env.NODE_ENV === 'development'`. In production, require client-provided key. The spec already describes this, but it is easy to miss the guard. |
| XSS vulnerability in `displayText` rendering | Claude's `displayText` contains markdown. If rendered with `dangerouslySetInnerHTML` or an unsafe markdown renderer, injected content could execute scripts. | Use a safe markdown renderer (e.g., `react-markdown`) that sanitizes HTML by default. Never use `dangerouslySetInnerHTML` for LLM output. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during Claude's response | User thinks the app is broken, clicks "Send" again, gets duplicate or interleaved responses | Show a typing indicator or "Claude is thinking..." immediately on send. Disable the send button until the response arrives. |
| Concept map nodes jumping to new positions without animation | User loses spatial context every time a new concept is added; the map feels chaotic instead of progressive | Animate node position transitions using CSS transitions or React Flow's position animation. Run dagre layout, then interpolate from old to new positions. |
| Confidence check assessment shown immediately | User sees "tracking/partial/confused" label before they have time to read Claude's feedback, which feels judgmental | Show the assessment as a subtle color or icon, not a prominent label. Or reveal it progressively (show feedback first, then assessment label). |
| Replay mode auto-advancing too fast | Visitor cannot read the content before the next turn appears | Default to manual "Next" advancement. If auto-play is offered, use a generous delay (3-5 seconds per turn minimum, longer for turns with more text). Provide pause/resume controls. |
| No clear path from replay to live mode | Visitor watches the demo but does not know they can try it themselves | Show a persistent "Try it live" CTA during replay. After replay ends, prominently surface the "Enter your API key to start a live session" flow. |
| Mobile layout showing all three panels simultaneously | Panels are too small to be useful; text is unreadable | Stack vertically with conversation primary. Make concept map and journal collapsible or swipeable. The concept map especially needs sufficient screen width to be readable. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **API route:** Works locally but does not handle the case where `stop_reason` is `"max_tokens"` -- verify truncation handling is implemented
- [ ] **API route:** Works locally but times out on Vercel Hobby tier -- verify with actual Vercel deployment, not just `next dev`
- [ ] **System prompt:** Produces good JSON on turn 1, but Socratic behavior degrades by turn 8 -- test with full 10-15 turn conversations, not just 2-3 turns
- [ ] **Concept map:** Renders correctly for the demo session but crashes on live sessions where Claude produces unexpected concept IDs -- verify `parentId` validation handles orphaned references
- [ ] **Session recording:** Records turns correctly but does not handle the case where the user refreshes mid-session -- verify sessions survive page reload (save to localStorage after each turn, not just on completion)
- [ ] **Session export:** Downloads valid JSON but the JSON does not include user messages (only assistant turns) -- verify user turns are captured in the session object
- [ ] **Replay mode:** Plays forward correctly but "Back" button does not remove concepts from the map -- verify concepts are removed when stepping backward
- [ ] **API key input:** Accepts and stores the key but does not validate it works -- verify with a test API call before starting a session (or handle the first-call failure gracefully)
- [ ] **localStorage persistence:** Works in normal browsing but fails silently in Safari private mode (localStorage throws on access) -- wrap all localStorage access in try-catch

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| JSON truncation (max_tokens) | LOW | Increase `max_tokens`, add `stop_reason` check, retry failed turns. No data loss. |
| Socratic drift (Claude lectures) | MEDIUM | Rewrite system prompt with stronger constraints and few-shot examples. Re-record demo session. No architecture change needed. |
| Concept graph inconsistency | MEDIUM | Add client-side validation layer for `parentId` references. Requires touching ConceptMap component and the concept processing pipeline. |
| Vercel timeout | LOW | Switch API route to Edge Runtime (`export const runtime = 'edge'`) or add streaming. Requires route handler refactor but not architecture change. |
| localStorage overflow | LOW | Add storage quota management: check available space, offer cleanup, implement per-session size limits. |
| Prompt-based JSON to structured outputs migration | MEDIUM | Define Zod schema, add `output_config.format` to API call, remove code fence stripping hacks. The response shape stays the same, but API call setup changes. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| JSON truncation from max_tokens | Phase 1: API route | `stop_reason` check is implemented; test with verbose topics that produce long responses |
| Prompt-only JSON enforcement | Phase 1: API route | Structured outputs with Zod schema are used; `output_config.format` is in the API call |
| Socratic drift | Phase 1: System prompt | Run 15-turn test conversations; confidence checks appear at expected intervals |
| Vercel serverless timeout | Phase 1: API route | Use streaming or Edge Runtime; test on Vercel Preview deployment |
| Concept graph inconsistency | Phase 2-3: Concept map | `parentId` validation handles orphaned references; graph stays connected |
| dagre layout recalculation jank | Phase 2-3: Concept map | Node position transitions are animated; no teleporting on new nodes |
| React Flow performance (re-renders) | Phase 2-3: Concept map | Custom nodes are memoized; graph with 20+ nodes does not lag |
| localStorage overflow | Phase 4: Session management | `setItem()` is wrapped in try-catch; storage usage is visible to user |
| API key security in production | Phase 4-5: API key input | Env var fallback is gated by `NODE_ENV === 'development'`; key never logged |
| Replay back-button removes concepts | Phase 5: Replay mode | Stepping backward in replay removes concepts from map, not just from conversation |
| Mobile layout usability | Phase 6: Polish | Three-panel layout collapses to stacked on mobile; concept map is collapsible |

## Sources

- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- HIGH confidence, official source for structured outputs feature, schema limitations, and `output_config.format` parameter
- [Anthropic Handling Stop Reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) -- HIGH confidence, official source for `stop_reason` values and truncation handling
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) -- HIGH confidence, official React Flow documentation on memoization and re-render prevention
- [React Flow Dagre Layout Example](https://reactflow.dev/examples/layout/dagre) -- HIGH confidence, official example showing dagre integration pattern
- [Vercel Serverless Function Duration](https://vercel.com/docs/functions/configuring-functions/duration) -- HIGH confidence, official Vercel docs on timeout limits by plan tier
- [The Socratic Prompt: How to Make a Language Model Stop Guessing and Start Thinking](https://towardsai.net/p/machine-learning/the-socratic-prompt-how-to-make-a-language-model-stop-guessing-and-start-thinking) -- MEDIUM confidence, research article on Socratic prompt engineering
- [LLM-powered tutoring research](https://arxiv.org/html/2507.18882v1) -- MEDIUM confidence, academic survey on AI tutoring system challenges
- [Claude CORS support announcement (Simon Willison)](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) -- MEDIUM confidence, documents the `anthropic-dangerous-direct-browser-access` header option
- [MDN Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- HIGH confidence, official MDN documentation on localStorage limits
- [Handling LLM Output Parsing Errors](https://apxml.com/courses/prompt-engineering-llm-application-development/chapter-7-output-parsing-validation-reliability/handling-parsing-errors) -- MEDIUM confidence, community resource on JSON parsing failure modes

---
*Pitfalls research for: ThreadTutor -- AI-assisted Socratic learning app*
*Researched: 2026-02-14*
