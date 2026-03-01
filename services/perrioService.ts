/**
 * services/perrioService.ts
 *
 * Service layer that sits between UI and the pure core engine.
 * Handles all database reads/writes and calls core engine functions.
 *
 * Architecture: UI → Service ( localise ) → Core Engine
 *               Service → Database (Supabase)
 *
 * Language is resolved here — the core engine is always given plain English-
 * equivalent Question objects and never learns about the user's language.
 */

import { supabase } from "@/lib/supabase";
import { localizeQuestions } from "./language";
import type { Language } from "./language";
import { getAiGuidance } from "./aiGuidanceService";
import type { AiGuidance } from "./aiGuidanceService";
import { getAiTopicSuggestions } from "./aiTopicSuggestionsService";
import type {
  TopicSuggestion,
  TopicSuggestionParams,
} from "./aiTopicSuggestionsService";
import {
  runPerrioTransition,
  selectNextConcept,
  EXPERIMENT_GROUPS,
} from "@/core";
import type {
  CognitiveState,
  Concept,
  ExperimentGroup,
  Question,
  MemoryParam,
  TransitionContext,
  TransitionResult,
  PerrioEvent,
} from "@/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserData {
  id: string;
  experimentGroup: ExperimentGroup;
}

export interface MemoryState {
  stability: number;
  lastReview: string | null;
}

export interface RetrieveSubmitParams {
  tenantId: string;
  studentId: string;
  concept: Concept;
  question: Question;
  answer: string;
  responseTime: number | null;
  /** Number of correct retrieval answers so far for this concept in this cycle */
  retrieveCorrectCount: number;
}

export interface RetrieveSubmitResult {
  transitionResult: TransitionResult;
  attemptNumber: number;
}

export interface OverlearnSubmitParams {
  tenantId: string;
  studentId: string;
  concept: Concept;
  question: Question;
  overlearnQuestions: Question[];
  overlearnIndex: number;
  answer: string;
  responseTime: number | null;
}

export interface OverlearnSubmitResult {
  transitionResult: TransitionResult;
  attemptNumber: number;
}

// ---------------------------------------------------------------------------
// Topic Suggestions
// ---------------------------------------------------------------------------

export type {
  TopicSuggestion,
  TopicSuggestionParams,
} from "./aiTopicSuggestionsService";

export async function fetchTopicSuggestions(
  params: TopicSuggestionParams
): Promise<TopicSuggestion[] | null> {
  return getAiTopicSuggestions(params);
}

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------

/**
 * Gets or creates a user. Required tenantId and studentId.
 */
export async function getOrCreateUser(tenantId: string, studentId: string): Promise<UserData | null> {
  const { data } = await supabase
    .from("users")
    .select("id, experiment_group")
    .eq("tenant_id", tenantId)
    .eq("id", studentId)
    .single();

  if (data) {
    return {
      id: data.id,
      experimentGroup: data.experiment_group as ExperimentGroup,
    };
  }

  // Create new user with random experiment group
  const experimentGroup =
    EXPERIMENT_GROUPS[Math.floor(Math.random() * EXPERIMENT_GROUPS.length)];

  const { data: newData, error } = await supabase
    .from("users")
    .insert({
      id: studentId,
      tenant_id: tenantId,
      experiment_group: experimentGroup
    })
    .select("id, experiment_group")
    .single();

  if (error) {
    console.error("Failed to create user:", error);
    return null;
  }

  return {
    id: newData.id,
    experimentGroup: newData.experiment_group as ExperimentGroup,
  };
}

// ---------------------------------------------------------------------------
// Concept Operations
// ---------------------------------------------------------------------------

/**
 * Fetches all concepts for a tenant.
 */
export async function fetchAllConcepts(tenantId: string, studentId: string): Promise<Concept[]> {
  const result = await supabase
    .from("concepts")
    .select("id, subject, name, explanation")
    .eq("tenant_id", tenantId)
    .order("subject")
    .order("name");

  if (result.error?.message?.includes("explanation")) {
    const fallback = await supabase
      .from("concepts")
      .select("id, subject, name")
      .eq("tenant_id", tenantId)
      .order("subject")
      .order("name");
    return (fallback.data as Concept[]) ?? [];
  }

  return (result.data as Concept[]) ?? [];
}

/**
 * Fetches a specific concept by ID, scoped by tenant.
 */
export async function fetchConceptById(
  tenantId: string,
  studentId: string,
  conceptId: string
): Promise<Concept | null> {
  const { data } = await supabase
    .from("concepts")
    .select("id, subject, name, explanation")
    .eq("tenant_id", tenantId)
    .eq("id", conceptId)
    .single();

  return data as Concept | null;
}

/**
 * Selects the next concept using the scheduler.
 */
