# ThreadTutor

Follow the thread. Build the understanding.

An AI-assisted Socratic learning app where Claude teaches any topic through guided questioning while building a visual concept map in real time.

## Setup

```bash
npm install
cp .env.local.example .env.local  # Add your Anthropic API key for local dev
npm run dev
```

## Commands

```bash
npm run dev    # Start dev server (http://localhost:3000)
npm run build  # Production build
npm run lint   # Run linter
```

## How It Works

Claude returns structured JSON each turn (not plain text). Every response includes:

- **displayText**: The teaching content with a question
- **concepts[]**: 1-3 new concepts for the knowledge graph
- **confidenceCheck**: Understanding check every 2-3 turns
- **journalEntry**: One-sentence summary of what was covered

The system prompt in `lib/system-prompt.ts` enforces Socratic teaching. The API route in `app/api/chat/route.ts` proxies requests to Anthropic with BYOK (bring your own key) support.

## API Key

- **Live mode**: User enters their Anthropic API key (stored in localStorage, sent per-request)
- **Local dev**: Falls back to `ANTHROPIC_API_KEY` from `.env.local`
- Keys are never stored or logged server-side
