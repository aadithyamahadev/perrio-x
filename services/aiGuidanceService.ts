/**
 * services/aiGuidanceService.ts
 *
 * AI-powered guidance generator for the REFERENCE state.
 *
 * Architecture rule:
 *   - Called ONLY from perrioService, during REFERENCE state processing.
 *   - NEVER imported by the core engine.
 *   - NEVER imported by UI components directly.
 *
 * Accepts the student's wrong answer and the correct answer, then returns a
 * structured 3-step correction explanation in the student's chosen language.
 *
 * Requires: OPENAI_API_KEY in environment variables.
 * Gracefully returns null when the key is absent or the call fails, so the
 * calling code can fall back to a static reference explanation.
 */

import type { Language } from "./language";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Exactly three ordered correction steps. */
export interface CorrectionStep {
  heading: string;
  body: string;
}

/** Structured guidance object returned by getAiGuidance(). */
export interface AiGuidance {
  explanation: string;
  steps: [CorrectionStep, CorrectionStep, CorrectionStep];
  language: Language;
}

/** Parameters accepted by getAiGuidance(). */
export interface AiGuidanceParams {
  conceptName: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  language: Language;
}

// ---------------------------------------------------------------------------
// Public API (OpenAI removed)
// ---------------------------------------------------------------------------

/**
 * Previously this function called OpenAI's chat completions API.
 * External API usage has been removed, so this now always returns null.
 *
 * Callers should fall back to the concept's static explanation.
 */
export async function getAiGuidance(
  _params: AiGuidanceParams
): Promise<AiGuidance | null> {
  console.warn(
    "aiGuidanceService: external AI integration disabled — returning null guidance."
  );
  return null;
}

