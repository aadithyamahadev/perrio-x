/**
 * services/aiTopicSuggestionsService.ts
 *
 * AI-powered topic recommendations shown after a session ends.
 *
 * Architecture rule:
 *   - Called ONLY from perrioService.
 *   - Never imported by the core engine or UI components directly.
 *
 * Returns up to three suggestions, each mapped to an existing concept ID,
 * so the UI can deep-link without free-form hallucinations.
 */

import type { Language } from "./language";

export interface TopicSuggestion {
  conceptId: string;
  title: string;
  subject: string;
  reason: string;
}

export interface TopicSuggestionParams {
  tenantId: string;
  studentId: string;
  currentConcept: { id: string; name: string; subject: string } | null;
  availableConcepts: { id: string; name: string; subject: string }[];
  language: Language;
}

// ---------------------------------------------------------------------------
// Public API (OpenAI removed)
// ---------------------------------------------------------------------------

/**
 * Previously this function called OpenAI's chat completions API.
 * External API usage has been removed, so this now always returns null.
 */
export async function getAiTopicSuggestions(
  _params: TopicSuggestionParams
): Promise<TopicSuggestion[] | null> {
  console.warn(
    "aiTopicSuggestionsService: external AI integration disabled — returning no suggestions."
  );
  return null;
}

