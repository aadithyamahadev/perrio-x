import type { Concept } from "@/lib/types";
import type { TopicSuggestion } from "@/services/perrioService";
import { AnimatedPage, PhaseProgress, StabilityRing } from "@/components/AnimationUtils";

interface Props {
  concept: Concept;
  stability: number | null;
  suggestions: TopicSuggestion[] | null;
  suggestionsLoading: boolean;
  onRefreshSuggestions: () => void;
  onNext: () => void;
  onExit: () => void;
}

export function CompleteView({ concept, stability, suggestions, suggestionsLoading, onRefreshSuggestions, onNext, onExit }: Props) {
  return (
    <AnimatedPage>
      <PhaseProgress current="COMPLETE" />

      <span className="phase-badge phase-complete animate-bounce-in">
        🏆 COMPLETE
      </span>

      <p className="text-sm text-[var(--text-muted)] animate-fade-in-up delay-100">
        {concept.subject} — <span className="text-[var(--text-bright)] font-medium">{concept.name}</span>
      </p>

      <div className="text-center animate-scale-in delay-200">
        <p className="text-3xl font-bold text-[var(--accent-mint)] animate-float">
          ✨ Concept Mastered!
        </p>
      </div>

      {stability !== null && (
        <div className="animate-fade-in-up delay-300">
          <StabilityRing value={stability} />
        </div>
      )}

      <div className="flex gap-3 mt-2 animate-fade-in-up delay-300">
        <button onClick={onNext} className="btn-success">
          🎯 Next Topic
        </button>
        <button onClick={onExit} className="btn-secondary">
          Exit Session
        </button>
      </div>

      <div className="mt-6 w-full max-w-xl space-y-3 animate-fade-in-up delay-400">
        <div className="flex items-center justify-between">
          <span className="phase-badge phase-prime">
            ✨ AI Suggested Next
          </span>
          <button
            onClick={onRefreshSuggestions}
            className="text-xs text-[var(--accent-indigo)] hover:text-[var(--accent-violet)] transition-colors disabled:text-[var(--text-muted)]"
            disabled={suggestionsLoading}
          >
            ↻ Refresh
          </button>
        </div>
        <div className="glass-card p-5">
          {suggestionsLoading ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="spinner !w-5 !h-5 !border-2" />
              <p className="text-sm text-[var(--text-muted)]">Personalizing your next steps...</p>
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={s.conceptId} className="suggestion-card animate-slide-left" style={{ animationDelay: `${i * 0.1}s` }}>
                  <p className="text-sm font-semibold text-[var(--accent-indigo)]">{s.title}</p>
                  <p className="text-[0.65rem] uppercase tracking-wider text-[var(--accent-violet)]">{s.subject}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">{s.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-2">
              No AI suggestions right now. Pick any topic to continue.
            </p>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
