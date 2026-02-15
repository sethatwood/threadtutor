# Phase 1: Foundation & API - Research

**Researched:** 2026-02-14
**Domain:** Anthropic API structured outputs, Next.js API routes, Socratic system prompt design
**Confidence:** HIGH

## Summary

Phase 1 delivers the teaching engine: a system prompt that enforces Socratic pedagogy, a Zod-defined JSON schema for structured responses, and a Next.js API route that proxies Claude calls with BYOK support. The structured outputs feature (`output_config.format` with `json_schema`) is GA on Claude Sonnet 4.5 and guarantees schema-valid JSON through constrained decoding, eliminating the need for manual JSON parsing, code fence stripping, or retry loops. The Anthropic TypeScript SDK officially supports Vercel Edge Runtime, but with Vercel Fluid Compute (enabled by default since April 2025) giving Hobby plan functions a 300-second default timeout, Edge Runtime is no longer required to avoid the old 10-second serverless limit. Use Node.js runtime for simplicity and full Node.js API access.

The system prompt is the core product. Research on Socratic tutoring with LLMs confirms that maintaining question-asking behavior across multi-turn conversations requires structural enforcement (not just instruction), explicit negative constraints, and turn-counting logic. Budget significant iteration time in Phase 1 for prompt testing with 15+ turn conversations.

**Primary recommendation:** Use `output_config.format` with `zodOutputFormat()` for guaranteed schema compliance, Node.js runtime (not Edge) with Fluid Compute's 300s timeout, and invest heavily in system prompt iteration with multi-turn test conversations.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.74.x | Claude API client | Official Anthropic TypeScript SDK. Supports structured outputs via `output_config.format`, Zod integration via `zodOutputFormat()`, and `client.messages.parse()` for typed responses. Officially supports Vercel Edge Runtime, Node.js 20+, Deno, Bun, and Cloudflare Workers. | HIGH |
| zod | 3.25.x (see note) | Schema definition and validation | Required peer dependency of `@anthropic-ai/sdk` for `zodOutputFormat()`. The SDK accepts `"zod": "^3.25.0 || ^4.0.0"`. Use Zod 3 (`zod@^3.25.0`) for stability -- Zod 4 (current: 4.3.6) works but is a recent major release with breaking changes in error APIs and defaults behavior. Using Zod 3 avoids risk of incompatibilities with SDK helpers that may not be fully tested against Zod 4 edge cases. | HIGH |

**Note on Zod versioning:** Zod 4 is the current default (`npm install zod` gives 4.3.6). To install Zod 3: use `npm install zod@3` which will resolve to 3.25.x. The Anthropic SDK's `zodOutputFormat()` accepts both Zod 3 and Zod 4 schemas per its peer dependency declaration. If you want to use Zod 4, import from `"zod"` directly (root export is Zod 4 as of zod@4.0.0). If issues arise, Zod 4 provides `"zod/v3"` as a permanent backward-compatible subpath.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next | 15.5.x | API route handler framework | Already chosen. The `app/api/chat/route.ts` Route Handler pattern is the standard for App Router API routes. |
| typescript | 5.9.x | Type safety | SDK requires TypeScript >= 4.9. Use latest stable 5.9.x for best DX. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `output_config.format` (structured outputs) | Prompt-only JSON enforcement + code fence stripping | Prompt-only approach is fragile: occasional code fences, schema drift, missing fields. Structured outputs guarantee valid JSON via constrained decoding. No reason to use prompt-only for new development. |
| Node.js runtime | Edge Runtime (`export const runtime = 'edge'`) | Edge has 25s initial timeout but limited Node.js API support and a 1MB code size limit on Hobby. With Fluid Compute giving Node.js functions 300s timeout on all plans, Edge adds complexity for no benefit. |
| `zodOutputFormat()` helper | Raw JSON Schema object | Writing JSON Schema by hand is verbose and error-prone. The Zod helper provides type inference, validation, and cleaner code. Raw JSON Schema is fine if you want zero Zod dependency. |

