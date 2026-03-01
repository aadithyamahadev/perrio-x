/**
 * Scheduling strategies for the PERRIO cognitive engine.
 *
 * All functions are pure:  caller is responsible for supplying concepts and
 * memory parameters fetched from the data layer.  No Supabase, no I/O.
 */

import { recallProbability } from "./memory";
import type { Concept, ExperimentGroup, MemoryParam } from "./types";

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic per session
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic pseudo-random number generator seeded by `seed`.
 * Each call to the returned function produces the next value in [0, 1).
 *
 * Algorithm: mulberry32 — simple, fast, 32-bit state, full-period.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Blocked scheduling: always return concepts from the same subject.
 * Picks the first subject alphabetically for consistency.
 */
export function selectBlocked(concepts: Concept[]): Concept {
  const subjects = [...new Set(concepts.map((c) => c.subject))].sort();
  const targetSubject = subjects[0];
  const subjectConcepts = concepts.filter((c) => c.subject === targetSubject);
  return subjectConcepts[Math.floor(Math.random() * subjectConcepts.length)];
}

/**
 * Static interleaving: 60 % primary topic, 40 % rotated secondary topic.
 *
 * - Primary topic   = subjects[0] (first alphabetically)
 * - Secondary topics = remaining subjects, cycled round-robin by reviewCount
 *
 * A seeded PRNG (sessionSeed) is advanced `reviewCount` times so that the
 * decision is **deterministic per session** yet varies across review cycles.
 *
 * Falls back to pure round-robin when there is only one subject.
 *
 * @param concepts     All available concepts
 * @param reviewCount  Number of reviews completed so far in this session
 * @param sessionSeed  A numeric seed unique to the current session
 */
export function selectStatic(
  concepts: Concept[],
  reviewCount: number,
  sessionSeed: number = 0
): Concept {
  const subjects = [...new Set(concepts.map((c) => c.subject))].sort();

  // Only one subject → no interleaving possible
  if (subjects.length <= 1) {
    const rng = mulberry32(sessionSeed + reviewCount);
    const subjectConcepts = concepts.filter((c) => c.subject === subjects[0]);
    return subjectConcepts[Math.floor(rng() * subjectConcepts.length)];
  }

  // Advance the seeded PRNG to the position for this reviewCount.
  // Using (sessionSeed + reviewCount) as per-cycle seed keeps things simple
  // and fully deterministic for a given session + cycle pair.
  const rng = mulberry32(sessionSeed + reviewCount);
  const roll = rng();

  const PRIMARY_PROBABILITY = 0.6;
  const primarySubject = subjects[0];
  const secondarySubjects = subjects.slice(1);

  const targetSubject =
    roll < PRIMARY_PROBABILITY
      ? primarySubject
      : secondarySubjects[reviewCount % secondarySubjects.length];

  const subjectConcepts = concepts.filter((c) => c.subject === targetSubject);

  // Pick a concept within the chosen subject (deterministic via same rng)
  return subjectConcepts[Math.floor(rng() * subjectConcepts.length)];
}

/**
 * Adaptive scheduling: probabilistically selects between the two weakest concepts.
 * - 60% chance → lowest recall concept
 * - 40% chance → second-lowest recall concept
 *
 * Concepts with no memory parameters are treated as never-reviewed (recall = 0).
 *
 * @param concepts     All available concepts
 * @param memoryParams Memory parameters fetched for the current user
 */
export function selectAdaptive(
  concepts: Concept[],
  memoryParams: MemoryParam[]
): Concept {
  const paramMap = new Map<string, MemoryParam>();
  for (const p of memoryParams) {
    paramMap.set(p.concept_id, p);
  }

  const now = Date.now();

  const scored = concepts.map((concept) => {
    const param = paramMap.get(concept.id);

    if (!param || !param.last_review) {
      return { concept, recall: 0 };
    }

    const elapsedHours =
      (now - new Date(param.last_review).getTime()) / (1000 * 60 * 60);
    const recall = recallProbability(param.stability, elapsedHours);
    return { concept, recall };
  });

  // Sort by lowest recall (weakest memory first)
  // Tie-break with random number to avoid sticking to the same concept when multiple have same recall
  scored.sort((a, b) => {
    if (a.recall !== b.recall) return a.recall - b.recall;
    return Math.random() - 0.5;
  });

  // Probabilistic selection: pick from the weakest candidates with a bias
  if (scored.length >= 3) {
    const r = Math.random();
    if (r < 0.5) return scored[0].concept; // 50% weakest
    if (r < 0.8) return scored[1].concept; // 30% second weakest
    return scored[2].concept; // 20% third weakest
  }

  if (scored.length >= 2) {
    return Math.random() < 0.7 ? scored[0].concept : scored[1].concept;
  }

  return scored[0].concept;
}

/**
 * Top-level dispatcher: pick the scheduling strategy and return the next concept.
 *
 * @param concepts        All available concepts (pre-fetched by caller)
 * @param experimentGroup User's assigned experiment group
 * @param reviewCount     Number of reviews completed so far (used by static)
 * @param memoryParams    User's memory parameters (used by adaptive)
 * @param sessionSeed     Numeric seed unique to the current session (deterministic interleaving)
 * @returns The next concept to review, or null if the list is empty
 */
export function selectNextConcept(
  concepts: Concept[],
  experimentGroup: ExperimentGroup,
  reviewCount: number,
  memoryParams: MemoryParam[],
  sessionSeed: number = 0
): Concept | null {
  if (!concepts || concepts.length === 0) return null;

  switch (experimentGroup) {
    case "blocked":
      return selectBlocked(concepts);

    case "static":
      return selectStatic(concepts, reviewCount, sessionSeed);

    case "adaptive":
      return selectAdaptive(concepts, memoryParams);

    default:
      return null;
  }
}
