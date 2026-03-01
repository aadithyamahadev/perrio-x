// Shared types for the PERRIO cognitive engine.
// No UI, no React, no Supabase — pure data shapes only.

export const EXPERIMENT_GROUPS = ["blocked", "static", "adaptive"] as const;
export type ExperimentGroup = (typeof EXPERIMENT_GROUPS)[number];

export type CognitiveState =
  | "PRIME"
  | "ENCODE"
  | "RETRIEVE"
  | "REFERENCE"
  | "OVERLEARN"
  | "COMPLETE";

export interface Concept {
  id: string;
  subject: string;
  name: string;
  explanation: string | null;
}

export interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  hint: string | null;
}

export interface MemoryParam {
  concept_id: string;
  stability: number;
  last_review: string | null;
}
