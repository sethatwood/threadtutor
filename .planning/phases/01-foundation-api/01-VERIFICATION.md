---
phase: 01-foundation-api
verified: 2026-02-14T21:30:00Z
status: gaps_found
score: 14/15 must-haves verified
gaps:
  - truth: "POST /api/chat uses max_tokens: 2048 per requirement API-06"
    status: failed
    reason: "Route uses max_tokens: 1024 (following CLAUDE.md) but requirement API-06 and Plan 01-02 specify 2048"
    artifacts:
      - path: "app/api/chat/route.ts"
        issue: "Line 70 has max_tokens: 1024 instead of 2048"
    missing:
      - "Update max_tokens from 1024 to 2048 in app/api/chat/route.ts"
      - "Or update CLAUDE.md, REQUIREMENTS.md, and Plan 01-02 to reflect 1024 if that is the correct design decision"
---

# Phase 1: Foundation & API Verification Report

**Phase Goal:** Developer can call the API route and receive schema-valid structured JSON from Claude doing Socratic teaching on any topic

**Verified:** 2026-02-14T21:30:00Z

**Status:** gaps_found

**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Calling the API route with a topic and API key returns valid JSON matching the ThreadTutor schema (displayText, concepts, confidenceCheck, journalEntry fields present) | ? NEEDS_HUMAN | Requires live API call - no .env.local file found for automated testing. Code structure verified: TurnResponseSchema with all required fields exists, zodOutputFormat integration present, route returns JSON.parse(textBlock.text) |
| 2 | Claude asks guiding questions rather than giving direct answers, and confidence checks appear every 2-3 turns in a multi-turn conversation | ? NEEDS_HUMAN | Requires multi-turn conversation testing. System prompt verified to include "You MUST ask a question in every response" and "CONFIDENCE CHECKS (every 2-3 teaching turns)" |
| 3 | Sending a request without an API key in the body falls back to the ANTHROPIC_API_KEY environment variable | ✓ VERIFIED | Code at lines 46-50 in route.ts: `apiKey \|\| (process.env.NODE_ENV === "development" ? process.env.ANTHROPIC_API_KEY : null)` with 401 return if no key |
| 4 | Every response has stop_reason validated (no truncated JSON from hitting the token limit) | ✓ VERIFIED | Lines 81-88 in route.ts: checks `response.stop_reason !== "end_turn"` and returns 422 with descriptive error before parsing JSON |
| 5 | The running concept list is sent back to Claude each turn, and subsequent responses reference consistent parentIds | ✓ VERIFIED | Line 71 in route.ts: `buildSystemPrompt(topic, existingConcepts \|\| [])`. Lines 77-92 in system-prompt.ts: injects existing concept IDs into prompt |

**Score:** 3/5 truths verified programmatically, 2 require human testing with live API

### Required Artifacts (from Plan 01-01 and 01-02 must_haves)

#### Plan 01-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/types.ts` | Zod schemas and TypeScript types | ✓ VERIFIED | Exports ConceptSchema, ConfidenceCheckSchema, TurnResponseSchema (Zod). Exports Concept, ConfidenceCheck, TurnResponse (inferred types). Exports Turn, Session (interfaces). All 8 expected exports present. |
| `lib/system-prompt.ts` | System prompt builder with concept injection | ✓ VERIFIED | Exports buildSystemPrompt function. Takes topic and existingConcepts parameters. Returns string with Socratic rules, concept injection logic at lines 77-92. |
| `package.json` | Dependencies including @anthropic-ai/sdk | ✓ VERIFIED | Contains @anthropic-ai/sdk v0.74.0, zod v4.3.6, next 16.1.6 |

#### Plan 01-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/chat/route.ts` | POST handler with BYOK, structured outputs, error handling | ✓ VERIFIED | 136 lines, exports POST function. All imports present. See detailed verification below. |

### Must-Have Truths Verification (from Plan Frontmatter)

#### Plan 01-01 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | TypeScript compiles without errors and `npm run build` succeeds | ✓ VERIFIED | `npm run build` exited 0. Output shows successful compilation in 1660.7ms, TypeScript passed, 5 routes generated. |
| 2 | TurnResponseSchema defines displayText (string), concepts (array of ConceptSchema), confidenceCheck (nullable ConfidenceCheckSchema), journalEntry (nullable string) | ✓ VERIFIED | Lines 36-41 in types.ts: exact schema match |
| 3 | ConceptSchema defines id, label, parentId (nullable string), description | ✓ VERIFIED | Lines 13-18 in types.ts: exact schema match |
| 4 | ConfidenceCheckSchema defines question (string), assessment (optional enum: tracking/partial/confused), feedback (optional string) | ✓ VERIFIED | Lines 25-29 in types.ts: exact schema match |
| 5 | buildSystemPrompt returns a string containing the topic, Socratic teaching rules, and concept list when provided | ✓ VERIFIED | Line 26: includes topic. Lines 31-35: critical rules including "MUST ask a question". Lines 77-92: concept list injection. |
| 6 | buildSystemPrompt with empty concepts includes first-turn instruction (parentId: null for root) | ✓ VERIFIED | Lines 77-80: `if (existingConcepts.length === 0)` branch includes "MUST have parentId: null" |
| 7 | buildSystemPrompt with existing concepts lists their IDs for parentId reference | ✓ VERIFIED | Lines 81-92: else branch constructs conceptList with IDs and labels, instructs to use exact IDs for parentId |

