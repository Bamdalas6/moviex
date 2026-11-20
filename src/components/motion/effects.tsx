"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 3D tilt + moving glare that follows the pointer (desktop mice only). */
export function Tilt({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  };

  return (
    <div
      ref={ref}
      className={cn("tilt relative", className)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const el = ref.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
        el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
        el.style.setProperty("--gx", `${x * 100}%`);
        el.style.setProperty("--gy", `${y * 100}%`);
        el.style.setProperty("--glare", "1");
      }}
      onPointerLeave={reset}
    >
      {children}
      <span aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0 z-10 rounded-[inherit]" />
    </div>
  );
}

const BURST_COLORS = ["#F43F5E", "#FFB020", "#4B63FF", "#13A574", "#E85A8C", "#ffffff"];

/** A ring of particles that flies out once every time `trigger` changes (skip 0). */
export function Burst({ trigger, colors = BURST_COLORS, count = 8 }: { trigger: number; colors?: string[]; count?: number }) {
  if (!trigger) return null;
  return (
    <span key={trigger} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="burst-dot"
          style={{ ["--angle" as string]: `${(360 / count) * i}deg`, background: colors[i % colors.length] }}
        />
      ))}
    </span>
  );
}

const CONFETTI_COLORS = ["#1d3cf5", "#F43F5E", "#FFB020", "#13A574", "#E85A8C", "#4B63FF", "#E9C46A"];

/** Full-screen confetti shower, rendered once on mount (e.g. after posting a review). */
export function Confetti({ pieces = 90 }: { pieces?: number }) {
  const [items] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 240}px`,
      spin: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720)}deg`,
      dur: `${2 + Math.random() * 1.6}s`,
      delay: `${Math.random() * 0.5}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: Math.random() > 0.7,
    })),
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Reduced motion: drop the pieces on the next tick instead of letting them fall.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setDone(true), reduce ? 0 : 4500);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;
  return (
    <div aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}vw`,
            background: p.color,
            borderRadius: p.round ? "9999px" : undefined,
            ["--dx" as string]: p.dx,
            ["--spin" as string]: p.spin,
            ["--dur" as string]: p.dur,
            ["--delay" as string]: p.delay,
          }}
        />
      ))}
    </div>
  );
}