**Installation:**
```bash
npm install @anthropic-ai/sdk zod@3
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
app/
  api/
    chat/
      route.ts          # API route: proxies Claude calls, validates responses
lib/
  types.ts              # Zod schemas + TypeScript types for Turn/Concept/etc.
  system-prompt.ts      # buildSystemPrompt(topic, existingConcepts) function
```

### Pattern 1: Structured Outputs with zodOutputFormat

**What:** Define the Turn response schema as a Zod object, convert it via `zodOutputFormat()`, and pass it to `output_config.format`. The response is guaranteed to match the schema through constrained decoding at the token level. Use `client.messages.parse()` for automatic Zod parsing and typed `parsed_output`.

**When to use:** Every API call in this project. All Claude responses must be structured JSON.

**Example:**
```typescript
// lib/types.ts
// Source: https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs
import { z } from "zod";

export const ConceptSchema = z.object({
  id: z.string(),
  label: z.string(),
  parentId: z.string().nullable(),
  description: z.string(),
});

export const ConfidenceCheckSchema = z.object({
  question: z.string(),
  assessment: z.enum(["tracking", "partial", "confused"]).optional(),
  feedback: z.string().optional(),
});

export const TurnResponseSchema = z.object({
  displayText: z.string(),
  concepts: z.array(ConceptSchema),
  confidenceCheck: ConfidenceCheckSchema.nullable(),
  journalEntry: z.string().nullable(),
});

export type TurnResponse = z.infer<typeof TurnResponseSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
```

```typescript
// app/api/chat/route.ts
// Source: https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TurnResponseSchema } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/system-prompt";

export async function POST(request: Request) {
  const { messages, topic, apiKey, existingConcepts } = await request.json();

  // BYOK: use client key, fall back to env var in dev only
  const key = apiKey || (process.env.NODE_ENV === "development"
    ? process.env.ANTHROPIC_API_KEY
    : null);

  if (!key) {
    return Response.json(
      { error: "No API key provided" },
      { status: 401 }
    );
  }

  const client = new Anthropic({ apiKey: key });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: buildSystemPrompt(topic, existingConcepts),
    messages,
    output_config: {
      format: zodOutputFormat(TurnResponseSchema),
    },
  });

  // Validate stop_reason before parsing
  if (response.stop_reason === "max_tokens") {
    return Response.json(
      { error: "Response truncated. Please try a shorter message." },
      { status: 422 }
    );
  }

  const turnData = JSON.parse(response.content[0].text);
  return Response.json(turnData);
}
```

### Pattern 2: System Prompt with Concept List Injection

**What:** The system prompt is a function that accepts the topic AND the running list of previously introduced concepts. Each turn, the client sends the current concept list to the API route, which injects it into the system prompt. This gives Claude exact knowledge of which concept IDs exist, preventing orphaned parentId references.

**When to use:** Every multi-turn API call. The concept list grows each turn.

**Example:**
```typescript
// lib/system-prompt.ts
import { Concept } from "./types";

export function buildSystemPrompt(
  topic: string,
  existingConcepts: Concept[] = []
): string {
  const conceptList = existingConcepts.length > 0
    ? `\n\nPreviously introduced concepts (use these exact IDs for parentId references):\n${existingConcepts.map(c => `- id: "${c.id}", label: "${c.label}"`).join("\n")}`
    : "";

  return `You are a Socratic tutor teaching about: ${topic}

Your role is to teach through questions, not answers. Guide the student to discover concepts themselves.

Teaching approach:
- Introduce a concept in 1-2 sentences, then immediately ask the student to reason about it
- Ask one question per turn. Wait for their response before continuing
- Use analogies and real-world examples liberally
- When the student answers correctly, briefly acknowledge then extend with a deeper insight
- Never use em dashes

Confidence checks (every 2-3 teaching turns):
- Vary between explain-back ("In your own words, why does X matter?") and apply-it ("If Y happened, what would change?")
- If the student seems confused: identify which specific part confused them and break just that part into smaller steps
- If the student is partially correct: acknowledge what they got right, then fill the gap directly
- Tone is collaborative, not evaluative

