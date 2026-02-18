import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TurnResponseSchema } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/system-prompt";

/**
 * Replace em dashes (U+2014) and en dashes (U+2013) with hyphens.
 * Belt-and-suspenders: the system prompt prohibits em dashes, but
 * Claude may occasionally produce them anyway.
 */
function sanitizeEmDashes(text: string): string {
  return text
    .replace(/\u2014/g, " - ")  // em dash -> space-hyphen-space
    .replace(/\u2013/g, "-");   // en dash -> hyphen
}

export async function POST(request: Request) {
  // ---------------------------------------------------------------------------
  // 1. Parse request body (defensive)
  // ---------------------------------------------------------------------------
  let body: {
    messages?: Anthropic.MessageParam[];
    topic?: string;
    apiKey?: string;
    existingConcepts?: Array<{ id: string; label: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const { messages, topic, apiKey, existingConcepts } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Missing or empty 'messages' field." },
      { status: 400 }
    );
  }

  if (!topic || typeof topic !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'topic' field." },
      { status: 400 }
    );
  }

  // ---------------------------------------------------------------------------
  // 2. API key resolution (BYOK with server-side fallback)
  // ---------------------------------------------------------------------------
  const key = apiKey || process.env.ANTHROPIC_API_KEY || null;

  if (!key) {
    return NextResponse.json(
      { error: "No API key provided. Please enter your Anthropic API key." },
      { status: 401 }
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Anthropic client (per-request, BYOK)
  // ---------------------------------------------------------------------------
  const client = new Anthropic({ apiKey: key });

  // ---------------------------------------------------------------------------
  // 4. Call Claude with structured output
  // ---------------------------------------------------------------------------
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: buildSystemPrompt(topic, existingConcepts || []),
      messages,
      output_config: {
        format: zodOutputFormat(TurnResponseSchema),
      },
    });

    // -------------------------------------------------------------------------
    // 5. Validate stop_reason before parsing
    // -------------------------------------------------------------------------
    if (response.stop_reason !== "end_turn") {
      return NextResponse.json(
        {
          error: `Response incomplete (stop_reason: ${response.stop_reason}). The model may need a higher token limit.`,
        },
        { status: 422 }
      );
    }

    // -------------------------------------------------------------------------
    // 6. Parse and return structured response
    // -------------------------------------------------------------------------
    const textBlock = response.content[0];
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from Claude." },
        { status: 500 }
      );
    }

    const turnData = JSON.parse(textBlock.text);

    // Sanitize em/en dashes from all text fields
    if (turnData.displayText) {
      turnData.displayText = sanitizeEmDashes(turnData.displayText);
    }
    if (turnData.journalEntry) {
      turnData.journalEntry = sanitizeEmDashes(turnData.journalEntry);
    }
    if (turnData.confidenceCheck) {
      if (turnData.confidenceCheck.question) {
        turnData.confidenceCheck.question = sanitizeEmDashes(turnData.confidenceCheck.question);
      }
      if (turnData.confidenceCheck.feedback) {
        turnData.confidenceCheck.feedback = sanitizeEmDashes(turnData.confidenceCheck.feedback);
      }
    }
    if (turnData.concepts) {
      for (const concept of turnData.concepts) {
        if (concept.label) {
          concept.label = sanitizeEmDashes(concept.label);
        }
        if (concept.description) {
          concept.description = sanitizeEmDashes(concept.description);
        }
      }
    }

    return NextResponse.json(turnData);
  } catch (error: unknown) {
    // -------------------------------------------------------------------------
    // 7. Error handling with specific Anthropic error types
    // -------------------------------------------------------------------------
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        {
          error:
            "Invalid API key. Please check your Anthropic API key.",
        },
        { status: 401 }
      );
    }

    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error:", message);

    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
