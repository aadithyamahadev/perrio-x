"use client";

import { useCallback, useRef } from "react";

/** Minimal Web Audio API sound effects — no external dependencies */

type SoundName = "correct" | "wrong" | "complete" | "click" | "whoosh" | "levelUp";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume = 0.3,
  rampDown = true,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playCorrect(ctx: AudioContext) {
  // Two-tone ascending chime
  playTone(ctx, 523.25, "sine", 0.15, 0.25); // C5
  setTimeout(() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, 120);
}

function playWrong(ctx: AudioContext) {
  // Low descending buzz
  playTone(ctx, 220, "square", 0.08, 0.12);
  setTimeout(() => playTone(ctx, 180, "square", 0.12, 0.1), 100);
}

function playComplete(ctx: AudioContext) {
  // Triumphant 4-note arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(ctx, freq, "sine", 0.3, 0.2), i * 130);
  });
}

function playClick(ctx: AudioContext) {
  playTone(ctx, 800, "sine", 0.05, 0.1);
}

function playWhoosh(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

function playLevelUp(ctx: AudioContext) {
  const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4 C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(ctx, freq, "triangle", 0.25, 0.18), i * 100);
  });
}

const SOUNDS: Record<SoundName, (ctx: AudioContext) => void> = {
  correct: playCorrect,
  wrong: playWrong,
  complete: playComplete,
  click: playClick,
  whoosh: playWhoosh,
  levelUp: playLevelUp,
};

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((name: SoundName) => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = getAudioContext();
      }
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      SOUNDS[name](ctx);
    } catch {
      // Silently fail — sounds are non-essential
    }
  }, []);

  return { play };
}
