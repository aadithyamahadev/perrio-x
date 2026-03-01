import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Concept, Question } from "@/lib/types";
import { AnimatedPage, PhaseProgress, ExitButton } from "@/components/AnimationUtils";

interface Props {
  concept: Concept;
  questions: Question[];
  currentIndex: number;
  answer: string;
  feedback: string | null;
  onAnswerChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onExit: () => void;
  onCorrectSound: () => void;
  onWrongSound: () => void;
}

export function OverlearnView({
  concept,
  questions,
  currentIndex,
  answer,
  feedback,
  onAnswerChange,
  onSubmit,
  onExit,
  onCorrectSound,
  onWrongSound,
}: Props) {
  const oq = questions[currentIndex];
  const isCorrect = feedback?.startsWith("✓");
  const isWrong = feedback && !isCorrect;
  const [shakeKey, setShakeKey] = useState(0);
  const [prevFeedback, setPrevFeedback] = useState<string | null>(null);

  // Play sound on feedback
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
      <PhaseProgress current="OVERLEARN" />

      <span className="phase-badge phase-overlearn animate-bounce-in">
        🔁 OVERLEARN
      </span>

      <p className="text-sm text-[var(--text-muted)] animate-fade-in-up delay-100">
        {concept.subject} — <span className="text-[var(--text-bright)] font-medium">{concept.name}</span>
      </p>

      {/* Reinforcement progress dots */}
      <div className="flex items-center gap-2 animate-fade-in-up delay-100">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              i < currentIndex
                ? "bg-[var(--accent-mint)] scale-100"
                : i === currentIndex
                ? "bg-[var(--accent-indigo)] scale-125 animate-glow-ring"
                : "bg-[rgba(255,255,255,0.12)]"
            }`}
          />
        ))}
        <span className="text-xs text-[var(--text-muted)] ml-2">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <p className="mt-1 text-xl font-semibold text-[var(--text-bright)] max-w-lg text-center animate-fade-in-up delay-200">
        {oq ? oq.question_text : (
          <span className="flex items-center justify-center gap-2">
            <span className="spinner !w-5 !h-5 !border-2" /> Loading...
          </span>
        )}
      </p>

      <form onSubmit={onSubmit} className="flex gap-3 w-full max-w-md animate-fade-in-up delay-200">
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer..."
          className="input-glass flex-1"
          autoFocus
        />
        <button type="submit" className="btn-primary">
          Submit
        </button>
      </form>

      {feedback && (
        <div
          key={shakeKey}
          className={`animate-scale-in ${isWrong ? "animate-shake" : ""}`}
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
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
