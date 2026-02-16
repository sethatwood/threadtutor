# Technology Stack

**Analysis Date:** 2026-02-15

## Languages

**Primary:**
- TypeScript 5.x - All application code (frontend and API routes)
- JavaScript (JSX/TSX) - React components via TypeScript's `jsx: "react-jsx"` compiler option

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js 22.22.0 (specified in `.nvmrc`)

**Package Manager:**
- npm 10.9.4
- Lockfile: `package-lock.json` (present, 284KB)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - React renderer

**Testing:**
- Not detected - No test framework configured

**Build/Dev:**
- TypeScript 5.x - Type checking and compilation
- ESLint 9.x - Linting (with `eslint-config-next`)
- Tailwind CSS 4.x - Styling framework
- PostCSS (`@tailwindcss/postcss`) - CSS processing

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` 0.74.0 - Claude API client with structured output support (zodOutputFormat helper)
- `zod` 4.3.6 - Schema validation, required for Anthropic SDK's zodOutputFormat functionality

**Infrastructure:**
- `@xyflow/react` 12.10.0 - Concept map visualization (React Flow library)
- `@dagrejs/dagre` 2.0.4 - Graph layout algorithm for concept map
- `react-markdown` 10.1.0 - Markdown rendering in conversation panel
- `@tailwindcss/typography` 0.5.19 - Prose styling for markdown content

## Configuration

**Environment:**
- `.env.local` - API key for local development only
  - `ANTHROPIC_API_KEY` - Required for development mode
- Production uses BYOK (Bring Your Own Key) via localStorage
- `.env.local.example` provided as template

**Build:**
- `tsconfig.json` - TypeScript configuration
  - Target: ES2017
  - Module resolution: bundler
  - Path alias: `@/*` maps to project root
- `next.config.ts` - Next.js configuration (minimal, default settings)
- `eslint.config.mjs` - ESLint 9 flat config with Next.js presets
- `postcss.config.mjs` - PostCSS with Tailwind plugin

## Platform Requirements

**Development:**
- Node.js 22.x (per `.nvmrc`)
- npm 10.x
- No additional tooling required

**Production:**
- Vercel (deployment target, inferred from project structure)
- Node.js 22.x runtime
- Read-only filesystem (session writes disabled in production)

---

*Stack analysis: 2026-02-15*
