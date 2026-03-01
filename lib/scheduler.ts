/**
 * lib/scheduler.ts — data-layer wrapper around the pure core scheduler.
 *
 * Responsibilities:
 *  - Fetch concepts and memory parameters from Supabase
 *  - Delegate pure scheduling logic to @/core/scheduler
 */

import { supabase } from "@/lib/supabase";
import { selectNextConcept } from "@/core/scheduler";
import type { Concept, ExperimentGroup, MemoryParam } from "@/core/types";

/**
 * Selects the next concept for review based on the user's experiment group.
 *
 * Scheduling strategies:
 * - blocked:  Always returns concepts from the same subject (first encountered)
 * - static:   Rotates through subjects evenly, round-robin style
 * - adaptive: Returns the concept with the lowest predicted recall probability
 *
 * @param userId          The current user's UUID
 * @param experimentGroup The user's assigned experiment group
 * @param reviewCount     Number of reviews completed so far (used by static scheduler)
 * @returns The next concept to review, or null if no concepts exist
 */
export async function getNextConcept(
  userId: string,
  experimentGroup: ExperimentGroup,
  reviewCount: number = 0,
  sessionSeed: number = 0
): Promise<Concept | null> {
  // --- Fetch all concepts (try with explanation column, fall back without) ---
  let concepts: Concept[] | null = null;
  let conceptsError: { message: string } | null = null;

  const result = await supabase
    .from("concepts")
    .select("id, subject, name, explanation");

  if (result.error?.message?.includes("explanation")) {
    // explanation column not yet added — query without it
    const fallback = await supabase
      .from("concepts")
      .select("id, subject, name");
    concepts = (fallback.data as Concept[]) ?? null;
    conceptsError = fallback.error;
  } else {
    concepts = (result.data as Concept[]) ?? null;
    conceptsError = result.error;
  }

  if (conceptsError || !concepts || concepts.length === 0) {
    console.error("Failed to fetch concepts:", conceptsError);
    return null;
  }

  // --- Fetch memory parameters (only needed by "adaptive" group) ---
  let memoryParams: MemoryParam[] = [];
  if (experimentGroup === "adaptive") {
    const { data: params } = await supabase
      .from("memory_parameters")
      .select("concept_id, stability, last_review")
      .eq("user_id", userId);
    memoryParams = (params as MemoryParam[]) ?? [];
  }

  // --- Delegate pure selection logic to core ---
  return selectNextConcept(concepts, experimentGroup, reviewCount, memoryParams, sessionSeed);
}
