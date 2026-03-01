/**
 * /core — PERRIO cognitive engine
 *
 * Fully isolated pure-function module.
 * No React, no Supabase, no browser/Node I/O.
 *
 * Primary interface:
 *   runPerrioTransition(currentState, event, context) → TransitionResult
 */

// Types
export type {
  CognitiveState,
  Concept,
  Question,
  ExperimentGroup,
  MemoryParam,
} from "./types";
export { EXPERIMENT_GROUPS } from "./types";

// Memory model
export { recallProbability, updateStability } from "./memory";

// Scheduler (pure)
export {
  mulberry32,
  selectBlocked,
  selectStatic,
  selectAdaptive,
  selectNextConcept,
} from "./scheduler";

// State machine
export type { PerrioEvent, TransitionContext, TransitionResult } from "./stateMachine";
export {
  runPerrioTransition,
  answersMatch,
  OVERLEARN_THRESHOLD,
  MIN_CORRECT_BEFORE_OVERLEARN,
} from "./stateMachine";
