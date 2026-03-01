"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getPrimerText } from "@/lib/primers";
import type { Language } from "@/services/language";
import { SUPPORTED_LANGUAGES } from "@/services/language";
import type {
  CognitiveState,
  Concept,
  ExperimentGroup,
  Question,
} from "@/lib/types";
import {
  getOrCreateUser,
  fetchAllConcepts,
  fetchConceptById,
  getNextConceptForUser,
  fetchQuestionsForConcept,
  fetchOverlearnQuestions,
  executeSimpleTransition,
  processRetrieveSubmit,
  processOverlearnSubmit,
  fetchReferenceGuidance,
  fetchTopicSuggestions,
} from "@/services/perrioService";
import type { AiGuidance, TopicSuggestion } from "@/services/perrioService";

// ---------------------------------------------------------------------------
// Public state shape exposed to view components
// ---------------------------------------------------------------------------
export interface PerrioState {
  // User / session
  tenantId: string | null;
  studentId: string | null;
  group: ExperimentGroup | null;
  language: Language;

  // Current concept + question
  concept: Concept | null;
  question: Question | null;
  cognitiveState: CognitiveState;
  primerText: string | null;

  // Retrieve state
  answer: string;
  feedback: string | null;
  stability: number | null;
  predictedRecall: number | null;

  // All concepts for manual selection
  allConcepts: Concept[];

  // Overlearn state
  overlearnQuestions: Question[];
  overlearnIndex: number;
  overlearnAnswer: string;
  overlearnFeedback: string | null;

  // Reference guidance (AI)
  referenceGuidance: AiGuidance | null;

  // Wrong attempt count for current concept
  wrongAttemptCount: number;

  // AI topic suggestions
  topicSuggestions: TopicSuggestion[] | null;
  topicSuggestionsLoading: boolean;
}

export interface PerrioActions {
  setAnswer: (v: string) => void;
  setOverlearnAnswer: (v: string) => void;
  setLanguage: (lang: Language) => void;
  handleRetrieveSubmit: (e: React.FormEvent) => Promise<void>;
  handleOverlearnSubmit: (e: React.FormEvent) => Promise<void>;
  transitionToEncode: () => void;
  transitionToRetrieve: () => void;
  retryFromReference: () => void;
  loadNextConcept: (specificConceptId?: string) => void;
  loadTopicSuggestions: () => Promise<void>;
  resetForExit: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function usePerrioStateMachine(): PerrioState & PerrioActions {
  // User / session
  const [tenantId, setTenantId] = useState<string | null>("00000000-0000-0000-0000-000000000000"); // Use default for now
  const [studentId, setStudentId] = useState<string | null>(null);
  const [group, setGroup] = useState<ExperimentGroup | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  // A numeric seed stable for the lifetime of this hook instance (= one session).
  // Used by the static-interleaving scheduler for deterministic 60/40 splits.
  const sessionSeedRef = useRef<number>(Math.floor(Math.random() * 2147483647));

  // Language — service layer concern; resolved before engine sees any question
  const [language, setLanguage] = useState<Language>("en");

  // Current concept cycle
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [concept, setConcept] = useState<Concept | null>(null);
  const pendingConceptIdRef = useRef<string | undefined | null>(null); // null = nothing pending
  const [question, setQuestion] = useState<Question | null>(null);
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>("PRIME");
  const [primerText, setPrimerText] = useState<string | null>(null);

  // Retrieve
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [stability, setStability] = useState<number | null>(null);
  const [predictedRecall, setPredictedRecall] = useState<number | null>(null);
  const questionShownAt = useRef<number | null>(null);

  // Wrong attempt tracking (reset per concept)
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0);

  // Correct retrieval count for current concept cycle (reset when concept changes)
  const [retrieveCorrectCount, setRetrieveCorrectCount] = useState(0);
  const retrieveCorrectCountRef = useRef(retrieveCorrectCount);
  retrieveCorrectCountRef.current = retrieveCorrectCount;

  // Overlearn
  const [overlearnQuestions, setOverlearnQuestions] = useState<Question[]>([]);
  const [overlearnIndex, setOverlearnIndex] = useState(0);
  const [overlearnAnswer, setOverlearnAnswer] = useState("");
  const [overlearnFeedback, setOverlearnFeedback] = useState<string | null>(null);
  const overlearnShownAt = useRef<number | null>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reference guidance (AI correction steps)
  const [referenceGuidance, setReferenceGuidance] = useState<AiGuidance | null>(null);

  // AI topic suggestions for next topics to master
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[] | null>(null);
  const [topicSuggestionsLoading, setTopicSuggestionsLoading] = useState(false);

