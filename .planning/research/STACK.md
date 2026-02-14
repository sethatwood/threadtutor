# Stack Research

**Domain:** AI-assisted Socratic learning app with real-time concept visualization
**Researched:** 2026-02-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 15.5.12 | Full-stack React framework | The SPEC says "14+" but that is two major versions behind. Next.js 16 (latest) introduced Turbopack as default and Cache Components -- features this project does not need. Next.js 15.x is the battle-tested stable line, has App Router fully mature, and avoids adopting 16's breaking changes (Turbopack default, new caching model) on a greenfield project that just needs simple API routes and SSR. Stick with 15.x for maximum community support and Vercel deployment stability. | HIGH |
| React | 19.x | UI library | Next.js 15.x supports React 18.2+ or React 19. Use React 19 -- it ships with `use()` hook, improved Suspense, and is the current default when scaffolding with `create-next-app`. | HIGH |
| TypeScript | 5.9.x | Type safety | Current stable. Next.js 15.x has first-class TypeScript support with zero config. Use strict mode. | HIGH |
| Tailwind CSS | 4.1.x | Utility-first CSS | v4 is a ground-up rewrite with CSS-first configuration (no more `tailwind.config.js`), 5x faster builds, and built-in container queries. The new `@import "tailwindcss"` pattern is cleaner. Do NOT use Tailwind v3 -- it is legacy. | HIGH |
| @xyflow/react (React Flow) | 12.10.x | Concept map visualization | The definitive React library for node-based UIs. v12 is the current major version under the `@xyflow/react` package name (the old `reactflow` npm package is deprecated at v11). Supports React 17+, so fully compatible with React 19. | HIGH |
| @anthropic-ai/sdk | 0.74.x | Claude API client | Official Anthropic TypeScript SDK. Supports streaming via `messages.stream()` and non-streaming via `messages.create()`. Use this directly -- no need for AI SDK wrappers since we only target Claude. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dagrejs/dagre | 2.0.x | Directed graph layout algorithm | Required for auto-positioning concept map nodes. Dagre is the simplest layout engine for tree-like directed graphs, which is exactly what the concept map produces (parent-child relationships). React Flow's docs explicitly recommend dagre for tree layouts. | HIGH |
| @tailwindcss/postcss | 4.1.x | PostCSS plugin for Tailwind v4 | Required for Tailwind v4 integration with Next.js. Replaces the old `tailwindcss` PostCSS preset. Install alongside `postcss`. | HIGH |
| postcss | 8.x | CSS processing | Peer dependency of @tailwindcss/postcss. Next.js already includes PostCSS but the explicit install ensures version compatibility with Tailwind v4. | HIGH |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| eslint | 10.x | Linting | Current major version. Use with `eslint-config-next` for Next.js-specific rules. | HIGH |
| eslint-config-next | 15.x | Next.js ESLint rules | Matches your Next.js major version. Includes React and accessibility rules. | HIGH |
| @types/node | 22.x+ | Node.js type definitions | Use a version matching your Node.js runtime. Next.js 15 requires Node.js 18.18+. | MEDIUM |

### Anthropic Model Configuration

| Setting | Value | Rationale | Confidence |
|---------|-------|-----------|------------|
| Model ID | `claude-sonnet-4-5-20250929` | Latest Sonnet. Best balance of speed, cost, and intelligence for tutoring. $3/MTok input, $15/MTok output. The SPEC already specifies this correctly. | HIGH |
| Model alias | `claude-sonnet-4-5` | Use the alias in code for readability. Points to the same model. | HIGH |
| max_tokens | 1024 | Per SPEC. Tutoring turns should be concise. JSON structured output with 1-3 concepts fits well within this limit. | HIGH |

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@15.5.x | react@19.x, react-dom@19.x | Next.js 15 peerDeps: `react ^18.2.0 or ^19.0.0` |
| @xyflow/react@12.x | react@>=17 | Broadly compatible. No conflict with React 19. |
| tailwindcss@4.1.x | @tailwindcss/postcss@4.1.x | Must use matching versions. Both at 4.1.18 currently. |
| @anthropic-ai/sdk@0.74.x | Node.js 18+ | Server-side only (API routes). Never import in client components. |
| @dagrejs/dagre@2.0.x | Any | Pure JS library, no framework dependencies. |

## Installation

```bash
# Core framework
npx create-next-app@15 threadtutor --typescript --tailwind --eslint --app --src-dir --no-import-alias

# If scaffolding manually or adding to existing:
npm install next@15 react@19 react-dom@19

# AI SDK
npm install @anthropic-ai/sdk

# Concept map
npm install @xyflow/react @dagrejs/dagre

# Tailwind v4 (if not set up by create-next-app)
npm install tailwindcss @tailwindcss/postcss postcss

# Dev dependencies
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next
```

## Configuration Files

### postcss.config.mjs (Tailwind v4)
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### app/globals.css (Tailwind v4)
```css
@import "tailwindcss";
```

