import { useCallback, useRef } from "react";
import type { Language } from "@/services/language";

function getBrowserSpeech(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

function mapLanguageToBCP47(language: Language): string {
  switch (language) {
    case "hi":
      return "hi-IN";
    case "te":
      return "te-IN";
    case "en":
    default:
      return "en-IN";
  }
}

export function useTextToSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    const synth = getBrowserSpeech();
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
    }
  }, []);

  const speak = useCallback(
    async (text: string, language: Language) => {
      if (!text.trim()) return;

      // Always stop any current audio/speech first
      stop();

      // 1) Try backend TTS first (Qwen/HF via /api/tts).
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.startsWith("audio/")) {
            // Backend returned JSON or text (error/info) instead of audio —
            // treat as failure and fall back to browser TTS.
            // eslint-disable-next-line no-console
            console.warn("TTS backend returned non-audio content-type:", contentType);
          } else {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            urlRef.current = url;

            const audio = new Audio(url);
            audioRef.current = audio;
            await audio.play().catch(() => {});
            return;
          }
        }

        // If backend returns an error, fall through to browser speech.
        // eslint-disable-next-line no-console
        console.warn("TTS backend returned non-OK status:", res.status);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("TTS backend call failed, falling back to browser speech:", err);
      }

      // 2) Fallback: browser SpeechSynthesis (best-effort).
      const synth = getBrowserSpeech();
      if (!synth) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = mapLanguageToBCP47(language);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      synth.speak(utterance);
    },
    [stop]
  );

  return { speak, stop };
}

