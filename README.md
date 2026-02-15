# ThreadTutor

Follow the thread. Build the understanding.

An AI-assisted Socratic learning app where Claude teaches any topic through guided questioning while building a visual concept map in real time.

**[Try the live demo](https://threadtutor.com)** - no API key required.

## Why This Exists

Reading is passive. Being asked good questions by someone who knows when to push and when to back up is the fastest way to learn.

ThreadTutor treats the system prompt as the product. Claude doesn't answer questions - it asks them, checks understanding every few turns, and adapts based on whether you're tracking, partially following, or confused. Every response returns structured JSON that drives the entire UI: teaching text, new concepts for the knowledge graph, confidence assessments, and journal entries. No plain-text chat parsing.

## Features

- **Socratic conversation** - Claude teaches through questions, not lectures
- **Live concept map** - Directed graph builds in real time as ideas are introduced (React Flow + dagre)
- **Confidence checks** - Every 2-3 turns, Claude assesses understanding (tracking / partial / confused)
- **Learning journal** - Running one-sentence summaries capture what each turn covered
- **Session persistence** - Sessions survive refresh, can be browsed and exported as JSON
- **Replay mode** - Pre-recorded demo with step-through controls for visitors without API keys
- **BYOK** - Bring your own Anthropic API key. Keys stay in localStorage, never touch the server
- **Responsive** - Three-panel desktop layout, stacked mobile layout with collapsible journal

## Architecture

```
Claude (structured JSON) --> API route (proxy + validation) --> React state --> three-panel UI
```

Each Claude response includes `displayText`, `concepts[]`, `confidenceCheck`, and `journalEntry`. The [system prompt](lib/system-prompt.ts) enforces this structure via Zod-backed structured outputs. The [API route](app/api/chat/route.ts) proxies requests to Anthropic (CORS requirement), validates `stop_reason` to catch truncation, and sanitizes output.

Three modes share the same components:

| Mode | Data source | API key |
|------|-------------|---------|
| **Replay** | `demo.json` | None needed |
| **Live** | Anthropic API | User's key from localStorage |
| **Local dev** | Anthropic API | `ANTHROPIC_API_KEY` from `.env.local` |

## Tech Stack

Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS 4 / React Flow / Anthropic SDK / Zod 4 / Vercel

Model: `claude-sonnet-4-5-20250929` - fast enough for conversational tutoring, structured output support.

## Setup

```bash
npm install
cp .env.local.example .env.local  # Add your Anthropic API key
npm run dev                        # http://localhost:3000
```

```bash
npm run build  # Production build
npm run lint   # Linter
```

## Built with Claude

This project was built end-to-end using [Claude Code](https://claude.ai/code) and the [Get Shit Done](https://github.com/gsd-build/get-shit-done) framework - from requirements gathering and architecture planning through eight phases of implementation. 15 plans, ~40 minutes of execution time, zero manual code edits.

The planning artifacts are in [.planning/](.planning/) if you're curious about the process: requirements derivation, phased roadmap, per-plan execution summaries, and verification reports.