Note: Tailwind v4 uses CSS-first configuration. Theme customization happens in CSS with `@theme` directives, not in a JavaScript config file. This is a major change from v3.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Next.js 16 | If you need Turbopack as default bundler for large-scale builds. For this project's size, 15.x is sufficient and more battle-tested. |
| Next.js 15 | Next.js 14 | Never for a new project in 2026. 14.x is two major versions behind and missing important App Router improvements. |
| @anthropic-ai/sdk | Vercel AI SDK (@ai-sdk/anthropic) | If you need multi-provider support (OpenAI, Google, etc.) or built-in streaming UI helpers. ThreadTutor is Claude-only with structured JSON output, so the official SDK is simpler and more direct. |
| @xyflow/react | vis.js, cytoscape.js | If you need a general-purpose graph visualization library. React Flow is purpose-built for React, has better DX, and the concept map is a directed tree -- exactly what React Flow excels at. |
| @dagrejs/dagre | elkjs | If you need sub-flow support, edge routing, or highly configurable layouts. Dagre is dramatically simpler for a tree of concepts. ELK is overkill. |
| @dagrejs/dagre | d3-hierarchy | If your graph is strictly a single-root tree AND you want alternative layouts (treemap, sunburst). Dagre handles the directed graph case more naturally and does not require single-root. |
| Tailwind CSS v4 | Tailwind CSS v3 | Never for a new project. v3 is legacy. v4 is faster, simpler, and actively maintained. |
| Tailwind CSS | CSS Modules | If you prefer scoped CSS without utility classes. Tailwind is the SPEC's choice and suits rapid prototyping. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `reactflow` (npm package) | Deprecated. The v11 package is no longer actively maintained. | `@xyflow/react` (v12) |
| `dagre` (npm package) | Original dagre is unmaintained (last publish 2018). | `@dagrejs/dagre` (maintained fork, v2.0.4) |
| Vercel AI SDK for this project | Adds unnecessary abstraction. The `useChat` hook expects text streaming, but ThreadTutor needs structured JSON responses parsed per-turn. The SDK's streaming helpers would fight the architecture. | `@anthropic-ai/sdk` directly |
| `tailwind.config.js` | Tailwind v4 uses CSS-first configuration. A JS config file is the v3 pattern and will not work with v4's PostCSS plugin. | `@theme` directive in CSS |
| Server-side database (Prisma, Drizzle, etc.) | Per SPEC: no server-side database. Sessions live in localStorage and JSON files. Adding a DB adds hosting cost, complexity, and auth requirements. | localStorage + JSON export |
| NextAuth / Auth.js | Per SPEC: no user auth. BYOK model means the API key IS the "auth." Adding auth creates user management burden with zero value. | localStorage API key storage |
| D3.js (full library) | Massive bundle size for what amounts to graph layout. If you need layout, use the specific sub-package (@dagrejs/dagre). | @dagrejs/dagre for layout only |
| Socket.io / WebSockets | Overkill for single-user tutoring sessions. Next.js API routes with standard fetch (or streaming via SSE) are sufficient. | Standard fetch or Anthropic SDK streaming |

## Stack Patterns by Variant

**If you want non-streaming responses (simpler, recommended for MVP):**
- Use `anthropic.messages.create()` in the API route
- Parse the full JSON response, validate structure, return to client
- Simpler error handling, easier to debug malformed JSON
- Recommended starting point per the SPEC

**If you add streaming later (post-MVP polish):**
- Use `anthropic.messages.stream()` in the API route
- Return a ReadableStream from the Next.js route handler
- Accumulate chunks on the client, parse JSON only after stream completes
- Caution: streaming and structured JSON output are inherently in tension -- you cannot parse partial JSON. Stream for perceived performance, but parse after completion.

**If deploying to Vercel (default per SPEC):**
- API routes run as serverless functions (default)
- No special configuration needed for the Anthropic SDK
- Vercel's free tier supports the API route pattern
- The user's API key flows through the serverless function but is never stored

**If running locally for demo generation:**
- Use `.env.local` for ANTHROPIC_API_KEY
- API route falls back to env var when no client key provided
- Write session JSON to `/public/sessions/` for demo capture

## Node.js Version

Use Node.js 20 LTS or 22 LTS. Next.js 15 requires Node.js 18.18+, but 20 LTS is the recommended baseline for 2026 projects (active LTS until April 2026, maintenance until April 2027).

## Sources

- npm registry (direct queries via `npm view`) -- versions verified 2026-02-14: HIGH confidence
  - next@15.5.12, react@19.2.4, @xyflow/react@12.10.0, @anthropic-ai/sdk@0.74.0
  - tailwindcss@4.1.18, @tailwindcss/postcss@4.1.18, typescript@5.9.3
  - @dagrejs/dagre@2.0.4, postcss@8.5.6, eslint@10.0.0
- [Anthropic Models Overview](https://platform.claude.com/docs/en/docs/about-claude/models) -- model IDs and pricing verified: HIGH confidence
- [Tailwind CSS v4 Next.js Guide](https://tailwindcss.com/docs/guides/nextjs) -- installation steps verified: HIGH confidence
- [React Flow Layouting Overview](https://reactflow.dev/learn/layouting/layouting) -- dagre recommendation verified: HIGH confidence
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- version comparison for 15 vs 16 decision: HIGH confidence
- [Anthropic SDK GitHub](https://github.com/anthropics/anthropic-sdk-typescript) -- streaming API patterns: HIGH confidence
- [React Flow What's New](https://reactflow.dev/whats-new) -- v12 package migration from `reactflow` to `@xyflow/react`: HIGH confidence

---
*Stack research for: ThreadTutor - AI-assisted Socratic learning app*
*Researched: 2026-02-14*
