# External Integrations

**Analysis Date:** 2026-02-15

## APIs & External Services

**AI/ML:**
- Anthropic Claude API - Core tutoring functionality
  - SDK/Client: `@anthropic-ai/sdk` 0.74.0
  - Model: `claude-sonnet-4-5-20250929`
  - Auth: User-provided API key (localStorage) or `ANTHROPIC_API_KEY` (dev only)
  - Implementation: API route proxy at `app/api/chat/route.ts`
  - Features used:
    - Structured output with Zod schema (`zodOutputFormat`)
    - System prompts (dynamic per topic)
    - Multi-turn conversations (MessageParam arrays)
    - max_tokens: 2048

## Data Storage

**Databases:**
- None - No database integration

**File Storage:**
- Browser localStorage only
  - Session data: `threadtutor:session:{id}` keys
  - Sessions index: `threadtutor:sessions-index` key
  - API key: `threadtutor:apiKey` key
- Development filesystem writes:
  - API route: `POST /api/sessions` writes to `public/sessions/{id}.json`
  - Gated by `NODE_ENV !== "development"` check
  - Implementation: `app/api/sessions/route.ts` using `node:fs/promises`

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None - No user authentication

**API Key Handling:**
- Client-side storage: `lib/api-key.ts` manages localStorage
- Three modes:
  1. **Replay mode** - No API key required (pre-recorded demo)
  2. **Live mode** - User provides key via UI, stored in localStorage
  3. **Dev mode** - Falls back to `ANTHROPIC_API_KEY` from `.env.local`
- Key sent per-request in POST body to `/api/chat`
- Server never persists keys (per-request Anthropic client instantiation)

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service

**Logs:**
- Server-side console.error for API route failures (`app/api/chat/route.ts`)
- Client-side console.warn for localStorage quota errors (`lib/session-storage.ts`)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from CLAUDE.md and filesystem constraints)

**CI Pipeline:**
- None detected - No GitHub Actions, CircleCI, or other CI config files

## Environment Configuration

**Required env vars:**
- Development only: `ANTHROPIC_API_KEY` (optional, user can provide via UI)
- Production: None (BYOK model, users provide their own API keys)

**Secrets location:**
- Development: `.env.local` (not committed, `.env.local.example` provided)
- Production: User's browser localStorage only

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None - All Claude API calls are synchronous request/response

## CORS & API Proxy

**Pattern:**
- Direct browser-to-Anthropic API calls not supported (CORS)
- Next.js API route at `/api/chat` acts as proxy
  - Receives: messages, topic, apiKey, existingConcepts
  - Forwards to Anthropic with structured output config
  - Returns: Parsed JSON (TurnResponse schema)
- Error handling for specific Anthropic error types:
  - AuthenticationError → 401
  - RateLimitError → 429
  - Generic errors → 500

---

*Integration audit: 2026-02-15*
