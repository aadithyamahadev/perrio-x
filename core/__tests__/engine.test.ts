/**
 * core/__tests__/engine.test.ts
 *
 * Unit tests for the PERRIO cognitive engine.
 *
 * Rules:
 *  - No React, no Supabase, no mocks.
 *  - All tests call pure engine functions directly.
 *  - Each describe block covers one logical concern.
 */

import {
  runPerrioTransition,
  answersMatch,
  OVERLEARN_THRESHOLD,
  MIN_CORRECT_BEFORE_OVERLEARN,
} from "@/core/stateMachine";
import { updateStability, recallProbability } from "@/core/memory";
import { mulberry32, selectStatic, selectNextConcept } from "@/core/scheduler";
import type { TransitionContext } from "@/core/stateMachine";
import type { Concept, Question } from "@/core/types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: "concept-1",
    subject: "Algebra",
    name: "Solving Linear Equations",
    explanation: "Isolate the variable on one side of the equation.",
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "question-1",
    question_text: "Solve for x: 2x + 3 = 11",
    correct_answer: "x = 4",
    hint: "Subtract 3 from both sides first.",
    ...overrides,
  };
}

function makeCtx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    concept: makeConcept(),
    question: makeQuestion(),
    currentStability: 1.0,
    lastReviewDate: null,
    overlearnQuestions: [],
    overlearnIndex: 0,
    retrieveCorrectCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. PRIME → ENCODE transition
// ---------------------------------------------------------------------------

describe("PRIME → ENCODE transition", () => {
  it("returns ENCODE when PRIME_VIEWED is fired", () => {
    const result = runPerrioTransition("PRIME", { type: "PRIME_VIEWED" }, makeCtx());
    expect(result.nextState).toBe("ENCODE");
  });

  it("stays in PRIME for an unrecognised event", () => {
    // Fire an event that doesn't match any PRIME handler
    const result = runPerrioTransition(
      "PRIME",
      { type: "ENCODE_COMPLETE" },
      makeCtx()
    );
    expect(result.nextState).toBe("PRIME");
  });
});

// ---------------------------------------------------------------------------
// 2. ENCODE → RETRIEVE transition
// ---------------------------------------------------------------------------

describe("ENCODE → RETRIEVE transition", () => {
  it("returns RETRIEVE when ENCODE_COMPLETE is fired", () => {
    const result = runPerrioTransition("ENCODE", { type: "ENCODE_COMPLETE" }, makeCtx());
    expect(result.nextState).toBe("RETRIEVE");
  });

  it("stays in ENCODE for an unrecognised event", () => {
    const result = runPerrioTransition(
      "ENCODE",
      { type: "PRIME_VIEWED" },
      makeCtx()
    );
    expect(result.nextState).toBe("ENCODE");
  });
});

// ---------------------------------------------------------------------------
// 3. Wrong answer triggers REFERENCE
// ---------------------------------------------------------------------------

describe("RETRIEVE: wrong answer → REFERENCE", () => {
  it("moves to REFERENCE on a clearly wrong answer", () => {
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 99" },
      makeCtx()
    );
    expect(result.nextState).toBe("REFERENCE");
    expect(result.correct).toBe(false);
  });

  it("returns to RETRIEVE from REFERENCE on RETRY", () => {
    const result = runPerrioTransition("REFERENCE", { type: "RETRY" }, makeCtx());
    expect(result.nextState).toBe("RETRIEVE");
  });

  it("does NOT include the correct answer in the feedback string", () => {
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 0" },
      makeCtx()
    );
    expect(result.feedback).toBe("✗ Incorrect");
    expect(result.feedback).not.toContain("x = 4");
  });
});

// ---------------------------------------------------------------------------
// 4. Stability increases on correct answer
// ---------------------------------------------------------------------------