  // Track which concept has already been primed so we don't repeat PRIME/ENCODE
  const primedConceptIdRef = useRef<string | null>(null);
  // Track last question to avoid immediate repetition
  const lastQuestionIdRef = useRef<string | null>(null);
  const lastSuggestionsKeyRef = useRef<string | null>(null);

  // helper: schedule a state transition, cancelling any pending one
  const scheduleTransition = useCallback((fn: () => void, delay: number) => {
    if (stateTimerRef.current !== null) clearTimeout(stateTimerRef.current);
    stateTimerRef.current = setTimeout(() => {
      stateTimerRef.current = null;
      fn();
    }, delay);
  }, []);

  // ---- helpers (refs for stable closures) ----
  const reviewCountRef = useRef(reviewCount);
  reviewCountRef.current = reviewCount;
  const tenantIdRef = useRef(tenantId);
  tenantIdRef.current = tenantId;
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;
  const groupRef = useRef(group);
  groupRef.current = group;
  const languageRef = useRef(language);
  languageRef.current = language;

  // ------------------------------------------------------------------
  // Init user
  // ------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const existing = localStorage.getItem("user_id");
      const tid = tenantIdRef.current ?? "00000000-0000-0000-0000-000000000000";
      const userData = await getOrCreateUser(tid, existing ?? crypto.randomUUID());

