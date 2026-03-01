/**
 * PERRIO cognitive state machine — pure transition logic.
 *
 * No React, no Supabase, no side effects.
 * All I/O (persistence, event logging) is the responsibility of the caller.
 */

import { recallProbability, updateStability } from "./memory";
import type { CognitiveState, Concept, Question } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const OVERLEARN_THRESHOLD = 3.0;
export const MIN_CORRECT_BEFORE_OVERLEARN = 5;

// ---------------------------------------------------------------------------
// Transition validation map
// ---------------------------------------------------------------------------

/**
 * Exhaustive map of every valid (from → to) pair in the PERRIO state machine.
 *
 * Rules:
 *   PRIME      → ENCODE
 *   ENCODE     → RETRIEVE
 *   RETRIEVE   → REFERENCE | OVERLEARN | PRIME (correct, below threshold)
 *   REFERENCE  → RETRIEVE
 *   OVERLEARN  → COMPLETE  | OVERLEARN  (wrong answer or more questions remain)
 *   COMPLETE   → (terminal — no outgoing transitions)
 *
 * Self-transitions are included for every state to allow the fallback
 * "stay in current state" return that fires on unrecognised events.
 */
export const VALID_TRANSITIONS: Readonly<Record<CognitiveState, ReadonlySet<CognitiveState>>> = {
  PRIME:     new Set<CognitiveState>(["ENCODE",    "PRIME"]),
  ENCODE:    new Set<CognitiveState>(["RETRIEVE",  "ENCODE"]),
  RETRIEVE:  new Set<CognitiveState>(["REFERENCE", "OVERLEARN", "PRIME", "RETRIEVE"]),
  REFERENCE: new Set<CognitiveState>(["RETRIEVE",  "REFERENCE"]),
  OVERLEARN: new Set<CognitiveState>(["COMPLETE",  "OVERLEARN"]),
  COMPLETE:  new Set<CognitiveState>(["COMPLETE"]),
};

/**
 * Validates that a computed (from → to) transition is legal.
 * Throws a descriptive Error if the transition is not in VALID_TRANSITIONS.
 *
 * This guard catches engine bugs (e.g., a future code path accidentally
 * returning an impossible nextState) before they surface as UI glitches.
 */
function assertValidTransition(
  from: CognitiveState,
  to: CognitiveState
): void {
  if (!VALID_TRANSITIONS[from].has(to)) {
    throw new Error(
      `[PERRIO engine] Invalid transition: ${from} → ${to}. ` +
        `Allowed targets from ${from}: ${[...VALID_TRANSITIONS[from]].join(", ")}.`
    );
  }
}

// ---------------------------------------------------------------------------
// Answer normalisation helpers
// ---------------------------------------------------------------------------

function normaliseAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    // collapse multiple spaces / tabs / newlines into one space
    .replace(/\s+/g, " ")
    // strip all brackets / parentheses
    .replace(/[()\[\]{}]/g, "")
    // strip leading / trailing punctuation
    .replace(/^[^\w]+|[^\w]+$/g, "")
    // remove internal punctuation that is never part of a maths answer
    .replace(/[,;:!?"'`]+/g, "")
    // normalise common unicode minus / dash to hyphen-minus
    .replace(/[\u2212\u2013\u2014]/g, "-")
    // collapse any spaces created by bracket removal
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compares a user's answer to the correct answer with tolerance for
 * extra spaces, punctuation, capitalisation, and trailing tokens.
 */
export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  const u = normaliseAnswer(userAnswer);
  const c = normaliseAnswer(correctAnswer);
  if (u === c) return true;

  // Strip ALL spaces and compare (handles "x=4" vs "x = 4")
  const uNoSpaces = u.replace(/\s/g, "");
  const cNoSpaces = c.replace(/\s/g, "");
  if (uNoSpaces === cNoSpaces) return true;

  // Accept if the correct answer is multi-token and the user typed just the last token
  // e.g. correct is "x = 5" — also accept "5"
  const lastToken = c.split(" ").at(-1) ?? c;
  if (lastToken.length > 0 && u === lastToken) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Event union
// ---------------------------------------------------------------------------

export type PerrioEvent =
  | { type: "PRIME_VIEWED" }
  | { type: "ENCODE_COMPLETE" }
  | { type: "SUBMIT_ANSWER"; answer: string }
  | { type: "RETRY" }
  | { type: "SUBMIT_OVERLEARN"; answer: string };

// ---------------------------------------------------------------------------
// Context supplied by the caller
// ---------------------------------------------------------------------------

export interface TransitionContext {
  /** Current concept being studied (may be null during initialisation) */
  concept: Concept | null;

  /** Current main question for the RETRIEVE stage */
  question: Question | null;

  /** User's memory stability for the current concept at the time of the event */
  currentStability: number;

  /** ISO date string of the user's last review for this concept, or null */
  lastReviewDate: string | null;

  /** Extra questions available for the OVERLEARN stage (already fetched) */
  overlearnQuestions: Question[];

  /** Index of the current overlearn question */
  overlearnIndex: number;

  /**
   * Number of correct retrieval answers for the current concept in this cycle.
   * The engine will not transition to OVERLEARN until this reaches
   * MIN_CORRECT_BEFORE_OVERLEARN, even if stability exceeds the threshold.
   */
  retrieveCorrectCount: number;
}

// ---------------------------------------------------------------------------
// Result returned to the caller
// ---------------------------------------------------------------------------

export interface TransitionResult {
  /** The cognitive state to move to */
  nextState: CognitiveState;

  // --- populated when processing a SUBMIT_ANSWER event ---
  correct?: boolean;
  feedback?: string;
  newStability?: number;
  predictedRecall?: number;

  // --- populated when processing a SUBMIT_OVERLEARN event ---
  nextOverlearnIndex?: number;
  overlearnFeedback?: string;

  // --- side-effect signals for the caller ---

  /**
   * True when the engine wants to enter OVERLEARN but needs the caller to
   * first fetch the extra questions from the data layer.
   * The caller should:
   *   1. Fetch questions whose concept_id matches context.concept.id, excluding the current question.
   *   2. If any exist → set state to OVERLEARN and store those questions.
   *   3. If none exist → set state to COMPLETE instead.
   */
  shouldFetchOverlearnQuestions?: boolean;

  /**
   * True when the answer was correct but stability is below the overlearn
   * threshold, signalling the caller to load the next concept.
   */
  shouldLoadNextConcept?: boolean;
}

// ---------------------------------------------------------------------------
// Main transition function
// ---------------------------------------------------------------------------

/**
 * Pure state-transition function for the PERRIO cognitive engine.
 *
 * Internal implementation — contains all switch/case logic.
 * Called exclusively by the exported `runPerrioTransition` wrapper below.
 */
function runTransitionInternal(
  currentState: CognitiveState,
  event: PerrioEvent,
  context: TransitionContext
): TransitionResult {
  switch (currentState) {
    // ------------------------------------------------------------------
    case "PRIME":
      if (event.type === "PRIME_VIEWED") {
        return { nextState: "ENCODE" };
      }
      break;

    // ------------------------------------------------------------------
    case "ENCODE":
      if (event.type === "ENCODE_COMPLETE") {
        return { nextState: "RETRIEVE" };
      }
      break;

    // ------------------------------------------------------------------
    case "RETRIEVE":
      if (event.type === "SUBMIT_ANSWER") {
        const { question, currentStability, lastReviewDate } = context;
        if (!question) return { nextState: currentState };

        const correct = answersMatch(event.answer, question.correct_answer);
        const feedback = correct
          ? "✓ Correct"
          : "✗ Incorrect";

        const now = new Date();
        const elapsedHours = lastReviewDate
          ? (now.getTime() - new Date(lastReviewDate).getTime()) / (1000 * 60 * 60)
          : 0;
        const predictedRecall = recallProbability(currentStability, elapsedHours);
        const newStability = updateStability(currentStability, correct);

        if (correct) {
          // Need both stability threshold AND minimum correct answers
          const newCorrectCount = (context.retrieveCorrectCount ?? 0) + 1;
          if (newStability > OVERLEARN_THRESHOLD && newCorrectCount >= MIN_CORRECT_BEFORE_OVERLEARN) {
            // Caller must fetch overlearn questions; final state (OVERLEARN vs COMPLETE)
            // is determined by whether any extra questions exist.
            return {
              nextState: "OVERLEARN",
              correct,
              feedback,
              newStability,
              predictedRecall,
              shouldFetchOverlearnQuestions: true,
            };
          } else {
            return {
              nextState: "PRIME",
              correct,
              feedback,
              newStability,
              predictedRecall,
              shouldLoadNextConcept: true,
            };
          }
        } else {
          return {
            nextState: "REFERENCE",
            correct,
            feedback,
            newStability,
            predictedRecall,
          };
        }
      }
      break;

    // ------------------------------------------------------------------
    case "REFERENCE":
      if (event.type === "RETRY") {
        return { nextState: "RETRIEVE" };
      }
      break;

    // ------------------------------------------------------------------
    case "OVERLEARN":
      if (event.type === "SUBMIT_OVERLEARN") {
        const { overlearnQuestions, overlearnIndex } = context;
        const oq = overlearnQuestions[overlearnIndex];
        if (!oq) return { nextState: currentState };

        const correct = answersMatch(event.answer, oq.correct_answer);

        if (correct) {
          const nextIdx = overlearnIndex + 1;
          if (nextIdx < overlearnQuestions.length) {
            return {
              nextState: "OVERLEARN",
              correct: true,
              nextOverlearnIndex: nextIdx,
              overlearnFeedback: "✓ Correct",
            };
          } else {
            return {
              nextState: "COMPLETE",
              correct: true,
              overlearnFeedback: "✓ Correct",
            };
          }
        } else {
          return {
            nextState: "OVERLEARN",
            correct: false,
            overlearnFeedback: `✗ Incorrect — ${oq.hint ?? `Answer: ${oq.correct_answer}`}`,
          };
        }
      }
      break;
  }

  // No matching transition — stay in current state
  return { nextState: currentState };
}

/**
 * Public entry-point for the PERRIO cognitive engine.
 *
 * Delegates all transition logic to `runTransitionInternal`, then validates
 * the computed (currentState → nextState) pair against VALID_TRANSITIONS.
 *
 * Throws an Error if the engine would produce an illegal transition,
 * making engine bugs immediately visible rather than silently corrupting state.
 *
 * @param currentState  The state the machine is currently in
 * @param event         The event that triggered the transition
 * @param context       Data the machine needs to compute the result
 * @returns             Next state and any computed metadata / side-effect signals
 */
export function runPerrioTransition(
  currentState: CognitiveState,
  event: PerrioEvent,
  context: TransitionContext
): TransitionResult {
  const result = runTransitionInternal(currentState, event, context);
  assertValidTransition(currentState, result.nextState);
  return result;
}