describe("Stability increases on correct answer", () => {
  it("multiplies stability by 1.25 when answer is correct", () => {
    const initialStability = 1.0;
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 4" },
      makeCtx({ currentStability: initialStability })
    );
    expect(result.correct).toBe(true);
    expect(result.newStability).toBeCloseTo(initialStability * 1.25);
  });

  it("accumulates stability across multiple correct answers (via updateStability)", () => {
    let s = 1.0;
    s = updateStability(s, true); // 1.25
    s = updateStability(s, true); // 1.5625
    s = updateStability(s, true); // 1.953125
    expect(s).toBeCloseTo(1.0 * 1.25 ** 3);
  });

  it("updateStability increases stability for a correct answer", () => {
    expect(updateStability(2.0, true)).toBeCloseTo(2.5);
    expect(updateStability(0.5, true)).toBeCloseTo(0.625);
  });
});

// ---------------------------------------------------------------------------
// 5. Stability resets on wrong answer
// ---------------------------------------------------------------------------

describe("Stability resets on wrong answer", () => {
  it("resets stability to 1.0 regardless of current value", () => {
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 99" },
      makeCtx({ currentStability: 2.4 })
    );
    expect(result.correct).toBe(false);
    expect(result.newStability).toBe(1.0);
  });

  it("updateStability resets to baseline 1.0 on wrong answer", () => {
    expect(updateStability(5.0, false)).toBe(1.0);
    expect(updateStability(0.2, false)).toBe(1.0);
  });

  it("stability reset prevents premature overlearn trigger", () => {
    // Even if stability was high, a wrong answer brings it back to 1.0
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "wrong" },
      makeCtx({ currentStability: OVERLEARN_THRESHOLD + 10 })
    );
    expect(result.nextState).toBe("REFERENCE");
    expect(result.newStability).toBe(1.0);
    expect(result.shouldFetchOverlearnQuestions).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 6. Overlearning triggers after stability threshold
// ---------------------------------------------------------------------------

describe("Overlearning triggers after stability threshold", () => {
  // OVERLEARN_THRESHOLD = 3.0
  // newStability = currentStability * 1.25
  // Trigger condition: newStability > OVERLEARN_THRESHOLD
  // So: currentStability > 3.0 / 1.25 = 2.4

  it("signals shouldFetchOverlearnQuestions when newStability exceeds threshold AND correct count met", () => {
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 4" },
      makeCtx({ currentStability: 2.5, retrieveCorrectCount: MIN_CORRECT_BEFORE_OVERLEARN - 1 }) // count 4 + this correct = 5
    );
    expect(result.correct).toBe(true);
    expect(result.newStability).toBeCloseTo(3.125);
    expect(result.shouldFetchOverlearnQuestions).toBe(true);
    expect(result.nextState).toBe("OVERLEARN");
  });

  it("does NOT trigger overlearn below threshold", () => {
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 4" },
      makeCtx({ currentStability: 1.9, retrieveCorrectCount: 10 }) // 1.9 * 1.25 = 2.375 < 3.0
    );
    expect(result.correct).toBe(true);
    expect(result.shouldFetchOverlearnQuestions).toBeUndefined();
    expect(result.nextState).toBe("PRIME");
  });

  it("does NOT trigger overlearn when stability exceeds threshold but correct count is too low", () => {
    const result = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 4" },
      makeCtx({ currentStability: 2.5, retrieveCorrectCount: 2 }) // stability ok, but only 3 correct (2 + this)
    );
    expect(result.correct).toBe(true);
    expect(result.newStability).toBeCloseTo(3.125);
    expect(result.shouldFetchOverlearnQuestions).toBeUndefined();
    expect(result.shouldLoadNextConcept).toBe(true);
    expect(result.nextState).toBe("PRIME");
  });

  it("requires exactly MIN_CORRECT_BEFORE_OVERLEARN correct answers", () => {
    // Simulate the exact boundary: count = MIN - 2 → should NOT trigger
    const resultBefore = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 4" },
      makeCtx({ currentStability: 2.5, retrieveCorrectCount: MIN_CORRECT_BEFORE_OVERLEARN - 2 })
    );
    expect(resultBefore.shouldFetchOverlearnQuestions).toBeUndefined();

    // count = MIN - 1 → this answer makes it MIN → SHOULD trigger
    const resultAt = runPerrioTransition(
      "RETRIEVE",
      { type: "SUBMIT_ANSWER", answer: "x = 4" },
      makeCtx({ currentStability: 2.5, retrieveCorrectCount: MIN_CORRECT_BEFORE_OVERLEARN - 1 })
    );
    expect(resultAt.shouldFetchOverlearnQuestions).toBe(true);
  });

  it("advances overlearn index on a correct overlearn answer", () => {
    const q1 = makeQuestion({ id: "q1", correct_answer: "x = 4" });
    const q2 = makeQuestion({ id: "q2", correct_answer: "x = 7" });
    const result = runPerrioTransition(
      "OVERLEARN",
      { type: "SUBMIT_OVERLEARN", answer: "x = 4" },
      makeCtx({ overlearnQuestions: [q1, q2], overlearnIndex: 0 })
    );
    expect(result.correct).toBe(true);
    expect(result.nextState).toBe("OVERLEARN");
    expect(result.nextOverlearnIndex).toBe(1);
  });

  it("moves to COMPLETE after all overlearn questions are answered", () => {
    const q1 = makeQuestion({ id: "q1", correct_answer: "x = 4" });
    const result = runPerrioTransition(
      "OVERLEARN",
      { type: "SUBMIT_OVERLEARN", answer: "x = 4" },
      makeCtx({ overlearnQuestions: [q1], overlearnIndex: 0 })
    );
    expect(result.correct).toBe(true);
    expect(result.nextState).toBe("COMPLETE");
  });

  it("stays in OVERLEARN and shows hint on wrong overlearn answer", () => {
    const q1 = makeQuestion({
      id: "q1",
      correct_answer: "x = 4",
      hint: "Try again!",
    });
    const result = runPerrioTransition(
      "OVERLEARN",
      { type: "SUBMIT_OVERLEARN", answer: "x = 99" },
      makeCtx({ overlearnQuestions: [q1], overlearnIndex: 0 })
    );
    expect(result.correct).toBe(false);
    expect(result.nextState).toBe("OVERLEARN");
    expect(result.overlearnFeedback).toContain("Try again!");
  });
});