**Plan 01-01 Score:** 7/7 verified

#### Plan 01-02 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/chat with valid messages, topic, and apiKey returns JSON with displayText, concepts, confidenceCheck, and journalEntry fields | ? NEEDS_HUMAN | No .env.local file for live testing. Code structure verified: zodOutputFormat(TurnResponseSchema) at line 74 guarantees schema compliance when stop_reason is end_turn. Response parsing at lines 93-102 extracts and returns JSON. |
| 2 | POST /api/chat without apiKey in development mode falls back to ANTHROPIC_API_KEY env var and succeeds | ✓ VERIFIED | Lines 46-50: exact pattern matches must-have. Development guard present. |
| 3 | POST /api/chat without apiKey in production mode returns 401 with descriptive error | ✓ VERIFIED | Lines 46-57: when NODE_ENV !== "development" and no apiKey, key resolves to null, triggers 401 with "No API key provided. Please enter your Anthropic API key." |
| 4 | Response with stop_reason 'max_tokens' returns 422 error instead of broken JSON | ✓ VERIFIED | Lines 81-88: checks stop_reason !== "end_turn", returns 422 with message including stop_reason value |
| 5 | Invalid API key returns 401 with user-friendly message | ✓ VERIFIED | Lines 107-115: catches Anthropic.AuthenticationError, returns 401 with "Invalid API key. Please check your Anthropic API key." |
| 6 | Rate-limited requests return 429 with retry guidance | ✓ VERIFIED | Lines 117-125: catches Anthropic.RateLimitError, returns 429 with "Rate limit exceeded. Please wait a moment and try again." |
| 7 | existingConcepts from the request body are passed into buildSystemPrompt for parentId consistency | ✓ VERIFIED | Line 71: `buildSystemPrompt(topic, existingConcepts \|\| [])` - exact pattern |
| 8 | The API route uses Node.js runtime (no Edge Runtime export) | ✓ VERIFIED | No `export const runtime` found in any route file. Grep confirmed. |

**Plan 01-02 Score:** 7/8 verified, 1 requires human testing

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `app/api/chat/route.ts` | `lib/types.ts` | imports TurnResponseSchema | ✓ WIRED | Line 4: `import { TurnResponseSchema } from "@/lib/types"` |
| `app/api/chat/route.ts` | `lib/system-prompt.ts` | imports buildSystemPrompt | ✓ WIRED | Line 5: `import { buildSystemPrompt } from "@/lib/system-prompt"` |
| `app/api/chat/route.ts` | `@anthropic-ai/sdk` | creates per-request Anthropic client | ✓ WIRED | Line 2: import, Line 62: `new Anthropic({ apiKey: key })` - per-request instantiation confirmed |
| `app/api/chat/route.ts` | `@anthropic-ai/sdk/helpers/zod` | converts TurnResponseSchema to output_config format | ✓ WIRED | Line 3: import, Line 74: `format: zodOutputFormat(TurnResponseSchema)` |
| buildSystemPrompt | existingConcepts | injects concept IDs into system prompt | ✓ WIRED | Line 71 in route.ts passes existingConcepts. Lines 77-92 in system-prompt.ts consume and format them into prompt |
| API response | stop_reason validation | checks before parsing JSON | ✓ WIRED | Line 81 checks stop_reason before line 101 parses JSON |

### Requirements Coverage (from REQUIREMENTS.md)

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| API-01: API route proxies Claude calls via Edge Runtime to avoid Vercel Hobby 10s timeout | ✓ SATISFIED (with note) | No Edge Runtime export found (correct per revised plan - Node.js runtime with Vercel Fluid Compute provides 300s timeout, not 10s). Requirement text appears outdated vs implementation decision. |
| API-02: System prompt enforces Socratic teaching | ✓ SATISFIED | "MUST ask a question" constraint present. Confidence check rules present. Progressive concepts present. Warm assessment feedback present. |
| API-03: Claude returns structured JSON via Anthropic structured outputs | ✓ SATISFIED | zodOutputFormat(TurnResponseSchema) at line 74 uses output_config.format |
| API-04: API route accepts user-provided API key from request body (BYOK model) | ✓ SATISFIED | Lines 14, 27: apiKey extracted from request body and used |
| API-05: API route falls back to ANTHROPIC_API_KEY env var when no key in request (local dev) | ✓ SATISFIED | Lines 46-50: exact pattern with NODE_ENV === "development" guard |
| API-06: max_tokens set to 2048 with stop_reason validation on every response | ✗ PARTIAL | **GAP FOUND:** stop_reason validation present (lines 81-88). BUT max_tokens is 1024 (line 70), not 2048. CLAUDE.md line 37 specifies 1024. Plan 01-02 and REQUIREMENTS.md specify 2048. Implementation follows CLAUDE.md but not requirement. |
| API-07: Running concept list passed back to Claude each turn for parentId consistency | ✓ SATISFIED | Line 71 passes existingConcepts to buildSystemPrompt. System prompt injects them (lines 77-92). |

