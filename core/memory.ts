/**
 * Memory model based on the exponential forgetting curve.
 *
 * Pure functions only — no side effects, no I/O.
 */

/**
 * Calculates the probability of successfully recalling a concept.
 *
 * Uses exponential decay: P(recall) = e^(-t/S)
 * - When t = 0, probability is 1 (perfect recall immediately after learning)
 * - As t increases, probability decreases toward 0
 * - Higher stability S slows the decay rate
 *
 * @param S - Stability parameter representing memory strength (in time units)
 * @param t - Time elapsed since last review (same units as S)
 * @returns Probability of recall between 0 and 1
 */
export function recallProbability(S: number, t: number): number {
  return Math.exp(-t / S);
}

/**
 * Updates the stability parameter based on retrieval outcome.
 *
 * Implements a simple spacing effect model:
 * - Successful retrieval strengthens the memory trace (S increases by 25%)
 * - Failed retrieval resets stability to baseline, simulating memory collapse
 *
 * @param S - Current stability value
 * @param correct - Whether the retrieval attempt was successful
 * @returns Updated stability value
 */
export function updateStability(S: number, correct: boolean): number {
  if (correct) {
    return S * 1.25;
  }
  return 1.0;
}