export async function getNextConceptForUser(
  tenantId: string,
  studentId: string,
  experimentGroup: ExperimentGroup,
  reviewCount: number,
  sessionSeed: number = 0
): Promise<Concept | null> {
  // Fetch all concepts for tenant
  let concepts: Concept[] | null = null;
  let conceptsError: { message: string } | null = null;

  const result = await supabase
    .from("concepts")
    .select("id, subject, name, explanation")
    .eq("tenant_id", tenantId);

  if (result.error?.message?.includes("explanation")) {
    const fallback = await supabase
      .from("concepts")
      .select("id, subject, name")
      .eq("tenant_id", tenantId);
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

  // Fetch memory parameters for tenant/student
  let memoryParams: MemoryParam[] = [];
  if (experimentGroup === "adaptive") {
    const { data: params } = await supabase
      .from("memory_parameters")
      .select("concept_id, stability, last_review")
      .eq("tenant_id", tenantId)
      .eq("user_id", studentId);
    memoryParams = (params as MemoryParam[]) ?? [];
  }

  // Delegate to pure core scheduler
  return selectNextConcept(concepts, experimentGroup, reviewCount, memoryParams, sessionSeed);
}

// ---------------------------------------------------------------------------
// Question Operations
// ---------------------------------------------------------------------------

/**
 * Fetches all questions for a concept, scoped by tenant.
 * Applies localisation before returning — the caller and engine see only
 * the localised question_text and hint; correct_answer stays in English.
 */
export async function fetchQuestionsForConcept(
  tenantId: string,
  studentId: string,
  conceptId: string,
  language: Language = "en"
): Promise<Question[]> {
  const { data } = await supabase
    .from("questions")
    .select("id, question_text, correct_answer, hint")
    .eq("tenant_id", tenantId)
    .eq("concept_id", conceptId);

  const questions = (data as Question[]) ?? [];
  return localizeQuestions(tenantId, questions, language);
}

/**
 * Fetches questions for a concept, excluding a specific question ID.
 * Scoped by tenant. Applies localisation before returning.
 */
export async function fetchOverlearnQuestions(
  tenantId: string,
  studentId: string,
  conceptId: string,
  excludeQuestionId: string,
  language: Language = "en"
): Promise<Question[]> {
  const { data } = await supabase
    .from("questions")
    .select("id, question_text, correct_answer, hint")
    .eq("tenant_id", tenantId)
    .eq("concept_id", conceptId)
    .neq("id", excludeQuestionId);

  const questions = (data as Question[]) ?? [];
  return localizeQuestions(tenantId, questions, language);
}

// ---------------------------------------------------------------------------
// Memory Parameter Operations
// ---------------------------------------------------------------------------

/**
 * Fetches memory parameters for a student, scoped by tenant.
 */
export async function fetchMemoryParams(
  tenantId: string,
  studentId: string,
  conceptId: string
): Promise<MemoryState> {
  const { data } = await supabase
    .from("memory_parameters")
    .select("stability, last_review")
    .eq("tenant_id", tenantId)
    .eq("user_id", studentId)
    .eq("concept_id", conceptId)
    .maybeSingle();

  return {
    stability: data?.stability ?? 1.0,
    lastReview: data?.last_review ?? null,
  };
}

/**
 * Updates memory parameters for a student, scoped by tenant.
 */
export async function updateMemoryParams(
  tenantId: string,
  studentId: string,
  conceptId: string,
  stability: number
): Promise<void> {
  const now = new Date();
  const { error } = await supabase
    .from("memory_parameters")
    .upsert(
      {
        tenant_id: tenantId,
        user_id: studentId,
        concept_id: conceptId,
        stability,
        last_review: now.toISOString(),
      },
      { onConflict: "tenant_id,user_id,concept_id" }
    );

  if (error) {
    console.error("Failed to upsert memory_parameters:", error);
  }
}

// ---------------------------------------------------------------------------
// Retrieval Event Logging
// ---------------------------------------------------------------------------

/**
 * Gets the current attempt count, scoped by tenant/student.
 */
export async function getAttemptCount(
  tenantId: string,
  studentId: string,
  conceptId: string
): Promise<number> {
  const { count } = await supabase
    .from("retrieval_events")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("user_id", studentId)
    .eq("concept_id", conceptId);

  return count ?? 0;
}

/**
 * Logs a retrieval event, scoped by tenant/student.
 */
export async function logRetrievalEvent(
  tenantId: string,
  studentId: string,
  conceptId: string,
  correct: boolean,
  responseTime: number | null,
  attemptNumber: number
): Promise<void> {
  await supabase.from("retrieval_events").insert({
    tenant_id: tenantId,
    user_id: studentId,
    concept_id: conceptId,
    correct,
    response_time: responseTime,
    attempt_number: attemptNumber,
  });
}

// Re-export so callers only need to import from perrioService
export type { AiGuidance } from "./aiGuidanceService";

// ---------------------------------------------------------------------------
// Reference Guidance  (REFERENCE state only)
// ---------------------------------------------------------------------------

export interface ReferenceGuidanceParams {
  tenantId: string;
  studentId: string;
  /** The concept being studied */
  concept: Concept;
  /** The question the student was asked */
  question: Question;
  /** The wrong answer the student submitted */
  studentAnswer: string;
  /** Language to generate guidance in */
  language: Language;
}

export interface ReferenceGuidanceResult {
  /** AI-generated structured correction, or null if AI is unavailable */
  aiGuidance: AiGuidance | null;
  /**
   * Static fallback text: the concept's stored explanation.
   * Always present; use when aiGuidance is null.
   */
  staticExplanation: string | null;
}

/**
 * Fetches AI guidance for a wrong answer during the REFERENCE state.
 *
 * Calls aiGuidanceService to produce a 3-step structured correction.
 * Falls back gracefully to the concept's static explanation if:
 *   - OPENAI_API_KEY is not configured
 *   - The AI call fails for any reason
 *
 * This is the ONLY place in the service layer that calls aiGuidanceService.
 * Never call aiGuidanceService from the core engine or UI components.
 */
export async function fetchReferenceGuidance(
  params: ReferenceGuidanceParams
): Promise<ReferenceGuidanceResult> {
  const { concept, question, studentAnswer, language } = params;

  const aiGuidance = await getAiGuidance({
    conceptName: concept.name,
    questionText: question.question_text,
    studentAnswer,
    correctAnswer: question.correct_answer,
    language,
  });

  return {
    aiGuidance,
    staticExplanation: concept.explanation ?? null,
  };
}

// ---------------------------------------------------------------------------
// State Transition Processing
// ---------------------------------------------------------------------------

/**
 * Executes a simple state transition. Required tenantId/studentId for signature consistency.
 */
export function executeSimpleTransition(
  tenantId: string,
  studentId: string,
  currentState: CognitiveState,
  event: PerrioEvent,
  context: Partial<TransitionContext> = {}
): TransitionResult {
  const fullContext: TransitionContext = {
    concept: context.concept ?? null,
    question: context.question ?? null,
    currentStability: context.currentStability ?? 1.0,
    lastReviewDate: context.lastReviewDate ?? null,
    overlearnQuestions: context.overlearnQuestions ?? [],
    overlearnIndex: context.overlearnIndex ?? 0,
    retrieveCorrectCount: context.retrieveCorrectCount ?? 0,
  };

  return runPerrioTransition(currentState, event, fullContext);
}

/**
 * Processes a RETRIEVE submission.
 */
export async function processRetrieveSubmit(
  params: RetrieveSubmitParams
): Promise<RetrieveSubmitResult> {
  const { tenantId, studentId, concept, question, answer, responseTime, retrieveCorrectCount } = params;

  // Fetch current memory state
  const memoryState = await fetchMemoryParams(tenantId, studentId, concept.id);

  // Build context for pure engine
  const ctx: TransitionContext = {
    concept,
    question,
    currentStability: memoryState.stability,
    lastReviewDate: memoryState.lastReview,
    overlearnQuestions: [],
    overlearnIndex: 0,
    retrieveCorrectCount,
  };

  // Call pure engine
  const result = runPerrioTransition(
    "RETRIEVE",
    { type: "SUBMIT_ANSWER", answer },
    ctx
  );

  // Log retrieval event
  const attemptCount = await getAttemptCount(tenantId, studentId, concept.id);
  const attemptNumber = attemptCount + 1;

  await logRetrievalEvent(
    tenantId,
    studentId,
    concept.id,
    result.correct ?? false,
    responseTime,
    attemptNumber
  );

  // Update memory parameters
  if (result.newStability !== undefined) {
    await updateMemoryParams(tenantId, studentId, concept.id, result.newStability);
  }

  console.log("Review:", {
    tenantId,
    studentId,
    concept: concept.name,
    correct: result.correct,
    stability: `${ctx.currentStability} → ${result.newStability}`,
  });

  return {
    transitionResult: result,
    attemptNumber,
  };
}

/**
 * Processes an OVERLEARN submission.
 */
export async function processOverlearnSubmit(
  params: OverlearnSubmitParams
): Promise<OverlearnSubmitResult> {
  const {
    tenantId,
    studentId,
    concept,
    question,
    overlearnQuestions,
    overlearnIndex,
    answer,
    responseTime,
  } = params;

  // Build context for pure engine
  const ctx: TransitionContext = {
    concept,
    question,
    currentStability: 1.0, // not needed for overlearn
    lastReviewDate: null,
    overlearnQuestions,
    overlearnIndex,
    retrieveCorrectCount: 0,
  };

  // Call pure engine
  const result = runPerrioTransition(
    "OVERLEARN",
    { type: "SUBMIT_OVERLEARN", answer },
    ctx
  );

  // Log retrieval event
  const attemptCount = await getAttemptCount(tenantId, studentId, concept.id);
  const attemptNumber = attemptCount + 1;

  await logRetrievalEvent(
    tenantId,
    studentId,
    concept.id,
    result.correct ?? false,
    responseTime,
    attemptNumber
  );

  return {
    transitionResult: result,
    attemptNumber,
  };
}
