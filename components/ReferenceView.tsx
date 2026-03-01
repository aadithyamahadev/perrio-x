import type { Concept, Question } from "@/lib/types";
import type { AiGuidance } from "@/services/perrioService";
import type { Language } from "@/services/language";
import { AnimatedPage, PhaseProgress, ExitButton } from "@/components/AnimationUtils";

const UI_LABELS: Record<Language, { incorrect: string; hint: string; tryAgain: string; step: string; loading: string; attemptsLeft: (n: number) => string }> = {
  en: { incorrect: "✗ Incorrect", hint: "Hint", tryAgain: "Try Again →", step: "Step", loading: "Generating guidance...", attemptsLeft: (n) => `${n} more attempt${n === 1 ? '' : 's'} before the answer is shown` },
  hi: { incorrect: "✗ गलत", hint: "संकेत", tryAgain: "पुनः प्रयास करें →", step: "चरण", loading: "मार्गदर्शन तैयार हो रहा है...", attemptsLeft: (n) => `उत्तर दिखाने से पहले ${n} और प्रयास` },
  te: { incorrect: "✗ తప్పు", hint: "సూచన", tryAgain: "మళ్ళీ ప్రయత్నించు →", step: "దశ", loading: "మార్గదర్శనం తయారవుతోంది...", attemptsLeft: (n) => `సమాధానం చూపే ముందు ${n} ఇంకా ప్రయత్నాలు` },
};

interface Props {
  concept: Concept;
  question: Question | null;
  language: Language;
  referenceGuidance: AiGuidance | null;
  wrongAttemptCount: number;
  onRetry: () => void;
  onExit: () => void;
}

export function ReferenceView({ concept, question, language, referenceGuidance, wrongAttemptCount, onRetry, onExit }: Props) {
  const labels = UI_LABELS[language] ?? UI_LABELS.en;
  const showAnswer = wrongAttemptCount >= 3;

  return (
    <AnimatedPage>
      <ExitButton onClick={onExit} />
      <PhaseProgress current="REFERENCE" />

      <span className="phase-badge phase-reference animate-bounce-in">
        📖 REFERENCE
      </span>

      <p className="text-sm text-[var(--text-muted)] animate-fade-in-up delay-100">
        {concept.subject} — <span className="text-[var(--text-bright)] font-medium">{concept.name}</span>
      </p>

      <p className="text-lg font-bold text-[var(--accent-rose)] animate-shake">
        {labels.incorrect}
      </p>

      {/* AI Guidance — 3-step correction (only after 3 wrong attempts) */}
      {showAnswer && referenceGuidance ? (
        <div className="max-w-lg w-full space-y-3 animate-fade-in-up delay-200">
          <div className="glass-card p-5 text-center !border-[var(--accent-rose)]">
            <p className="text-base text-[var(--text-bright)] leading-relaxed">{referenceGuidance.explanation}</p>
          </div>
          {referenceGuidance.steps.map((step, i) => (
            <div
              key={i}
              className="glass-card p-5 animate-slide-left"
              style={{ animationDelay: `${0.3 + i * 0.15}s` }}
            >
              <p className="text-[0.65rem] font-mono uppercase tracking-wider text-[var(--accent-violet)] mb-1">
                {labels.step} {i + 1}
              </p>
              <p className="text-sm font-semibold text-[var(--text-bright)]">{step.heading}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      ) : showAnswer ? (
        <div className="max-w-lg glass-card p-5 text-center animate-fade-in-up delay-200 !border-[var(--accent-amber)]">
          <p className="text-sm font-semibold text-[var(--accent-amber)]">{labels.hint}</p>
          <p className="mt-2 text-base text-[var(--text-bright)]">
            {question?.hint ?? "Review the concept and try again."}
          </p>
        </div>
      ) : (
        <div className="max-w-lg glass-card p-5 text-center animate-fade-in-up delay-200 !border-[var(--accent-amber)]">
          <p className="text-sm font-semibold text-[var(--accent-amber)]">💡 {labels.hint}</p>
          <p className="mt-2 text-base text-[var(--text-bright)]">
            {question?.hint ?? "Think about the method and try again."}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i < wrongAttemptCount
                    ? "bg-[var(--accent-rose)]"
                    : "bg-[rgba(255,255,255,0.15)]"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {labels.attemptsLeft(3 - wrongAttemptCount)}
          </p>
        </div>
      )}

      <button onClick={onRetry} className="btn-coral animate-fade-in-up delay-300">
        {labels.tryAgain}
      </button>
    </AnimatedPage>
  );
}
