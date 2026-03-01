import type { Concept } from "@/lib/types";
import type { Language } from "@/services/language";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "@/services/language";
import { BackgroundOrbs, AnimatedPage } from "@/components/AnimationUtils";

interface Props {
  concepts: Concept[];
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelect: (conceptId: string) => void;
  onRandom: () => void;
}

export function TopicSelector({ concepts, language, onLanguageChange, onSelect, onRandom }: Props) {
  // Group by subject
  const grouped: Record<string, Concept[]> = {};
  for (const c of concepts) {
    if (!grouped[c.subject]) grouped[c.subject] = [];
    grouped[c.subject].push(c);
  }
  const subjects = Object.keys(grouped).sort();

  return (
    <>
      <BackgroundOrbs />
      <AnimatedPage>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-teal)] bg-clip-text text-transparent animate-fade-in-up">
          PERRIO-X
        </h1>

        {/* Language switcher */}
        <div className="flex items-center gap-2 animate-fade-in-up delay-100">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`lang-pill ${language === lang ? "lang-pill-active" : ""}`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>

        <p className="text-[var(--text-muted)] text-sm animate-fade-in-up delay-200">
          Choose a topic to study, or let the scheduler decide
        </p>

        <button
          onClick={onRandom}
          className="btn-primary animate-fade-in-up delay-200 animate-glow-ring"
        >
          ⚡ Auto-schedule next topic
        </button>

        <div className="w-full max-w-lg animate-fade-in-up delay-300">
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">or pick a topic</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />
          </div>

          <div className="flex flex-col gap-6">
            {subjects.map((subject, si) => (
              <div key={subject} className="animate-fade-in-up" style={{ animationDelay: `${0.3 + si * 0.1}s` }}>
                <p className="subject-header mb-3">
                  {subject}
                </p>
                <div className="flex flex-col gap-2">
                  {grouped[subject].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className="topic-card"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedPage>
    </>
  );
}
