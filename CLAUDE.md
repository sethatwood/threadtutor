# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThreadTutor is a Next.js app demonstrating AI-assisted Socratic learning. Claude teaches users about a topic by asking questions, checking understanding, and building a visual concept map in real time. Three modes share the same UI components: Replay (pre-recorded demo, no API key), Live (user provides Anthropic API key via localStorage), and Local Development (key from .env.local).

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- Zod 4 (required by @anthropic-ai/sdk's zodOutputFormat helper for toJSONSchema)
- React Flow (concept map visualization) with dagre layout
- Anthropic SDK (@anthropic-ai/sdk), model: claude-sonnet-4-6
- Deployed on Vercel

## Build & Dev Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter
```

## Architecture

Three-panel layout: ConceptMap (left, React Flow) | ConversationPanel (center) | LearningJournal (right). Mobile stacks vertically.

**Data flow:** Claude returns structured JSON per turn (not plain text). Each response includes `displayText`, `concepts[]`, `confidenceCheck`, and `journalEntry`. The system prompt in `lib/system-prompt.ts` enforces this JSON schema. The API route (`app/api/chat/route.ts`) proxies requests to Anthropic since the API doesn't support direct browser requests (CORS).

**Session data:** Sessions are arrays of `Turn` objects. In production, stored in localStorage (`threadtutor:session:{id}`). In development, also written to `/public/sessions/` on disk. Core types are in `lib/types.ts`.

**API key handling:** In live mode, the user's key comes from localStorage and is sent per-request. In local dev, the API route falls back to `ANTHROPIC_API_KEY` from `.env.local`. Keys are never stored or logged server-side.

## Key Design Decisions

- Sonnet over Opus: faster, cheaper, sufficient for tutoring
- max_tokens: 2048 (structured JSON needs headroom for schema overhead beyond concise displayText)
- Structured outputs (output_config.format with zodOutputFormat) guarantee valid JSON; no code fence stripping needed
- Confidence checks use three-level assessment: "tracking", "partial", "confused"
- Concepts form a directed graph: first concept has `parentId: null` (root), subsequent concepts reference existing parents
- No em dashes anywhere (stylistic choice maintained across the project)
- No server-side database, no user auth, no multi-topic sessions