Concept extraction:
- Introduce 1-3 new concepts per turn
- First concept in a session has parentId: null (root node)
- Subsequent concepts reference an existing concept as parent (the most logically relevant one)
- Use human-readable slug IDs (e.g., "proof-of-work", "hash-function")
- Descriptions are contextual explanations, not dictionary definitions

Opening turn:
- Brief framing (one sentence) then a question to gauge familiarity
- Introduce exactly one concept: the root topic node
- Include a journal entry summarizing the turn

Every assistant turn must include a journalEntry (one sentence summary).${conceptList}`;
}
```

### Pattern 3: stop_reason Validation

**What:** Check `response.stop_reason` on every API response. With structured outputs, `stop_reason === "max_tokens"` means the JSON is incomplete and will not match the schema. Only parse when `stop_reason === "end_turn"`.

**When to use:** Every API response handler.

**Source:** https://platform.claude.com/docs/en/docs/build-with-claude/handling-stop-reasons

**Possible stop_reason values:**
| Value | Meaning | Action |
|-------|---------|--------|
| `end_turn` | Claude finished naturally | Parse and return the response |
| `max_tokens` | Hit the token limit, JSON likely incomplete | Return error, suggest retry |
| `stop_sequence` | Custom stop sequence hit | Not used in this project |
| `tool_use` | Claude wants to call a tool | Not used in this project |
| `refusal` | Safety refusal | Return appropriate error message |

### Anti-Patterns to Avoid

- **Prompt-only JSON enforcement:** Never rely solely on system prompt instructions for JSON formatting. Use `output_config.format` for guaranteed schema compliance. The SPEC's mention of "strip markdown code fences" is unnecessary with structured outputs.
- **Instantiating Anthropic client per-request at module level:** Create the client inside the POST handler with the per-request API key. Do not create a singleton client (the API key changes per request in BYOK mode).
- **Logging request bodies:** The request body contains the user's API key. Never `console.log` the full request. Destructure the key out before any logging.
- **Using Edge Runtime unnecessarily:** With Fluid Compute (300s timeout on Hobby), Edge Runtime adds constraints (limited Node.js APIs, 1MB code size) for no timeout benefit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema enforcement | Regex/string parsing to strip code fences, JSON.parse retry loops | `output_config.format` with `zodOutputFormat()` | Constrained decoding guarantees schema compliance at the token level. Zero parsing errors. |
| Zod-to-JSON-Schema conversion | Manual JSON Schema object definition | `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` | Automatic conversion, handles edge cases (nullable, optional, enums), strips unsupported constraints and adds them to descriptions. |
| API key validation | Custom regex validation for key format | Check for `sk-ant-` prefix client-side, let Anthropic API return 401 for invalid keys | Anthropic may change key formats. Validate loosely, handle API errors gracefully. |
| stop_reason handling | Assuming every response is complete | Explicit `stop_reason` check before parsing | Even with structured outputs, `max_tokens` produces incomplete JSON. Schema guarantee only holds when `stop_reason === "end_turn"`. |

**Key insight:** Structured outputs with `output_config.format` eliminate an entire class of bugs (parsing errors, schema drift, code fence handling) that would otherwise require significant error handling code.

## Common Pitfalls

### Pitfall 1: Socratic Drift (Claude Lectures Instead of Questioning)

**What goes wrong:** Over multi-turn conversations, Claude gradually shifts from Socratic questioning to lecturing. By turn 8-10, it is giving paragraph-long explanations without asking questions.

**Why it happens:** LLMs default to comprehensive answers. Each turn of explanation reinforces this pattern. The system prompt's Socratic instructions become proportionally less influential as conversation history grows.

**How to avoid:**
1. Include explicit negative constraints in the system prompt: "You MUST ask a question in every response. NEVER provide a complete explanation without asking the student to reason first."
2. Add turn-counting guidance: "Ask a confidence check every 2-3 turns. You are currently on turn N."
3. Include the running concept list each turn (reinforces the structured teaching arc).
4. Test with 15+ turn conversations during development. Turns 1-3 will always look good. The drift appears later.

**Warning signs:** Three or more consecutive turns without a `confidenceCheck`. `displayText` growing progressively longer across turns.

