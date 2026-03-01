import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Concept, Question } from "@/lib/types";
import type { Language } from "@/services/language";
import { AnimatedPage, PhaseProgress, ExitButton, StabilityRing, AnimatedPercent } from "@/components/AnimationUtils";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface Props {
  concept: Concept;
  question: Question | null;
  language: Language;
  answer: string;
  feedback: string | null;
  stability: number | null;
  predictedRecall: number | null;
  onAnswerChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onExit: () => void;
  onCorrectSound: () => void;
  onWrongSound: () => void;
}

export function RetrieveView({
  concept,
  question,
  language,
  answer,
  feedback,
  stability,
  predictedRecall,
  onAnswerChange,
  onSubmit,
  onExit,
  onCorrectSound,
  onWrongSound,
}: Props) {
  const { speak, stop } = useTextToSpeech();
  const isCorrect = feedback?.startsWith("✓");
  const isWrong = feedback && !isCorrect;
  const [shakeKey, setShakeKey] = useState(0);
  const [prevFeedback, setPrevFeedback] = useState<string | null>(null);

  // Play sound when feedback changes
  useEffect(() => {
    if (feedback && feedback !== prevFeedback) {
      if (feedback.startsWith("✓")) {
        onCorrectSound();
      } else {
        onWrongSound();
        setShakeKey((k) => k + 1);
      }
      setPrevFeedback(feedback);
    }
  }, [feedback, prevFeedback, onCorrectSound, onWrongSound]);

  return (
    <AnimatedPage>
      <ExitButton onClick={onExit} />
      <PhaseProgress current="RETRIEVE" />

      <span className="phase-badge phase-retrieve animate-bounce-in">
        🎯 RETRIEVE
      </span>

      <div className="text-center animate-fade-in-up delay-100">
        <p className="text-sm text-[var(--text-muted)]">
          {concept.subject} — <span className="text-[var(--text-bright)] font-medium">{concept.name}</span>
        </p>
        <div className="mt-3">
          <p className="text-xl font-semibold text-[var(--text-bright)] max-w-lg mx-auto">
            {question ? question.question_text : (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner !w-5 !h-5 !border-2" /> Loading question...
              </span>
            )}
          </p>
        </div>
      </div>

      {question && (
        <div className="mt-3 flex justify-center gap-3 animate-fade-in-up delay-150">
          <button
            type="button"
            onClick={() => speak(question.question_text, language)}
            className="btn-coral glossy-btn text-xs px-3 py-1.5 rounded-full shadow-md shadow-black/40 transition"
          >
            ▶ Play question audio
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-3 w-full max-w-md animate-fade-in-up delay-200">
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer..."
          className="input-glass flex-1"
          autoFocus
        />
        <button type="submit" className="btn-coral glossy-btn">
          Submit
        </button>
      </form>

      {feedback && (
        <div
          key={shakeKey}
          className={`flex flex-col items-center gap-3 animate-scale-in ${isWrong ? "animate-shake" : ""}`}
          onClick={stop}
        >
          <div className={`glass-card px-6 py-3 text-center ${
            isCorrect
              ? "!border-[var(--accent-mint)] animate-pulse-glow"
              : "!border-[var(--accent-rose)]"
          }`}>
            <p className={`text-lg font-bold ${
              isCorrect ? "text-[var(--accent-mint)]" : "text-[var(--accent-rose)]"
            }`}>
              {isCorrect ? "✨ Correct!" : "✗ Not quite..."}
            </p>
            {feedback.length > 2 && (
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {feedback.replace(/^[✓✗]\s*/, "")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6 mt-2">
            {stability !== null && (
              <StabilityRing value={stability} />
            )}
            {predictedRecall !== null && (
              <div className="flex flex-col items-center gap-1">
                <AnimatedPercent value={predictedRecall} />
                <span className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Recall
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
