"use client";

import { useCallback, useEffect, useState } from "react";
import { usePerrioStateMachine } from "@/hooks/usePerrioStateMachine";
import { useSound } from "@/hooks/useSound";
import { PrimeView } from "@/components/PrimeView";
import { EncodeView } from "@/components/EncodeView";
import { RetrieveView } from "@/components/RetrieveView";
import { ReferenceView } from "@/components/ReferenceView";
import { OverlearnView } from "@/components/OverlearnView";
import { CompleteView } from "@/components/CompleteView";
import { TopicSelector } from "@/components/TopicSelector";
import { BackgroundOrbs, Confetti } from "@/components/AnimationUtils";

export default function Home() {
  const sm = usePerrioStateMachine();
  const { play } = useSound();
  const [started, setStarted] = useState(false);
  const [exited, setExited] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleExit = useCallback(() => {
    play("whoosh");
    // Load suggestions for the current concept before resetting,
    // so the goodbye screen can still show them.
    sm.loadTopicSuggestions().finally(() => {
      sm.resetForExit();
      setStarted(false);
      setExited(true);
    });
  }, [sm, play]);

  useEffect(() => {
    if (exited) {
      sm.loadTopicSuggestions();
    }
  }, [exited, sm.loadTopicSuggestions]);

  // Trigger confetti on COMPLETE
  useEffect(() => {
    if (sm.cognitiveState === "COMPLETE") {
      setShowConfetti(true);
      play("complete");
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [sm.cognitiveState, play]);

  // Show loading spinner until user is initialized and concepts are fetched
  if (!sm.studentId || sm.allConcepts.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center relative">
        <BackgroundOrbs />
        <div className="flex flex-col items-center gap-5 z-10 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-teal)] bg-clip-text text-transparent">
            PERRIO-X
          </h1>
          <div className="spinner" />
          <p className="text-sm text-[var(--text-muted)]">Preparing your learning session...</p>
        </div>
      </div>
    );
  }

  // Goodbye screen
  if (exited) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 relative">
        <BackgroundOrbs />
        <div className="flex flex-col items-center gap-5 z-10 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-teal)] bg-clip-text text-transparent">
            PERRIO-X
          </h1>
          <div className="text-center animate-fade-in-up delay-200">
            <p className="text-2xl font-semibold text-[var(--text-bright)]">Great work! See you next time 👋</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">Your progress has been saved</p>
          </div>

          <div className="mt-4 w-full max-w-xl space-y-3 animate-fade-in-up delay-300">
            <p className="phase-badge phase-complete mx-auto w-fit">
              ✨ AI Suggested Next Topics
            </p>
            <div className="glass-card p-5">
              {sm.topicSuggestionsLoading ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="spinner !w-5 !h-5 !border-2" />
                  <p className="text-sm text-[var(--text-muted)]">Personalizing your next steps...</p>
                </div>
              ) : sm.topicSuggestions && sm.topicSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {sm.topicSuggestions.map((s, i) => (
                    <div key={s.conceptId} className="suggestion-card animate-slide-left" style={{ animationDelay: `${i * 0.1}s` }}>
                      <p className="text-sm font-semibold text-[var(--accent-indigo)]">{s.title}</p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-[var(--accent-violet)]">{s.subject}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">{s.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] text-center py-2">
                  No AI suggestions right now. Pick any topic to continue when you return.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => { play("click"); setExited(false); setStarted(false); }}
            className="btn-primary mt-4 animate-fade-in-up delay-400"
          >
            🚀 Study Again
          </button>
        </div>
      </div>
    );
  }

  // Show topic selector before any concept is loaded
  if (!started || !sm.concept) {
    return (
      <TopicSelector
        concepts={sm.allConcepts}
        language={sm.language}
        onLanguageChange={sm.setLanguage}
        onSelect={(conceptId) => {
          play("click");
          setStarted(true);
          sm.loadNextConcept(conceptId);
        }}
        onRandom={() => {
          play("whoosh");
          setStarted(true);
          sm.loadNextConcept();
        }}
      />
    );
  }

  return (
    <>
      <BackgroundOrbs />
      {showConfetti && <Confetti count={50} />}

      {sm.cognitiveState === "PRIME" && (
        <PrimeView
          concept={sm.concept}
          primerText={sm.primerText}
          language={sm.language}
          onContinue={() => { play("whoosh"); sm.transitionToEncode(); }}
        />
      )}

      {sm.cognitiveState === "ENCODE" && (
        <EncodeView
          concept={sm.concept}
          language={sm.language}
          onContinue={() => { play("whoosh"); sm.transitionToRetrieve(); }}
        />
      )}

      {sm.cognitiveState === "RETRIEVE" && (
        <RetrieveView
          concept={sm.concept}
          question={sm.question}
          language={sm.language}
          answer={sm.answer}
          feedback={sm.feedback}
          stability={sm.stability}
          predictedRecall={sm.predictedRecall}
          onAnswerChange={sm.setAnswer}
          onSubmit={sm.handleRetrieveSubmit}
          onExit={handleExit}
          onCorrectSound={() => play("correct")}
          onWrongSound={() => play("wrong")}
        />
      )}

      {sm.cognitiveState === "REFERENCE" && (
        <ReferenceView
          concept={sm.concept}
          question={sm.question}
          language={sm.language}
          referenceGuidance={sm.referenceGuidance}
          wrongAttemptCount={sm.wrongAttemptCount}
          onRetry={() => { play("click"); sm.retryFromReference(); }}
          onExit={handleExit}
        />
      )}

      {sm.cognitiveState === "OVERLEARN" && (
        <OverlearnView
          concept={sm.concept}
          questions={sm.overlearnQuestions}
          currentIndex={sm.overlearnIndex}
          answer={sm.overlearnAnswer}
          feedback={sm.overlearnFeedback}
          onAnswerChange={sm.setOverlearnAnswer}
          onSubmit={sm.handleOverlearnSubmit}
          onExit={handleExit}
          onCorrectSound={() => play("correct")}
          onWrongSound={() => play("wrong")}
        />
      )}

      {sm.cognitiveState === "COMPLETE" && (
        <CompleteView
          concept={sm.concept}
          stability={sm.stability}
          suggestions={sm.topicSuggestions}
          suggestionsLoading={sm.topicSuggestionsLoading}
          onRefreshSuggestions={sm.loadTopicSuggestions}
          onNext={() => { play("click"); setStarted(false); }}
          onExit={handleExit}
        />
      )}
    </>
  );
}
