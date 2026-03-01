/**
 * lib/types.ts — re-exports from /core to preserve existing import paths.
 * All canonical definitions live in @/core/types.
 */
export type {
  CognitiveState,
  Concept,
  Question,
  ExperimentGroup,
  MemoryParam,
} from "@/core/types";
export { EXPERIMENT_GROUPS } from "@/core/types";
