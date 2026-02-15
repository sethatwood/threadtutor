# ThreadTutor: Technical Spec

**Tagline:** Follow the thread. Build the understanding.
**Domain:** threadtutor.com
**Repo:** github.com/sethatwood/threadtutor

## What This Is

A Next.js app that demonstrates AI-assisted Socratic learning. Claude teaches a user about a topic by asking questions, checking understanding, and building a visual concept map in real time.

The premise: reading and watching are passive. The fastest way to learn something is to be asked good questions by someone who knows when to push and when to back up. ThreadTutor explores what that looks like when the "someone" is an LLM with a well-designed system prompt and a UI built around learning rather than chatting.

## Three Experiences

### Replay Mode (default for new visitors)
- No API key required. Loads a pre-recorded session JSON file
- Steps through the conversation one exchange at a time
- Concept map builds progressively as the user clicks "Next"
- This is what visitors to threadtutor.com see first

### Live Mode (any user with an Anthropic API key)
- User enters their Anthropic API key, which is stored in localStorage
- User picks a topic, Claude teaches it via Socratic conversation
- The key is sent per-request to a Next.js API route that proxies calls to Anthropic (required because the Anthropic API does not support direct browser requests due to CORS). The key is never stored server-side.
- Completed sessions are saved to localStorage and can be exported as JSON via a "Download session" button

### Local Development
- Same as live mode, but the API key comes from .env.local instead of localStorage
- Sessions are also written to /public/sessions/ on disk for convenience
- This is how the demo session gets generated before first deployment

All three experiences render through the same UI components. The only difference is where the data comes from and where sessions are stored.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Flow (for the concept map) - https://reactflow.dev
- Anthropic SDK (@anthropic-ai/sdk)
- Vercel for deployment

## Project Structure

```
threadtutor/
  app/
    page.tsx              # Main page, routes between replay and live
    layout.tsx            # Root layout
    api/
      chat/
        route.ts          # API route that proxies Claude calls
  components/
    ConversationPanel.tsx  # Chat display (center)
    ConceptMap.tsx         # React Flow concept map (left)
    LearningJournal.tsx    # Summary panel (right)
    ReplayControls.tsx     # Next/Back/Auto-play for replay mode
    TopicPicker.tsx        # Starting screen for live mode
    ApiKeyInput.tsx        # API key entry with localStorage persistence
    SessionExport.tsx      # Download session as JSON button
  lib/
    system-prompt.ts       # The system prompt for Claude
    types.ts               # TypeScript types for session data
    session-store.ts       # Logic for recording, loading, and exporting sessions
    api-key.ts             # localStorage helpers for API key management
  public/
    sessions/
      demo.json            # The chosen showcase session (committed)
  .env.local               # ANTHROPIC_API_KEY for local dev (not committed)
```

## Session JSON Schema

Every exchange between the user and Claude produces a structured turn. A session is an array of turns.

```typescript
// lib/types.ts

interface Concept {
  id: string;
  label: string;
  parentId: string | null;    // links to parent concept for map edges
  description: string;        // one-sentence explanation
}

interface ConfidenceCheck {
  question: string;            // what Claude asked the user
  userResponse: string;        // what the user said
  assessment: "tracking" | "partial" | "confused";
  feedback: string;            // Claude's response to their answer
}

interface Turn {
  turnNumber: number;
  role: "assistant" | "user";
  displayText: string;         // what shows in the conversation panel
  concepts: Concept[];         // new concepts introduced this turn (empty for user turns)
  confidenceCheck: ConfidenceCheck | null;  // present when Claude checks understanding
  journalEntry: string | null; // summary line for learning journal (assistant turns only)
}

interface Session {
  id: string;
  topic: string;
  createdAt: string;           // ISO timestamp
  turns: Turn[];
}
```

## System Prompt Design

This is the core of the project. Stored in lib/system-prompt.ts as a function that takes the topic as an argument and returns the full system prompt string.

Claude must do several things simultaneously:

1. **Teach progressively.** Start with the most fundamental concept and build upward. Never skip ahead or assume knowledge.

2. **Be Socratic.** Every 2-3 teaching turns, ask the user to explain something back in their own words before continuing. Don't quiz them with multiple choice. Ask them to articulate.

3. **Assess understanding gently.** When the user responds to a check, categorize as "tracking" (they get it), "partial" (close but missing something), or "confused" (need to back up). Respond warmly in all cases.

4. **Extract concepts.** Every assistant response should identify any new concepts introduced, with a short description and a parent concept they connect to. This data drives the concept map.

5. **Maintain a journal thread.** Each assistant turn includes a one-sentence summary of what was covered, suitable for a learning journal.

### Structured Output

The system prompt should instruct Claude to return JSON, not plain text. This is critical for driving the UI.

```
You are a Socratic tutor. You teach by asking questions and building understanding progressively.

Always respond with a JSON object in this exact format:
{
  "displayText": "Your conversational teaching response here. Use markdown for emphasis.",
  "concepts": [
    {
      "id": "unique-slug",
      "label": "Concept Name",
      "parentId": null or "parent-slug",
      "description": "One sentence explanation."
    }
  ],
  "confidenceCheck": null or {
    "question": "The question you're asking the user to check understanding."
  },
  "journalEntry": "One sentence summary of what was covered in this turn."
}

Rules:
- Introduce 1-3 new concepts per turn. Don't overwhelm.
- The first concept in a session always has parentId: null (it's the root).
- Subsequent concepts should reference a parent that has already been introduced.
- Ask a confidence check roughly every 2-3 turns. Not every turn.
- When the user responds to a confidence check, assess their understanding and
  include an "assessment" field in your next response's confidenceCheck:
  { "assessment": "tracking" | "partial" | "confused", "feedback": "Your response." }
- Keep displayText warm, conversational, and free of jargon unless you've already
  defined the jargon in a previous turn.
- Do not use em dashes.
```

