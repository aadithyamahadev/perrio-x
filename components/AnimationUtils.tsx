"use client";

import { useEffect, useState, useCallback } from "react";

/* ===== Confetti burst ===== */

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

const CONFETTI_COLORS = [
  "#818cf8", "#a78bfa", "#34d399", "#fbbf24",
  "#fb923c", "#38bdf8", "#f472b6", "#2dd4bf",
];

export function Confetti({ count = 40 }: { count?: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const arr: ConfettiPiece[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 0.6,
      });
    }
    setPieces(arr);
  }, [count]);

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </>
  );
}

/* ===== Floating Orbs background ===== */

export function BackgroundOrbs() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </>
  );
}

/* ===== Phase Progress Indicator ===== */

const PHASES = ["PRIME", "ENCODE", "RETRIEVE", "OVERLEARN", "COMPLETE"] as const;
type Phase = (typeof PHASES)[number] | "REFERENCE";

const PHASE_COLORS: Record<string, string> = {
  PRIME: "#38bdf8",
  ENCODE: "#c084fc",
  RETRIEVE: "#fbbf24",
  REFERENCE: "#fb7185",
  OVERLEARN: "#818cf8",
  COMPLETE: "#34d399",
};

export function PhaseProgress({ current }: { current: Phase }) {
  const idx = current === "REFERENCE"
    ? PHASES.indexOf("RETRIEVE")
    : PHASES.indexOf(current as (typeof PHASES)[number]);
  const pct = idx >= 0 ? ((idx + 1) / PHASES.length) * 100 : 50;

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-2">
        {PHASES.map((p, i) => {
          const isActive = p === current || (current === "REFERENCE" && p === "RETRIEVE");
          const isDone = i < idx || (current === "REFERENCE" && p === "RETRIEVE" && i <= idx);
          return (
            <span
              key={p}
              className="text-[0.55rem] font-mono uppercase tracking-wider transition-colors duration-300"
              style={{
                color: isActive
                  ? PHASE_COLORS[current]
                  : isDone
                  ? "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.15)",
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Stability Ring (SVG) ===== */

export function StabilityRing({
  value,
  label = "Stability",
}: {
  value: number;
  label?: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 10);
  const pct = clamped / 10;
  const offset = circumference * (1 - pct);

  const color =
    pct > 0.7 ? "#34d399" : pct > 0.4 ? "#fbbf24" : "#fb7185";

  return (
    <div className="flex flex-col items-center gap-1 animate-scale-in">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stability-ring"
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="44"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="16"
          fontWeight="700"
          fontFamily="var(--font-geist-mono), monospace"
        >
          {clamped.toFixed(1)}
        </text>
      </svg>
      <span className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider font-mono">
        {label}
      </span>
    </div>
  );
}

/* ===== Animated Counter (recall %) ===== */

export function AnimatedPercent({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Math.round(value * 100);
    const step = target > display ? 1 : -1;
    if (display === target) return;
    const timer = setInterval(() => {
      setDisplay((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [value, display]);

  return (
    <span className="font-mono font-bold text-[var(--accent-teal)]">
      {display}%
    </span>
  );
}

/* ===== Exit Button ===== */

export function ExitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-5 right-6 z-50 btn-secondary !px-4 !py-1.5 !text-xs !rounded-full opacity-60 hover:opacity-100 transition-opacity"
    >
      ✕ Exit
    </button>
  );
}

/* ===== Use Page Transition Hook ===== */

export function usePageTransition() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return visible;
}

/* ===== Wrapper that animates children on mount ===== */

export function AnimatedPage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const visible = usePageTransition();

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-6 p-8 relative z-10 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ===== Typing effect for primer text ===== */

export function useTypingEffect(text: string | null, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  const skip = useCallback(() => {
    if (text) {
      setDisplayed(text);
      setDone(true);
    }
  }, [text]);

  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done, skip };
}