      if (userData) {
        localStorage.setItem("user_id", userData.id);
        setStudentId(userData.id);
        setGroup(userData.experimentGroup);
      }
    })();

    // Fetch all concepts for the selector
    (async () => {
      const tid = tenantIdRef.current ?? "00000000-0000-0000-0000-000000000000";
      const concepts = await fetchAllConcepts(tid, "");
      setAllConcepts(concepts);
    })();
  }, []);

  // Retry any pending concept selection once studentId + group are available
  useEffect(() => {
    if (studentId && group && pendingConceptIdRef.current !== null) {
      const pending = pendingConceptIdRef.current;
      pendingConceptIdRef.current = null;
      loadNextConcept(pending ?? undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, group]);

  // ------------------------------------------------------------------
  // Load next concept
  // ------------------------------------------------------------------
  const loadNextConcept = useCallback(async (specificConceptId?: string) => {
    const tid = tenantIdRef.current;
    const sid = studentIdRef.current;
    const grp = groupRef.current;
    if (!tid || !sid || !grp) {
      // User not ready yet — stash the ID and retry when studentId lands
      pendingConceptIdRef.current = specificConceptId ?? undefined;
      return;
    }
    pendingConceptIdRef.current = null;

    let next: Concept | null = null;

    if (specificConceptId) {
      next = await fetchConceptById(tid, sid, specificConceptId);
    } else {
      next = await getNextConceptForUser(tid, sid, grp, reviewCountRef.current, sessionSeedRef.current);
    }

    // Do all async work FIRST, then update state atomically to prevent
    // intermediate renders showing mismatched concept/question/primer.
    if (next) {
      const questions = await fetchQuestionsForConcept(tid, sid, next.id, languageRef.current);

      // pick a question, avoiding the last one shown if possible
      let q: Question | null = null;
      if (questions.length > 1) {
        const candidates = questions.filter((cand) => cand.id !== lastQuestionIdRef.current);
        q = candidates[Math.floor(Math.random() * candidates.length)];
      } else if (questions.length === 1) {
        q = questions[0];
      }

      if (q) {
        lastQuestionIdRef.current = q.id;
      }

      // ---- Atomic batch: all state updates together ----
      setConcept(next);
      setQuestion(q);
      setFeedback(null);
      setAnswer("");
      setStability(null);
      setPredictedRecall(null);
      setOverlearnQuestions([]);
      setOverlearnIndex(0);
      setOverlearnAnswer("");
      setOverlearnFeedback(null);
      setTopicSuggestions(null);
      setTopicSuggestionsLoading(false);
      setWrongAttemptCount(0);

      // Only show PRIME/ENCODE the first time a concept is loaded.
      // When repeating the same concept (below overlearn threshold),
      // skip straight to RETRIEVE with a new question.
      if (primedConceptIdRef.current === next.id) {
        setCognitiveState("RETRIEVE");
        questionShownAt.current = performance.now();
      } else {
        primedConceptIdRef.current = next.id;
        setRetrieveCorrectCount(0); // reset correct count for truly new concept
        setPrimerText(getPrimerText(next, languageRef.current));
        setCognitiveState("PRIME");
      }
    } else {
      setConcept(null);
      setQuestion(null);
      setFeedback(null);
      setAnswer("");
      setStability(null);
      setPredictedRecall(null);
      setOverlearnQuestions([]);
      setOverlearnIndex(0);
      setOverlearnAnswer("");
      setOverlearnFeedback(null);
      setTopicSuggestions(null);
      setTopicSuggestionsLoading(false);
      setWrongAttemptCount(0);
    }
  }, [scheduleTransition]);

  // ------------------------------------------------------------------
  // Load AI topic suggestions (background)
  // ------------------------------------------------------------------
  const loadTopicSuggestions = useCallback(async () => {
    const tid = tenantIdRef.current;
    const sid = studentIdRef.current;
    if (!tid || !sid || allConcepts.length === 0) return;

    const key = `${concept?.id ?? "none"}:${languageRef.current}:${allConcepts.length}`;
    if (lastSuggestionsKeyRef.current === key && topicSuggestions) return;

    setTopicSuggestionsLoading(true);
    try {
      const suggestions = await fetchTopicSuggestions({
        tenantId: tid,
        studentId: sid,
        language: languageRef.current,
        currentConcept: concept
          ? { id: concept.id, name: concept.name, subject: concept.subject }
          : null,
        availableConcepts: allConcepts.map((c) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
        })),
      });

      setTopicSuggestions(suggestions);
      lastSuggestionsKeyRef.current = key;
    } finally {
      setTopicSuggestionsLoading(false);
    }
  }, [allConcepts, concept, topicSuggestions]);

  // ------------------------------------------------------------------
  // Transition helpers
  // ------------------------------------------------------------------
  const transitionToEncode = useCallback(() => {
    const tid = tenantIdRef.current ?? "";
    const sid = studentIdRef.current ?? "";
    const { nextState } = executeSimpleTransition(tid, sid,
      "PRIME",
      { type: "PRIME_VIEWED" },
      { concept, question }
    );
    setCognitiveState(nextState);
  }, [concept, question]);

  const transitionToRetrieve = useCallback(() => {
    const tid = tenantIdRef.current ?? "";
    const sid = studentIdRef.current ?? "";
    const { nextState } = executeSimpleTransition(tid, sid,
      "ENCODE",
      { type: "ENCODE_COMPLETE" },
      { concept, question }
    );
    setCognitiveState(nextState);
    questionShownAt.current = performance.now();
  }, [concept, question]);

  const retryFromReference = useCallback(() => {
    const tid = tenantIdRef.current ?? "";
    const sid = studentIdRef.current ?? "";
    const { nextState } = executeSimpleTransition(tid, sid,
      "REFERENCE",
      { type: "RETRY" },
      { concept, question }
    );
    setAnswer("");
    setFeedback(null);
    setCognitiveState(nextState);
    questionShownAt.current = performance.now();
  }, [concept, question]);

  // ------------------------------------------------------------------
  // Reset session when exiting (prevents stale flashes)
  // ------------------------------------------------------------------
  const resetForExit = useCallback(() => {
    // Cancel any pending scheduled transitions
    if (stateTimerRef.current !== null) {
      clearTimeout(stateTimerRef.current);
      stateTimerRef.current = null;
    }

    primedConceptIdRef.current = null;
    lastQuestionIdRef.current = null;

    setConcept(null);
    setQuestion(null);
    setPrimerText(null);
    setAnswer("");
    setFeedback(null);
    setStability(null);
    setPredictedRecall(null);
    setOverlearnQuestions([]);
    setOverlearnIndex(0);
    setOverlearnAnswer("");
    setOverlearnFeedback(null);
    setReferenceGuidance(null);
    setWrongAttemptCount(0);
    setRetrieveCorrectCount(0);
    setCognitiveState("PRIME");
  }, []);

  // Kick off topic suggestions when a session is completed
  useEffect(() => {
    if (cognitiveState === "COMPLETE") {
      loadTopicSuggestions();
    }
  }, [cognitiveState, loadTopicSuggestions]);

  // ------------------------------------------------------------------
  // RETRIEVE submit
  // ------------------------------------------------------------------
  const handleRetrieveSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const tid = tenantIdRef.current;
      const sid = studentIdRef.current;
      if (!tid || !sid || !concept || !question) return;

      const responseTime =
        questionShownAt.current !== null
          ? Math.round(performance.now() - questionShownAt.current)
          : null;

      // Call service to process the submission (handles DB + engine)
      const { transitionResult: result } = await processRetrieveSubmit({
        tenantId: tid,
        studentId: sid,
        concept,
        question,
        answer,
        responseTime,
        retrieveCorrectCount: retrieveCorrectCountRef.current,
      });

      setFeedback(result.feedback ?? null);
      setStability(result.newStability ?? null);
      setPredictedRecall(result.predictedRecall ?? null);
      setReferenceGuidance(null);
      setReviewCount((c) => c + 1);

      // Track correct answers for this concept cycle
      if (result.correct) {
        setRetrieveCorrectCount((c) => c + 1);
      }

      // ---- transitions driven by engine side-effect signals ----
      if (result.shouldFetchOverlearnQuestions) {
        const extras = await fetchOverlearnQuestions(tid, sid, concept.id, question.id, languageRef.current);

        if (extras.length > 0) {
          setOverlearnQuestions(extras);
          setOverlearnIndex(0);
          setOverlearnAnswer("");
          setOverlearnFeedback(null);
          scheduleTransition(() => {
            setCognitiveState("OVERLEARN");
            overlearnShownAt.current = performance.now();
          }, 800);
        } else {
          scheduleTransition(() => setCognitiveState("COMPLETE"), 800);
        }
      } else if (result.shouldLoadNextConcept) {
        scheduleTransition(() => loadNextConcept(concept.id), 800);
      } else {
        // Wrong answer → REFERENCE: increment attempt counter, fire AI guidance
        if (result.nextState === "REFERENCE") {
          setWrongAttemptCount((c) => c + 1);
          fetchReferenceGuidance({
            tenantId: tid,
            studentId: sid,
            concept,
            question,
            studentAnswer: answer,
            language: languageRef.current,
          }).then((g) => {
            // If AI guidance is available, use it. Otherwise fall back to the
            // concept's static explanation so the user still sees an answer
            // after three wrong attempts.
            if (g.aiGuidance) {
              setReferenceGuidance(g.aiGuidance);
            } else {
              const fallbackExplanation = g.staticExplanation ?? "Review the concept and try again.";
              // Construct a minimal AiGuidance-shaped object so the UI can
              // render a full explanation + steps even when AI is disabled.
              const fallback = {
                explanation: fallbackExplanation,
                steps: [
                  { heading: "", body: fallbackExplanation },
                  { heading: "", body: fallbackExplanation },
                  { heading: "", body: fallbackExplanation },
                ],
                language: languageRef.current,
              } as unknown as typeof referenceGuidance;

              setReferenceGuidance(fallback);
            }
          });
        }
        scheduleTransition(() => setCognitiveState(result.nextState), 800);
      }
    },
    [concept, question, answer, loadNextConcept, scheduleTransition],
  );

  // ------------------------------------------------------------------
  // OVERLEARN submit
  // ------------------------------------------------------------------
  const handleOverlearnSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const tid = tenantIdRef.current;
      const sid = studentIdRef.current;
      if (!tid || !sid || !concept || !question) return;

      const oq = overlearnQuestions[overlearnIndex];
      if (!oq) return;

      const responseTime =
        overlearnShownAt.current !== null
          ? Math.round(performance.now() - overlearnShownAt.current)
          : null;

      // Call service to process the submission (handles DB + engine)
      const { transitionResult: result } = await processOverlearnSubmit({
        tenantId: tid,
        studentId: sid,
        concept,
        question,
        overlearnQuestions,
        overlearnIndex,
        answer: overlearnAnswer,
        responseTime,
      });

      setOverlearnFeedback(result.overlearnFeedback ?? null);

      if (result.nextState === "OVERLEARN" && result.nextOverlearnIndex !== undefined) {
        // Advance to next overlearn question
        scheduleTransition(() => {
          setOverlearnIndex(result.nextOverlearnIndex!);
          setOverlearnAnswer("");
          setOverlearnFeedback(null);
          overlearnShownAt.current = performance.now();
        }, 600);
      } else if (result.nextState === "COMPLETE") {
        scheduleTransition(() => setCognitiveState("COMPLETE"), 600);
      } else {
        // Incorrect — retry same question after delay
        scheduleTransition(() => {
          setOverlearnAnswer("");
          setOverlearnFeedback(null);
          overlearnShownAt.current = performance.now();
        }, 1500);
      }
    },
    [concept, question, overlearnQuestions, overlearnIndex, overlearnAnswer, scheduleTransition],
  );

  // ------------------------------------------------------------------
  // Return combined state + actions
  // ------------------------------------------------------------------
  return {
    tenantId,
    studentId,
    language,
    group,
    allConcepts,
    concept,
    question,
    cognitiveState,
    primerText,
    answer,
    feedback,
    stability,
    predictedRecall,
    overlearnQuestions,
    overlearnIndex,
    overlearnAnswer,
    overlearnFeedback,
    referenceGuidance,
    wrongAttemptCount,
    topicSuggestions,
    topicSuggestionsLoading,

    setAnswer,
    setOverlearnAnswer,
    setLanguage,
    handleRetrieveSubmit,
    handleOverlearnSubmit,
    transitionToEncode,
    transitionToRetrieve,
    retryFromReference,
    loadNextConcept,
    loadTopicSuggestions,
    resetForExit,
  };
}