**Requirements Score:** 6/7 satisfied, 1 partial (API-06 max_tokens mismatch)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No anti-patterns found. No TODO/FIXME comments. No stub implementations. No placeholder content. No console.log of sensitive data. |

### Anti-Pattern Checks Performed

✓ No `export const runtime = 'edge'` found in route files
✓ No console.log of apiKey or request body
✓ No em dash characters (U+2014) in system-prompt.ts
✓ No TODO/FIXME/placeholder comments in core files
✓ No empty return statements or stub patterns
✓ stop_reason validation present before JSON parsing
✓ zodOutputFormat used (not manual schema construction)
✓ Specific error types caught (AuthenticationError, RateLimitError)

### Human Verification Required

#### 1. End-to-End Socratic Teaching Flow

**Test:** 
1. Add ANTHROPIC_API_KEY to .env.local
2. Start dev server with `npm run dev`
3. Send POST to http://localhost:3000/api/chat with:
   ```json
   {
     "messages": [{"role": "user", "content": "I want to learn about photosynthesis"}],
     "topic": "photosynthesis"
   }
   ```
4. Verify response contains displayText, concepts array (with parentId: null for first concept), confidenceCheck: null, journalEntry
5. Send follow-up messages and verify:
   - Claude asks questions in every response
   - After 2-3 turns, confidenceCheck appears with a question
   - Subsequent concepts reference existing concept IDs in parentId

**Expected:** 
- First response has one concept with parentId: null
- displayText contains a question
- After 2-3 turns, confidenceCheck.question appears
- Multi-turn conversation maintains concept graph consistency

**Why human:** Requires live API key and multi-turn conversation flow testing. Cannot verify Socratic teaching behavior or concept parentId consistency without actual Claude responses.

#### 2. Error Handling with Invalid/Missing API Key

**Test:**
1. Send request without apiKey field in production mode (NODE_ENV=production)
2. Send request with invalid API key
3. Verify 401 responses with user-friendly messages

**Expected:**
- Missing key: 401 with "No API key provided. Please enter your Anthropic API key."
- Invalid key: 401 with "Invalid API key. Please check your Anthropic API key."

**Why human:** Requires testing with actual invalid key against Anthropic API. Can verify code structure but not runtime behavior.

#### 3. Rate Limit Error Handling

**Test:**
Send rapid requests to trigger rate limiting, verify 429 response with retry guidance.

**Expected:** 429 with "Rate limit exceeded. Please wait a moment and try again."

**Why human:** Requires triggering actual rate limit from Anthropic API. Code structure verified but runtime behavior needs confirmation.

### Gaps Summary

**Critical Gap: max_tokens Mismatch (Requirement API-06)**

The implementation uses `max_tokens: 1024` (line 70 in app/api/chat/route.ts), following the design decision in CLAUDE.md line 37: "max_tokens: 1024 (tutoring turns should be concise)".

However:
- REQUIREMENTS.md API-06 specifies "max_tokens set to 2048"
- Plan 01-02 specifies max_tokens: 2048 in the implementation checklist
- Research documents (PITFALLS.md, RESEARCH.md) warn that 1024 is too tight for complex turns and recommend 2048

This is a documentation inconsistency gap. The code is internally consistent with CLAUDE.md, but CLAUDE.md contradicts the requirements.

**Resolution needed:**
1. Either update app/api/chat/route.ts to use 2048 (aligns with requirements and research)
2. Or update REQUIREMENTS.md, Plan 01-02, and research docs to reflect 1024 as the correct design decision (but this contradicts PITFALLS research that 1024 causes truncation)

**Recommendation:** Update to 2048. The research analysis in PITFALLS.md is sound - 1024 tokens for the entire JSON envelope (including schema overhead, concepts array, confidence check, journal entry) is too tight. The "concise" guidance should apply to displayText content, not the entire structured response.

---

**Overall Assessment:**

Phase 1 infrastructure is complete and well-implemented. All core functionality is present:
- ✓ Zod schemas with all required fields
- ✓ System prompt with Socratic teaching rules and concept injection
- ✓ API route with BYOK, structured outputs, stop_reason validation, and error handling
- ✓ Node.js runtime (300s timeout)
- ✓ No anti-patterns, clean code

**One gap blocks full goal achievement:**
- max_tokens: 1024 vs 2048 mismatch between CLAUDE.md and requirements

**Two items need human verification:**
- Multi-turn Socratic teaching behavior (requires live API)
- Error handling runtime behavior (requires live API and invalid keys)

The gap is minor and easily fixed (one-line change). Code quality is high. Phase 1 is functionally complete pending max_tokens resolution.

---

_Verified: 2026-02-14T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