### Pitfall 2: max_tokens Truncation with Structured Outputs

**What goes wrong:** `max_tokens: 2048` is hit, producing incomplete JSON. Even with structured outputs, `stop_reason: "max_tokens"` means the schema guarantee does not hold.

**Why it happens:** A teaching turn with a long `displayText`, 2-3 concepts with descriptions, a confidence check, and a journal entry can exceed 2048 tokens. JSON structural overhead (keys, braces, quotes) adds approximately 30-40% token cost beyond the content itself.

**How to avoid:**
1. Set `max_tokens: 2048` (per requirements, up from SPEC's 1024).
2. Check `stop_reason` on every response. If `"max_tokens"`, return error to client.
3. Instruct Claude in the system prompt to keep `displayText` under 150 words.
4. Monitor actual response token usage in Phase 1 testing to calibrate.

**Warning signs:** `stop_reason: "max_tokens"` appearing in responses. Longer, more complex topics hitting this more often.

### Pitfall 3: Grammar Compilation Latency on First Request

**What goes wrong:** The first API call with a new JSON schema takes 1-3 seconds longer than subsequent calls, leading to an unexpectedly slow first turn.

**Why it happens:** Structured outputs compile a grammar artifact from the JSON schema. This is cached for 24 hours. First request incurs compilation cost. Cache is invalidated if the schema structure changes or if the set of tools changes.

**How to avoid:**
1. Accept this as expected behavior. The first turn of a session will be slightly slower.
2. Keep the schema stable. Changing the Zod schema invalidates the cache.
3. Show a loading indicator on the client side (Phase 2 concern, but design for it now).

**Warning signs:** First API call of a new session consistently 1-3s slower than subsequent calls.

### Pitfall 4: Concept ID Inconsistency Across Turns

**What goes wrong:** Claude uses different slug formats for the same concept across turns (e.g., "proof-of-work" in turn 1, "pow" in turn 3), creating orphaned graph nodes.

**Why it happens:** Without the explicit concept list in context, Claude regenerates IDs from scratch each turn. It does not have persistent memory of exact string IDs it previously used.

**How to avoid:**
1. Pass the full running concept list (id + label) in the system prompt each turn (Pattern 2 above).
2. Validate `parentId` references client-side before adding to the graph (Phase 3, but the API should return data that enables this).
3. Instruct Claude to use the exact IDs from the provided concept list when referencing parents.

**Warning signs:** `parentId` values that don't match any existing concept `id`. Multiple concepts with similar but not identical IDs.

### Pitfall 5: BYOK Key Exposure in Production

**What goes wrong:** The `ANTHROPIC_API_KEY` env var fallback (intended for local dev) remains active in production, allowing anyone to use the deployed API route without providing their own key.

**Why it happens:** The fallback logic `apiKey || process.env.ANTHROPIC_API_KEY` does not check the environment. In production on Vercel, if `ANTHROPIC_API_KEY` is set (e.g., for testing), all requests use it.

**How to avoid:**
1. Gate the env var fallback: `apiKey || (process.env.NODE_ENV === "development" ? process.env.ANTHROPIC_API_KEY : null)`.
2. Do not set `ANTHROPIC_API_KEY` in Vercel production environment variables.
3. Return a clear 401 error if no key is provided and no fallback is available.

**Warning signs:** API calls succeeding in production without a client-provided key.

## Code Examples

### Complete API Route with All Safeguards

```typescript
// app/api/chat/route.ts
// Source: Anthropic structured outputs docs + Vercel Route Handler docs
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TurnResponseSchema } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/system-prompt";

export async function POST(request: Request) {
  let body: {
    messages: Anthropic.MessageParam[];
    topic: string;
    apiKey?: string;
    existingConcepts?: Array<{ id: string; label: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { messages, topic, apiKey, existingConcepts = [] } = body;

  if (!messages || !topic) {
    return Response.json(
      { error: "Missing required fields: messages, topic" },
      { status: 400 }
    );
  }

  // BYOK with dev-only fallback
  const key = apiKey || (process.env.NODE_ENV === "development"
    ? process.env.ANTHROPIC_API_KEY
    : null);

  if (!key) {
    return Response.json(
      { error: "No API key provided. Please enter your Anthropic API key." },
      { status: 401 }
    );
  }

  try {
    const client = new Anthropic({ apiKey: key });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: buildSystemPrompt(topic, existingConcepts),
      messages,
      output_config: {
        format: zodOutputFormat(TurnResponseSchema),
      },
    });

    // Validate stop_reason
    if (response.stop_reason !== "end_turn") {
      return Response.json(
        {
          error: `Unexpected stop reason: ${response.stop_reason}`,
          stop_reason: response.stop_reason,
        },
        { status: 422 }
      );
    }

    const turnData = JSON.parse(response.content[0].text);
    return Response.json(turnData);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json(
        { error: "Invalid API key. Please check your Anthropic API key." },
        { status: 401 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // Do NOT log the full error (may contain API key in request details)
    console.error("API route error:", error instanceof Error ? error.message : "Unknown error");

    return Response.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
```

### Zod Schema with All ThreadTutor Fields

```typescript
// lib/types.ts
// Source: SPEC.md session schema + Anthropic structured outputs Zod pattern
import { z } from "zod";

// --- Claude response schemas (used with output_config.format) ---

export const ConceptSchema = z.object({
  id: z.string(),
  label: z.string(),
  parentId: z.string().nullable(),
  description: z.string(),
});

export const ConfidenceCheckSchema = z.object({
  question: z.string(),
  assessment: z.enum(["tracking", "partial", "confused"]).optional(),
  feedback: z.string().optional(),
});

export const TurnResponseSchema = z.object({
  displayText: z.string(),
  concepts: z.array(ConceptSchema),
  confidenceCheck: ConfidenceCheckSchema.nullable(),
  journalEntry: z.string().nullable(),
});

// --- Application types (extend Claude's response with session metadata) ---

export type Concept = z.infer<typeof ConceptSchema>;
export type ConfidenceCheck = z.infer<typeof ConfidenceCheckSchema>;
export type TurnResponse = z.infer<typeof TurnResponseSchema>;

export interface Turn {
  turnNumber: number;
  role: "assistant" | "user";
  displayText: string;
  concepts: Concept[];
  confidenceCheck: ConfidenceCheck | null;
  journalEntry: string | null;
}

export interface Session {
  id: string;
  topic: string;
  createdAt: string;
  turns: Turn[];
}
```

### System Prompt with Concept Injection

```typescript
// lib/system-prompt.ts
// Source: Phase context decisions + Socratic tutoring research

interface ConceptRef {
  id: string;
  label: string;
}

export function buildSystemPrompt(
  topic: string,
  existingConcepts: ConceptRef[] = []
): string {
  const conceptListSection = existingConcepts.length > 0
    ? `

Previously introduced concepts (reference these exact IDs when setting parentId):
${existingConcepts.map(c => `- "${c.id}" (${c.label})`).join("\n")}

When introducing new concepts, set their parentId to the most logically relevant concept from this list.`
    : `

This is the first turn. The first concept you introduce must have parentId: null (it is the root node).`;

  return `You are a Socratic tutor. Your topic is: ${topic}

CRITICAL RULES:
- You MUST ask a question in every response. Never give a complete explanation without asking the student to reason about it first.
- Introduce a concept in 1-2 sentences, then immediately ask a question.
- Do not use em dashes anywhere in your response.
- Keep displayText under 150 words. Be concise.
- Every response must include a journalEntry (one sentence summarizing what was covered).

TEACHING STYLE:
- Friendly but intellectually challenging. Expect effort from the learner.
- Use analogies and real-world examples liberally to make abstract concepts tangible.
- On correct answers: brief acknowledgment, then extend with a deeper insight or connection.

CONFIDENCE CHECKS (every 2-3 teaching turns):
- Vary between explain-back ("In your own words, why does X matter?") and apply-it ("If Y happened, what would change?").
- When the student is confused: identify which specific part confused them and break just that part into smaller steps. Do not re-explain everything from scratch.
- When the student is partially correct: acknowledge what they got right, fill the gap directly ("You're on the right track. The piece you're missing is..."), then continue.
- Feedback tone is collaborative, not evaluative. "Yes, and here's why that matters..." not "Correct" or "Wrong."
- When assessing, include both the "assessment" field and a "feedback" field in your confidenceCheck.

CONCEPT EXTRACTION:
- Introduce 1-3 new concepts per turn. Do not overwhelm.
- Use human-readable slug IDs (e.g., "proof-of-work", "hash-function", "nonce").
- Descriptions should be contextual explanations, not dictionary definitions. Relate them to the conversation.
- Target 15-20 concepts over a full session.

OPENING TURN:
- One sentence of framing, then immediately ask a question to gauge existing familiarity.
- Introduce exactly one concept: the root topic node.${conceptListSection}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prompt-only JSON enforcement + code fence stripping | `output_config.format` structured outputs with constrained decoding | GA on Claude Sonnet 4.5, late 2025 | Eliminates parsing errors, retry loops, and code fence handling. Zero custom parsing code needed. |
| `output_format` parameter (beta) | `output_config.format` parameter (GA) | Migrated from beta, late 2025 | `output_format` is deprecated but still works temporarily. Use `output_config` for new code. |
| Vercel Hobby tier 10s serverless timeout | Fluid Compute: 300s default timeout on all plans | April 2025 (Fluid Compute enabled by default for new projects) | The 10-second timeout problem that motivated Edge Runtime is solved. Node.js runtime is now preferred by Vercel ("We recommend migrating from edge to Node.js"). |
| Edge Runtime for timeout workaround | Node.js runtime with Fluid Compute | April 2025 | Edge Runtime has limitations (subset of Node.js APIs, 1MB code size on Hobby). Node.js is simpler and more capable. |
| `zod@3.x` only | `zod@^3.25.0 \|\| ^4.0.0` | Zod 4.0.0 released July 2025 | Anthropic SDK supports both. Use Zod 3 for stability in a new project; Zod 4 if you want the latest features. |

**Deprecated/outdated:**
- `output_format` parameter: Replaced by `output_config.format`. Still works temporarily but will be removed in a future API version.
- `betaZodTool` from `@anthropic-ai/sdk/helpers/beta/zod`: This is for tool use, not structured outputs. For JSON response schemas, use `zodOutputFormat` from `@anthropic-ai/sdk/helpers/zod`.
- Edge Runtime as a timeout solution: Vercel now recommends Node.js with Fluid Compute. The Edge Runtime docs carry a warning banner: "We recommend migrating from edge to Node.js for improved performance and reliability."

## Open Questions

1. **Zod 3 vs Zod 4 for zodOutputFormat**
   - What we know: The SDK's peer dep accepts both `^3.25.0` and `^4.0.0`. The `zodOutputFormat()` helper imports from `"zod"` generically.
   - What's unclear: Whether `zodOutputFormat()` has been thoroughly tested with Zod 4's changed internals (error APIs, default handling). The SDK may rely on Zod 3 internals for schema-to-JSON-Schema conversion.
   - Recommendation: Start with `zod@3` (`npm install zod@3`). If Zod 4 features are needed later, test the `zodOutputFormat()` output carefully.

2. **Optimal max_tokens value**
   - What we know: The SPEC says 1024, requirements say 2048. A teaching turn with 150-word displayText, 2-3 concepts, a confidence check, and a journal entry likely uses 400-800 tokens of content plus 200-300 tokens of JSON structure.
   - What's unclear: Whether 2048 is generous enough for edge cases or whether some turns will still truncate.
   - Recommendation: Set to 2048 per requirements. Log `response.usage.output_tokens` during Phase 1 testing to calibrate. The `stop_reason` check will catch any truncation.

3. **System prompt interaction with structured outputs**
   - What we know: Structured outputs inject an additional system prompt explaining the expected format. This is in addition to our custom system prompt. The injected prompt costs extra input tokens.
   - What's unclear: Whether the injected format instructions ever conflict with our Socratic teaching instructions (e.g., could the format prompt override our "ask a question" constraint?).
   - Recommendation: Test early. If the structured output system prompt interferes with Socratic behavior, adjust our system prompt wording to be more explicit.

4. **ConfidenceCheck schema: optional fields behavior with structured outputs**
   - What we know: The ConfidenceCheck has `assessment` and `feedback` as optional fields. On the first occurrence (when Claude asks a check), these should be absent. On the follow-up (when Claude evaluates the student's answer), they should be present. Structured outputs support optional fields.
   - What's unclear: Whether Claude will correctly distinguish between "asking a check" (no assessment) and "evaluating a check" (with assessment) within the same schema, or whether separate schemas per state would be cleaner.
   - Recommendation: Start with the single unified schema. If Claude inconsistently fills optional fields, consider splitting into two schemas or using an explicit `type` discriminator field.

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs) - `output_config.format`, JSON schema, Zod integration, schema limitations, grammar compilation, feature compatibility
- [Anthropic Handling Stop Reasons](https://platform.claude.com/docs/en/docs/build-with-claude/handling-stop-reasons) - All `stop_reason` values: `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal`, `model_context_window_exceeded`
- [Anthropic TypeScript SDK Docs](https://platform.claude.com/docs/en/api/sdks/typescript) - Runtime support (Node.js 20+, Deno, Bun, Cloudflare Workers, Vercel Edge Runtime), `zodOutputFormat` helper, timeouts, retries
- [Anthropic SDK helpers.md](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md) - `zodOutputFormat` import path (`@anthropic-ai/sdk/helpers/zod`), `client.messages.parse()` usage
- [Next.js Route Handlers Docs](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - App Router Route Handler pattern, POST method, request body parsing, segment config options
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) - `runtime`, `maxDuration` configuration options
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) - Enabled by default since April 2025, 300s default/max for Hobby, 800s max for Pro/Enterprise
- [Vercel Function Duration](https://vercel.com/docs/functions/configuring-functions/duration) - Fluid Compute duration limits by plan: Hobby 300s/300s, Pro 300s/800s, Enterprise 300s/800s
- [Vercel Edge Runtime](https://vercel.com/docs/functions/runtimes/edge-runtime) - 25s initial response timeout, 300s streaming, 1MB Hobby code limit, warning to migrate to Node.js
- npm registry (verified 2026-02-14): `@anthropic-ai/sdk@0.74.0` peerDependencies `{ zod: "^3.25.0 || ^4.0.0" }`, `zod@4.3.6` current

### Secondary (MEDIUM confidence)
- [Anthropic Socratic Sage Prompt](https://platform.claude.com/docs/en/resources/prompt-library/socratic-sage) - Official Anthropic example of Socratic prompting pattern
- [Zod v4 Versioning Strategy](https://zod.dev/v4/versioning) - Subpath versioning, `"zod/v3"` permanent backward-compatible export, library author guidance
- Socratic tutoring research (multiple sources): MWPTutor finite-state tutor pattern, SocraticAI structured constraints, SPL dynamic prompt templates

### Tertiary (LOW confidence)
- [Anthropic SDK Edge Runtime streaming issue](https://github.com/anthropics/anthropic-sdk-typescript/issues/292) - Historical issue with streaming in Edge environments (2024). May be resolved in current SDK version. Needs validation if Edge Runtime is used.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm registry, official docs, and Anthropic SDK documentation
- Architecture: HIGH - Patterns from official Anthropic structured outputs docs, verified API parameter names and behavior
- Pitfalls: HIGH - stop_reason behavior verified in official docs, Socratic drift documented in academic research, Fluid Compute timeout change verified in Vercel docs

**Key correction from prior research:** The prior PITFALLS.md and ARCHITECTURE.md reference the "Vercel Hobby 10s timeout" as a critical concern requiring Edge Runtime. This is outdated. With Fluid Compute (enabled by default since April 2025), Hobby plan functions have a 300-second default timeout. Edge Runtime is no longer needed for timeout avoidance and is actively discouraged by Vercel. Requirement API-01 ("Edge Runtime to avoid Vercel Hobby 10s timeout") should be reconsidered: Node.js runtime with Fluid Compute's 300s timeout is the recommended approach.

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days - stable domain, well-documented APIs)
