# Testing Patterns

**Analysis Date:** 2026-02-15

## Test Framework

**Runner:**
- Not detected (no jest.config.*, vitest.config.*, or test framework in package.json)

**Assertion Library:**
- Not applicable (no testing framework configured)

**Run Commands:**
```bash
npm run lint              # Run ESLint (only linting, no tests)
```

**Status:**
- No test suite present in the codebase
- No test files in `src/`, `components/`, `lib/`, or `app/` directories
- No dedicated `__tests__/`, `tests/`, or `test/` directories

## Test File Organization

**Location:**
- Not applicable (no tests exist)

**Naming:**
- Expected pattern (if tests were added): `*.test.ts` or `*.spec.ts`
- Co-located tests (alongside source) or separate `__tests__/` directory would align with Next.js conventions

**Structure:**
```
Not applicable (no test structure exists)
```

## Test Structure

**Suite Organization:**
- Not applicable (no tests exist)

**Patterns:**
- No established testing patterns observed

## Mocking

**Framework:**
- Not applicable (no testing framework)

**Patterns:**
- No mocking patterns established

**What to Mock:**
- Recommendations for future implementation:
  - Mock Anthropic SDK client in `app/api/chat/route.ts` tests
  - Mock `localStorage` for `lib/session-storage.ts` tests
  - Mock `fetch` for `useConversation` hook tests
  - Mock React Flow for `components/concept-map.tsx` tests

**What NOT to Mock:**
- Recommendations for future implementation:
  - Pure utility functions (e.g., `buildSystemPrompt`, `collectAllConcepts`, `buildGraphElements`)
  - Zod schema validation
  - Type definitions

## Fixtures and Factories

**Test Data:**
- No fixtures or factories exist

**Location:**
- Not applicable

**Recommendations for future implementation:**
```typescript
// Example factory for Turn objects
function createTurn(overrides?: Partial<Turn>): Turn {
  return {
    turnNumber: 1,
    role: "assistant",
    displayText: "Test message",
    concepts: [],
    confidenceCheck: null,
    journalEntry: null,
    ...overrides,
  };
}

// Example fixture for Session
const mockSession: Session = {
  id: "test-session-123",
  topic: "Photosynthesis",
  createdAt: "2026-02-15T00:00:00.000Z",
  turns: [createTurn()],
};
```

## Coverage

**Requirements:**
- None enforced (no testing infrastructure)

**View Coverage:**
```bash
# Not available (no test framework)
```

## Test Types

**Unit Tests:**
- Not implemented

**Integration Tests:**
- Not implemented

**E2E Tests:**
- Not implemented

## Common Patterns

**Async Testing:**
- Not applicable (no test framework)

**Error Testing:**
- Not applicable (no test framework)

## Testing Gaps

**Critical areas lacking test coverage:**

1. **API Routes:**
   - `app/api/chat/route.ts`: Claude API integration, error handling, request validation
   - `app/api/sessions/route.ts`: File system writes in development mode

2. **State Management:**
   - `lib/use-conversation.ts`: Reducer logic, message building, concept collection
   - `lib/use-replay-state.ts`: Replay timing, turn progression

3. **Data Layer:**
   - `lib/session-storage.ts`: localStorage operations, quota handling, JSON parsing
   - `lib/graph-layout.ts`: Dagre layout, orphaned node handling, edge generation

4. **Core Business Logic:**
   - `lib/system-prompt.ts`: Prompt generation, concept list injection
   - `lib/types.ts`: Zod schema validation (especially structured output parsing)

5. **UI Components:**
   - `components/concept-map.tsx`: Viewport centering, fullscreen modal, node clicks
   - `components/conversation-panel.tsx`: Auto-scroll, textarea auto-growth, input validation
   - `components/confidence-check.tsx`: Answer submission, state transitions

## Recommendations

**Framework Selection:**
- Vitest recommended (fast, TypeScript-first, Vite-compatible)
- Alternative: Jest with ts-jest

**Priority Test Areas:**
1. Unit tests for pure functions in `lib/`:
   - `buildSystemPrompt` (various concept counts)
   - `collectAllConcepts` (deduplication, turn ordering)
   - `buildGraphElements` (orphaned nodes, invalid parentIds)
   - `sanitizeEmDashes` helper in chat route

2. Integration tests for API routes:
   - Request validation (missing fields, invalid types)
   - Error handling (auth errors, rate limits, malformed JSON)
   - Structured output parsing

3. Hook tests with @testing-library/react-hooks:
   - `useConversation` state transitions
   - `useReplayState` timer behavior

4. Component tests with @testing-library/react:
   - Message rendering
   - Confidence check input/submission
   - Error banner display/dismiss

**Test Setup Pattern:**
```typescript
// Example test file structure (recommended)
import { describe, it, expect, vi } from 'vitest';
import { buildSystemPrompt } from '@/lib/system-prompt';

describe('buildSystemPrompt', () => {
  it('should generate opening prompt with no existing concepts', () => {
    const prompt = buildSystemPrompt('Photosynthesis', []);
    expect(prompt).toContain('Your topic is: Photosynthesis');
    expect(prompt).toContain('No concepts exist yet');
    expect(prompt).toContain('parentId: null');
  });

  it('should inject existing concepts into prompt', () => {
    const concepts = [
      { id: 'photosynthesis', label: 'Photosynthesis' },
      { id: 'chloroplast', label: 'Chloroplast' },
    ];
    const prompt = buildSystemPrompt('Photosynthesis', concepts);
    expect(prompt).toContain('"photosynthesis" (Photosynthesis)');
    expect(prompt).toContain('"chloroplast" (Chloroplast)');
  });
});
```

---

*Testing analysis: 2026-02-15*