The "Do not use em dashes" line is a stylistic choice maintained across the project. Consistency matters.

## API Route

`app/api/chat/route.ts` proxies Claude API calls:

- Receives the conversation history, topic, and API key from the client
- The API key comes from either: the request body (live mode, user-provided key from localStorage) or the server-side ANTHROPIC_API_KEY env var (local development fallback)
- Adds the system prompt
- Calls the Anthropic SDK with model "claude-sonnet-4-5-20250929"
- Parses the JSON response
- Returns structured data to the client
- The user's API key is never logged or stored server-side

Key decisions:
- Use Sonnet, not Opus. Faster, cheaper, more than sufficient for tutoring.
- Set max_tokens to 1024. Tutoring turns should be concise.
- Parse the response carefully. Claude occasionally wraps JSON in markdown code fences. Strip those if present.

## Session Recording

### In production (Vercel)
Sessions are built up in React state during a live conversation. On completion (or when the user clicks "Save"), the session is written to localStorage and the user is offered a "Download session JSON" button.

localStorage key format: `threadtutor:session:{id}`

A "Past sessions" list shows previously saved sessions the user can replay locally.

### In local development
Same as production, but sessions are also written to `/public/sessions/{session-id}.json` via a local-only file write (check for `process.env.NODE_ENV === 'development'`). This makes it easy to generate the demo.json file by simply running sessions locally and picking the best one.

## Replay Logic

In replay mode:
- Load the session JSON on page load
- Start with only the first turn visible
- "Next" button reveals the next turn
- As each assistant turn appears, its concepts animate onto the concept map
- Confidence checks show the user's response and Claude's assessment
- Learning journal grows with each turn

Optional polish: auto-play with a 2-3 second delay between turns, so someone can just watch it unfold.

## Concept Map (React Flow)

The concept map is the visual centerpiece. It's a directed graph where:
- Each node is a concept (labeled with concept.label)
- Edges connect child concepts to their parents
- Nodes appear with a subtle animation as they're introduced
- The root concept (parentId: null) starts centered
- Layout algorithm positions new nodes automatically (dagre layout works well with React Flow)

Node styling:
- Default: a clean rounded rectangle with the concept label
- Hovered: expand to show the one-sentence description
- Confidence-checked concepts could have a subtle color indicator

Keep it simple. The map should feel clean and satisfying to watch grow, not busy or overwhelming.

## UI Layout

Three-panel layout on desktop:

```
+------------------+---------------------------+------------------+
|                  |                           |                  |
|   Concept Map    |      Conversation         | Learning Journal |
|                  |                           |                  |
|   (React Flow)   |   (chat messages with     |  (running list   |
|                  |    confidence checks)      |   of summaries)  |
|                  |                           |                  |
+------------------+---------------------------+------------------+
```

On mobile: stack vertically with conversation on top, concept map below, journal collapsible.

Header: "ThreadTutor" branding with tagline "Follow the thread. Build the understanding." beneath it, topic name, and mode indicator (Live/Replay).

Design direction: clean, minimal, educational. Think more "Notion" than "Discord." Muted colors, good typography, generous whitespace.

## What to Build First (Priority Order)

1. **Scaffold the Next.js project.** TypeScript, Tailwind, basic three-panel layout.
2. **Build the API route and system prompt.** Get Claude responding with structured JSON. Use .env.local key for now.
3. **Build the ConversationPanel.** Render the teaching conversation. Get a live session working end to end.
4. **Add session recording.** Save sessions to React state, write to localStorage on completion, add JSON export button.
5. **Build the ConceptMap.** Wire up React Flow to render concepts from session data.
6. **Build the LearningJournal.** Simple list that grows with each turn.
7. **Build replay mode.** Load demo.json, step through it with controls.
8. **Build the ApiKeyInput.** Let users enter and persist their own key via localStorage. Update the API route to accept keys from the client.
9. **Build the landing experience.** New visitors see replay mode with a clear path to "Try it live" (enter API key).
10. **Run several live sessions.** Pick the best one, commit it as demo.json.
11. **Polish.** Animations, responsive layout, past sessions list, deploy to Vercel.

## What NOT to Build

- User authentication (API key entry is not auth)
- Server-side database
- Multiple topics in one session
- Any backend that stores user keys or session data
- Anything that requires you to pay for other users' API calls

## Demo Topic Suggestion

"How does Bitcoin's proof-of-work actually work?" is the perfect demo topic:
- It's technical enough to show Claude teaching something real
- It's accessible enough that a non-technical visitor can follow along
- It naturally produces a rich concept map (hashing, nonces, difficulty targets, mining, blocks)
- It connects to the author's other project, Bitcoin Echo (bitcoinecho.org)

Run the live session yourself as the learner. Give real answers to the confidence checks. Make mistakes sometimes so the "partial" and "confused" paths get exercised. That authentic interaction is what makes the demo feel real.

## Environment Variables

```
# .env.local (never committed, local development only)
ANTHROPIC_API_KEY=sk-ant-...
```

In production, there is no server-side API key. The API route expects the key from the client request. In local development, the API route falls back to the env var if no key is provided in the request, so you don't have to enter your key through the UI every time.

## Deployment

Vercel. Connect the GitHub repo, it auto-deploys on push. Free tier is fine. Point threadtutor.com to Vercel via DNS (Vercel's docs walk through this, it takes 5 minutes).

The live URL (threadtutor.com) and this GitHub repo serve as the project's public face.
