/**
 * services/language.ts
 *
 * Language types and question localisation logic.
 *
 * The core engine is completely unaware of language —
 * it always receives a plain Question with English-equivalent fields.
 * Localisation is applied here, in the service layer, before the engine
 * ever sees the data.
 *
 * Architecture:  UI → Service ( localise ) → Engine (pure, language-agnostic)
 *                Service → DB  (question_translations table)
 */

import { supabase } from "@/lib/supabase";
import type { Question } from "@/core/types";
import { applyHardcodedTranslations } from "@/services/localTranslations";

// ---------------------------------------------------------------------------
// Language type — service / UI concern only, never enters the engine
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = ["en", "hi", "te"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
};

// ---------------------------------------------------------------------------
// DB row shape for question_translations
// ---------------------------------------------------------------------------

interface TranslationRow {
  question_id: string;
  language: string;
  question_text: string;
  hint: string | null;
}

// ---------------------------------------------------------------------------
// Batch localisation
// ---------------------------------------------------------------------------

/**
 * Localises an array of questions for the given language and tenant.
 *
 * - Fetches all matching translations in a single query.
 * - Replaces `question_text` and `hint` on each Question with the
 *   translated values.
 * - Falls back to the original English values when no translation exists.
 *
 * The engine receives the returned array and never learns the language.
 */
export async function localizeQuestions(
  tenantId: string,
  questions: Question[],
  language: Language
): Promise<Question[]> {
  // English is the source-of-truth stored in the `questions` table itself —
  // no secondary lookup needed.
  if (language === "en" || questions.length === 0) return questions;

  const ids = questions.map((q) => q.id);

  const { data, error } = await supabase
    .from("question_translations")
    .select("question_id, language, question_text, hint")
    .eq("tenant_id", tenantId)
    .eq("language", language)
    .in("question_id", ids);

  if (error || !data || data.length === 0) {
    // No translations available — silently fall back to English
    if (error) {
      console.warn(
        `localizeQuestions: translation fetch failed for lang=${language}:`,
        error.message
      );
    }
    // Try hardcoded in-repo translations as a fallback so UI can still
    // present translated text (useful in local/dev without DB seeds).
    return applyHardcodedTranslations(questions, language);
  }

  // Build a lookup map  question_id → translation row
  const translationMap = new Map<string, TranslationRow>();
  for (const row of data as TranslationRow[]) {
    translationMap.set(row.question_id, row);
  }

  // Merge translations into question objects (creates new objects, never mutates)
  const merged = questions.map((q) => {
    const t = translationMap.get(q.id);
    if (!t) return q; // fallback: no translation for this specific question
    return {
      ...q,
      question_text: t.question_text,
      hint: t.hint ?? q.hint, // keep English hint if translated one is null
    };
  });

  // If some questions still lack translations in the DB, apply
  // hardcoded in-repo translations keyed by English question text.
  return applyHardcodedTranslations(merged, language);
}
