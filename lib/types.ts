import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod Schemas (used with Claude's structured output / response parsing)
// ---------------------------------------------------------------------------

/**
 * A single concept node in the knowledge graph.
 * - id: human-readable slug (e.g. "photosynthesis", "light-reactions")
 * - parentId: null for the root concept, otherwise references an existing id
 * - description: contextual explanation, not a dictionary definition
 */
export const ConceptSchema = z.object({
  id: z.string(),
  label: z.string(),
  parentId: z.string().nullable(),
  description: z.string(),
});

/**
 * Optional confidence check embedded in a tutoring turn.
 * Claude asks a question every 2-3 turns to gauge understanding.
 * - assessment and feedback are filled in after the student responds
 */
export const ConfidenceCheckSchema = z.object({
  question: z.string(),
  assessment: z.enum(["tracking", "partial", "confused"]).optional(),
  feedback: z.string().optional(),
});

/**
 * The complete structured response Claude returns each turn.
 * Every response includes displayText, concepts, and journalEntry.
 * confidenceCheck is included every 2-3 teaching turns.
 */
export const TurnResponseSchema = z.object({
  displayText: z.string(),
  concepts: z.array(ConceptSchema),
  confidenceCheck: ConfidenceCheckSchema.nullable(),
  journalEntry: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// TypeScript Types (inferred from Zod schemas)
// ---------------------------------------------------------------------------

/** A single concept node in the knowledge graph. */
export type Concept = z.infer<typeof ConceptSchema>;

/** A confidence check with question and optional assessment. */
export type ConfidenceCheck = z.infer<typeof ConfidenceCheckSchema>;

/** Claude's structured response for a single tutoring turn. */
export type TurnResponse = z.infer<typeof TurnResponseSchema>;

// ---------------------------------------------------------------------------
// Application Types (session and conversation structure)
// ---------------------------------------------------------------------------

/** A single turn in the tutoring conversation. */
export interface Turn {
  turnNumber: number;
  role: "assistant" | "user";
  displayText: string;
  concepts: Concept[];
  confidenceCheck: ConfidenceCheck | null;
  journalEntry: string | null;
}

/** A complete tutoring session. */
export interface Session {
  id: string;
  topic: string;
  createdAt: string;
  turns: Turn[];
}
