import type { Concept } from "@/lib/types";
import type { Language } from "@/services/language";
import { AnimatedPage, PhaseProgress, useTypingEffect } from "@/components/AnimationUtils";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

const UI_LABELS: Record<Language, { phase: string; btn: string }> = {
  en: { phase: "PRIME", btn: "Continue →" },
  hi: { phase: "प्राइम", btn: "आगे बढ़ें →" },
  te: { phase: "ప్రైమ్", btn: "కొనసాగించు →" },
};

interface Props {
  concept: Concept;
  primerText: string | null;
  language: Language;
  onContinue: () => void;
}

export function PrimeView({ concept, primerText, language, onContinue }: Props) {
  const { speak, stop } = useTextToSpeech();
  const labels = UI_LABELS[language] ?? UI_LABELS.en;
  const { displayed, done, skip } = useTypingEffect(primerText, 14);
  const safeDisplayed = displayed ?? "";

  return (
    <AnimatedPage>
      <PhaseProgress current="PRIME" />

      <span className="phase-badge phase-prime animate-bounce-in">🧠 {labels.phase}</span>

      <p className="text-sm text-[var(--text-muted)] animate-fade-in-up delay-100">
        {concept.subject} — <span className="text-[var(--text-bright)] font-medium">{concept.name}</span>
      </p>

      <div
        className="max-w-lg glass-card p-7 text-center animate-fade-in-up delay-200 cursor-pointer mt-4"
        onClick={() => {
          if (!done) skip();
        }}
        onPointerDown={() => {
          if (!done) skip();
        }}
      >
        <div>
          {safeDisplayed.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className={`text-base leading-relaxed text-[var(--text-bright)] ${i > 0 ? "mt-4" : ""}`}
            >
              {paragraph}
            </p>
          ))}

          {!done && <span className="inline-block w-[2px] h-5 bg-[var(--accent-sky)] ml-1 animate-pulse" />}

          {/* hint removed: clicking/touching the glossy box skips typing */}
        </div>

        {primerText && (
          <div className="flex justify-center gap-3 mt-4">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                speak(primerText, language);
              }}
              className="btn-coral glossy-btn text-xs px-3 py-1.5 rounded-full shadow-md shadow-black/40 transition"
            >
              Play primer audio
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                stop();
              }}
              className="btn-coral glossy-btn text-xs px-3 py-1.5 rounded-full shadow-md shadow-black/40 transition"
            >
              Stop audio
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className={`btn-primary animate-fade-in-up delay-300 ${!done ? "opacity-50 pointer-events-none" : ""}`}
      >
        {labels.btn}
      </button>
    </AnimatedPage>
  );
}
