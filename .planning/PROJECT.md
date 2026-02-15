# ThreadTutor

## What This Is

A Next.js app that demonstrates AI-assisted Socratic learning. Claude teaches a user about any topic by asking questions, checking understanding, and building a visual concept map in real time. Three modes (Replay, Live, Local Dev) share the same UI components -- the only difference is where data comes from and where sessions are stored. The live URL is threadtutor.com.

## Core Value

The system prompt is the product. A well-prompted Claude that teaches through Socratic questioning, with a UI built around learning rather than chatting.

## Requirements

### Validated

- ✓ Replay mode: visitors step through a pre-recorded session with concept map building progressively -- v1.0
- ✓ Live mode: user enters Anthropic API key, picks a topic, Claude teaches via Socratic conversation -- v1.0
- ✓ Structured JSON output from Claude driving all UI (displayText, concepts, confidenceCheck, journalEntry) -- v1.0
- ✓ Concept map (React Flow) showing directed graph of concepts with parent-child relationships -- v1.0
- ✓ Conversation panel rendering teaching exchanges and confidence checks -- v1.0
- ✓ Learning journal panel with one-sentence summaries per assistant turn -- v1.0
- ✓ Confidence checks every 2-3 turns with three-level assessment (tracking/partial/confused) -- v1.0
- ✓ Session recording to localStorage with JSON export -- v1.0
- ✓ API route proxying Claude calls (CORS requirement) -- v1.0
- ✓ API key management via localStorage (live mode) with .env.local fallback (dev mode) -- v1.0
- ✓ Three-panel desktop layout (map | conversation | journal), stacked on mobile -- v1.0
- ✓ Replay controls (Next/Back/Auto-play) -- v1.0
- ✓ Past sessions list from localStorage -- v1.0
- ✓ Demo session: Bitcoin proof-of-work topic committed as demo.json -- v1.0

### Active

(No active requirements -- define next milestone with `/gsd:new-milestone`)

### Out of Scope

- User authentication -- API key entry is not auth; no user accounts needed
- Server-side database -- no backend storage of user data or sessions
- Multiple topics in one session -- one topic per session keeps interaction focused
- Storing user API keys server-side -- keys are per-request only, never stored or logged
- Paying for other users' API calls -- BYOK model
- Streaming text display -- structured JSON must be consumed atomically; loading indicator used instead

## Context

Shipped v1.0 MVP with 2,514 LOC TypeScript across 8 phases (15 plans, 28 feat commits).
Tech stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, React Flow (@xyflow/react), dagre layout, Anthropic SDK (@anthropic-ai/sdk), Zod 4.
Deployed on Vercel. Build passes with zero errors.

The premise: reading and watching are passive. Being asked good questions by someone who knows when to push and when to back up is the fastest way to learn.

Bitcoin proof-of-work is the demo topic: technical enough to showcase real teaching, accessible enough for non-technical visitors, produces a rich concept map (16 turns, 3 confidence checks), and connects to the author's other project (Bitcoin Echo, bitcoinecho.org).

Known tech debt: one orphaned placeholder file (concept-map-placeholder.tsx, replaced in Phase 3). System prompt effectiveness is iterative -- budget time for prompt iteration with real 15+ turn conversations.

## Constraints

- **Tech stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, React Flow, Anthropic SDK (@anthropic-ai/sdk)
- **Model**: claude-sonnet-4-5-20250929 (Sonnet -- faster, cheaper, sufficient for tutoring)
- **Token limit**: max_tokens 2048 per response (structured JSON envelope needs headroom beyond concise displayText)
- **Deployment**: Vercel, auto-deploy on push
- **Style**: No em dashes anywhere in the project. Design direction: clean, minimal, educational ("Notion" not "Discord"). Muted colors, good typography, generous whitespace. Always-dark theme (#1a1a1e background).
- **Security**: User API keys never logged or stored server-side. Sent per-request only.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sonnet over Opus | Faster, cheaper, sufficient for tutoring | ✓ Good -- response quality excellent for teaching |
| JSON structured output (not plain text) | Drives all UI components from single response | ✓ Good -- zodOutputFormat guarantees valid JSON |
| BYOK (bring your own key) model | No server costs for API calls, no auth needed | ✓ Good -- zero infrastructure cost |
| React Flow with dagre layout | Automatic node positioning for concept graphs | ✓ Good -- handles dynamic graph growth well |
| localStorage for sessions (not server DB) | Simplicity, no backend required | ✓ Good -- sufficient for portfolio demo |
| API proxy route (not direct browser calls) | Anthropic API doesn't support CORS | ✓ Good -- required by CORS policy |
| Structured outputs over code fence stripping | Anthropic SDK zodOutputFormat guarantees schema compliance | ✓ Good -- replaced original "strip fences" approach |
| max_tokens 2048 (not 1024) | Structured JSON envelope needs headroom | ✓ Good -- 1024 caused truncation |
| Zod 4 (upgraded from 3) | toJSONSchema compatibility with Anthropic SDK helpers | ✓ Good -- required for zodOutputFormat |
| Always-dark theme (no toggle) | Simpler, consistent design | ✓ Good -- educational content reads well on dark |
| Em dash sanitization at API boundary | Single enforcement point (server-side) | ✓ Good -- catches Claude's em dashes reliably |
| Native details/summary for journal collapse | Zero JS, built-in a11y | ✓ Good -- simpler than state-managed toggle |

---
*Last updated: 2026-02-15 after v1.0 milestone*