// ---------------------------------------------------------------------------
// Bonus: answersMatch normalisation
// ---------------------------------------------------------------------------

describe("answersMatch — answer normalisation", () => {
  it("matches identical answers", () => {
    expect(answersMatch("x = 4", "x = 4")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(answersMatch("X = 4", "x = 4")).toBe(true);
  });

  it("ignores leading/trailing whitespace", () => {
    expect(answersMatch("  x = 4  ", "x = 4")).toBe(true);
  });

  it("accepts the final token when correct answer has multiple tokens", () => {
    // "x = 4" — student types just "4"
    expect(answersMatch("4", "x = 4")).toBe(true);
  });

  it("rejects clearly wrong answers", () => {
    expect(answersMatch("x = 99", "x = 4")).toBe(false);
  });

  it("ignores brackets and parentheses", () => {
    expect(answersMatch("(x = 4)", "x = 4")).toBe(true);
    expect(answersMatch("x = (4)", "x = 4")).toBe(true);
    expect(answersMatch("[x = 4]", "x = 4")).toBe(true);
    expect(answersMatch("{x = 4}", "x = 4")).toBe(true);
  });

  it("matches when spaces differ", () => {
    expect(answersMatch("x=4", "x = 4")).toBe(true);
    expect(answersMatch("x =4", "x = 4")).toBe(true);
    expect(answersMatch("x  =  4", "x = 4")).toBe(true);
  });

  it("matches with mixed brackets and spacing", () => {
    expect(answersMatch("( x=4 )", "x = 4")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bonus: recallProbability
// ---------------------------------------------------------------------------

describe("recallProbability — memory model", () => {
  it("returns 1 when t = 0 (immediate recall)", () => {
    expect(recallProbability(1.0, 0)).toBe(1);
  });

  it("decays toward 0 as t increases", () => {
    const r1 = recallProbability(1.0, 1);
    const r2 = recallProbability(1.0, 10);
    expect(r1).toBeGreaterThan(r2);
    expect(r2).toBeGreaterThan(0);
  });

  it("higher stability means slower decay", () => {
    const lowS = recallProbability(1.0, 5);
    const highS = recallProbability(5.0, 5);
    expect(highS).toBeGreaterThan(lowS);
  });
});

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32
// ---------------------------------------------------------------------------

describe("mulberry32 — seeded PRNG", () => {
  it("produces deterministic sequences for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds produce different sequences", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    // At least one of the first 5 values should differ
    const diffs = Array.from({ length: 5 }, () => a() !== b());
    expect(diffs.some(Boolean)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Static interleaving — selectStatic
// ---------------------------------------------------------------------------

describe("selectStatic — 60/40 interleaving", () => {
  const concepts: Concept[] = [
    { id: "a1", subject: "Algebra",   name: "Linear Eq",     explanation: null },
    { id: "a2", subject: "Algebra",   name: "Quadratic Eq",  explanation: null },
    { id: "g1", subject: "Geometry",  name: "Triangles",     explanation: null },
    { id: "g2", subject: "Geometry",  name: "Circles",       explanation: null },
    { id: "s1", subject: "Statistics", name: "Mean",          explanation: null },
  ];

  it("is deterministic: same seed + reviewCount → same concept", () => {
    const seed = 777;
    for (let rc = 0; rc < 10; rc++) {
      const c1 = selectStatic(concepts, rc, seed);
      const c2 = selectStatic(concepts, rc, seed);
      expect(c1.id).toBe(c2.id);
    }
  });

  it("always returns the single subject when only one exists", () => {
    const single = [concepts[0], concepts[1]]; // both Algebra
    for (let rc = 0; rc < 20; rc++) {
      const c = selectStatic(single, rc, 42);
      expect(c.subject).toBe("Algebra");
    }
  });

  it("approximates 60/40 split over many cycles", () => {
    const seed = 99;
    const N = 1000;
    let primaryCount = 0;
    for (let rc = 0; rc < N; rc++) {
      const c = selectStatic(concepts, rc, seed);
      if (c.subject === "Algebra") primaryCount++;
    }
    const ratio = primaryCount / N;
    // Allow ±10 % tolerance around the 60 % target
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(0.7);
  });

  it("secondary topics rotate across review cycles", () => {
    const seed = 42;
    const N = 200;
    const secondarySubjects = new Set<string>();
    for (let rc = 0; rc < N; rc++) {
      const c = selectStatic(concepts, rc, seed);
      if (c.subject !== "Algebra") secondarySubjects.add(c.subject);
    }
    // Should visit both secondary subjects
    expect(secondarySubjects.size).toBe(2);
    expect(secondarySubjects.has("Geometry")).toBe(true);
    expect(secondarySubjects.has("Statistics")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// selectNextConcept — dispatcher passes sessionSeed
// ---------------------------------------------------------------------------

describe("selectNextConcept — static group uses sessionSeed", () => {
  const concepts: Concept[] = [
    { id: "a1", subject: "Algebra",  name: "X", explanation: null },
    { id: "g1", subject: "Geometry", name: "Y", explanation: null },
  ];

  it("returns deterministic results with same seed", () => {
    const r1 = selectNextConcept(concepts, "static", 5, [], 12345);
    const r2 = selectNextConcept(concepts, "static", 5, [], 12345);
    expect(r1?.id).toBe(r2?.id);
  });

  it("returns null for empty concept list", () => {
    expect(selectNextConcept([], "static", 0, [], 0)).toBeNull();
  });
});
