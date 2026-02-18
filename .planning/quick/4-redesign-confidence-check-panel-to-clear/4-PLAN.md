---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/confidence-check.tsx
autonomous: false
must_haves:
  truths:
    - "The confidence check card has a visible heading that tells the user what this card is and why it appeared"
    - "Assessment results use plain language instead of jargon (not 'tracking', 'partial', 'confused')"
    - "Feedback text has a label so the user knows it is the tutor's response to their answer"
    - "The pending state (question with textarea) clearly communicates that the tutor is checking in"
    - "Component works identically in both live mode (interactive) and replay mode (read-only)"
  artifacts:
    - path: "components/confidence-check.tsx"
      provides: "Redesigned confidence check card with heading, human-friendly labels, and clear structure"
  key_links:
    - from: "components/confidence-check.tsx"
      to: "components/conversation-panel.tsx"
      via: "ConfidenceCheckCard import, same props interface"
      pattern: "ConfidenceCheckCard"
    - from: "components/confidence-check.tsx"
      to: "components/replay-conversation.tsx"
      via: "ConfidenceCheckCard import, same props interface"
      pattern: "ConfidenceCheckCard"
---

<objective>
Redesign the confidence check card so users immediately understand what it is, why it appeared, and what the assessment result means.

Purpose: The current card has no heading, uses internal jargon ("TRACKING", "PARTIAL", "CONFUSED"), and provides no context. First-time users have no way to know this is a check-in or why it matters. This plan fixes all five clarity problems identified in the planning context.

Output: A redesigned `components/confidence-check.tsx` that communicates purpose through visual hierarchy and plain language, with no changes to the component's props interface or external behavior.
</objective>

<execution_context>
@/Users/yayseth/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yayseth/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/confidence-check.tsx
@components/conversation-panel.tsx
@components/replay-conversation.tsx
@lib/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add heading, replace jargon labels, and structure feedback</name>
  <files>components/confidence-check.tsx</files>
  <action>
Redesign the ConfidenceCheckCard component's rendered output. Do NOT change the props interface (ConfidenceCheckCardProps stays identical), do NOT change the state/handler logic (useState, useRef, handleChange, handleSubmit, handleKeyDown all stay). Only change what is inside the return JSX.

Changes to make:

1. ADD A HEADING for both states of the card:
   - Pending state (no assessment yet): Show a small heading like "Check your understanding" above the question. Use `text-xs font-semibold uppercase tracking-wide` in the indigo accent color. This tells the user: this is a deliberate pause to see where you are.
   - Assessed state (has assessment): Show a small heading like "Understanding check" above the result. Same styling.
   - The heading should be the SAME text in both states. Use a single heading at the top of the card (before the question), not conditional headings. Something like "Check your understanding" works for both states. Keep it simple: one `<p>` element at the top of the card container, always visible.

2. REPLACE JARGON ASSESSMENT LABELS with plain, collaborative language:
   - "tracking" -> "On track" (keeps the green style)
   - "partial" -> "Getting there" (keeps the yellow style)
   - "confused" -> "Let's revisit" (keeps the red style, but collaborative not judgmental)
   Create a `assessmentLabels` map alongside the existing `assessmentStyles` map. Keep the internal assessment values ("tracking", "partial", "confused") as keys since those come from the API. Only the DISPLAYED text changes.

3. ADD A LABEL ABOVE FEEDBACK TEXT:
   - When `check.feedback` exists, show a small "Tutor's note:" label (or similar) in muted text above the feedback paragraph. This makes it clear the text is the tutor's response to the student's answer, not random commentary.

4. KEEP the existing container styling (indigo theme, left border accent, padding). Keep the existing textarea and button styling for the pending input state. Keep the existing badge shape (rounded-full pill). The visual identity should stay; only the information hierarchy changes.

5. NO EM DASHES anywhere in the component (project convention).

The tone should be collaborative per the system prompt: "You are thinking together." The labels should feel like a study partner checking in, not a grading system.
  </action>
  <verify>
Run `npm run build` to confirm no TypeScript or build errors. Visually inspect the component by reviewing the code to confirm:
- A heading element exists before the question text
- The assessmentLabels map has entries for all three levels
- The badge renders the human-friendly label (not the raw assessment value)
- Feedback text has a preceding label
- No em dashes in any string
- Props interface is unchanged (ConfidenceCheckCardProps has same shape)
  </verify>
  <done>
The confidence check card has a visible heading in both pending and assessed states. Assessment badges show "On track" / "Getting there" / "Let's revisit" instead of "TRACKING" / "PARTIAL" / "CONFUSED". Feedback text has a "Tutor's note" label. The component builds without errors and the props interface is unchanged so conversation-panel.tsx and replay-conversation.tsx continue to work without modification.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Verify redesigned confidence check card</name>
  <files>components/confidence-check.tsx</files>
  <action>Human verification of the redesigned component in the running app.</action>
  <what-built>Redesigned confidence check card with heading, human-friendly assessment labels, and labeled feedback text. The card now clearly communicates: (1) what it is (a check-in), (2) what the assessment means (plain language), and (3) what the feedback is (tutor's response).</what-built>
  <how-to-verify>
    1. Run `npm run dev` and open http://localhost:3000
    2. Start a replay session (no API key needed) and advance through turns until a confidence check appears
    3. Verify the assessed confidence check card shows:
       - A small heading (like "Check your understanding") above the question
       - A badge with plain language ("On track", "Getting there", or "Let's revisit") instead of jargon
       - A "Tutor's note" label above the feedback text
    4. If you have an API key configured, start a live session and advance until a pending confidence check appears:
       - Verify the pending state shows a heading (like "Check your understanding") above the question
       - Verify the textarea input still works and submitting an answer works
    5. Confirm the overall visual feel still matches the indigo-themed design (left border, background tint, pill badge)
  </how-to-verify>
  <verify>User visually confirms the card in the running application</verify>
  <done>User approves the redesigned confidence check card</done>
  <resume-signal>Type "approved" or describe any issues with the labels, heading, or layout</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` passes with no errors
- `npm run lint` passes with no new warnings
- The ConfidenceCheckCard props interface is identical to before (no breaking changes)
- Both conversation-panel.tsx and replay-conversation.tsx render confidence checks without modification
</verification>

<success_criteria>
A user seeing the confidence check card for the first time can immediately understand: (1) this is a check-in on their understanding, (2) what their assessment level means in plain language, and (3) that the feedback text is the tutor's response to their answer.
</success_criteria>

<output>
After completion, create `.planning/quick/4-redesign-confidence-check-panel-to-clear/4-SUMMARY.md`
</output>
