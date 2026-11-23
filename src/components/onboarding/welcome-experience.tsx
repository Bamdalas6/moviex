"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type RunwayPoster = { src: string; title: string };

type Phase = "splash" | "morph" | "ready";

const SPLASH_MS = 1300;
const MORPH_MS = 850;
const EASE = "cubic-bezier(0.7, 0, 0.2, 1)";

/** The Marquee app icon: blue rounded square with the ticket glyph. */
function AppIcon({ size, glyph, className }: { size: number; glyph: number; className?: string }) {
  return (
    <span
      className={cn("flex items-center justify-center rounded-[22px] text-white shadow-[0_12px_32px_rgb(29_60_245/0.45)]", className)}
      style={{ width: size, height: size, background: "linear-gradient(150deg, #5b74ff 0%, #1d3cf5 55%, #0f22b8 100%)" }}
    >
      <Icon name="ticket" size={glyph} strokeWidth={2.3} />
    </span>
  );
}

/**
 * Onboarding, in three beats:
 * 1. Splash: the full screen is the brand gradient with the logo breathing.
 * 2. Morph: the splash shrinks into the app icon above the headline while the
 *    welcome copy and buttons rise in.
 * 3. Runway: real posters stream down a tilted 3D plane from a vanishing point,
 *    fading into black behind the copy, on a loop.
 * Tap the splash to skip; reduced-motion visitors get the final screen at once.
 */
export function WelcomeExperience({ posters }: { posters: RunwayPoster[] }) {
  const [phase, setPhase] = useState<Phase>("splash");
  const splashRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const morph = () => {
    if (started.current) return;
    started.current = true;
    const splash = splashRef.current;
    const icon = iconRef.current;
    if (!splash || !icon) {
      setPhase("ready");
      return;
    }
    const to = icon.getBoundingClientRect();
    setPhase("morph");
    const anim = splash.animate(
      [
        { top: "0px", left: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: "0px" },
        { top: `${to.top}px`, left: `${to.left}px`, width: `${to.width}px`, height: `${to.height}px`, borderRadius: "22px" },
      ],
      { duration: MORPH_MS, easing: EASE, fill: "forwards" },
    );
    glyphRef.current?.animate([{ transform: "scale(1)" }, { transform: `scale(${(to.width * 0.5) / 96})` }], {
      duration: MORPH_MS,
      easing: EASE,
      fill: "forwards",
    });
    anim.onfinish = () => setPhase("ready");
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (reduce) {
        started.current = true;
        setPhase("ready");
      } else morph();
    }, reduce ? 0 : SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const shown = phase !== "splash";
  // Two copies of the list: the track scrolls by exactly one copy, then repeats.
  const tiles = [...posters, ...posters];
  const rise = (delay: "delay-150" | "delay-250" | "delay-350") =>
    cn("transition-[opacity,transform] duration-700 ease-out", shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0", delay);

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-black text-white" style={{ colorScheme: "dark" }}>
      {/* Poster runway */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[64%] overflow-hidden transition-opacity duration-1000 [perspective:620px] md:[perspective:1000px]",
          shown ? "opacity-100" : "opacity-0",
        )}
        style={{
          perspectiveOrigin: "50% 0%",
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 80%, transparent 100%)",
        }}
      >
        {/*
          The tilted plane is a clipping window hinged at its bottom edge (nearest the viewer). The track inside
          holds the posters twice and scrolls down by one copy per loop; one copy is taller than the window, so
          the window is always full and tiles are clipped cleanly as they pass the near edge.
        */}
        <div
          className="absolute bottom-0 left-1/2 h-[min(1400px,370vw)] w-[150%] overflow-hidden md:h-[min(1400px,108vw)] md:w-[124%]"
          style={{ transform: "translateX(-50%) rotateX(60deg)", transformOrigin: "50% 100%" }}
        >
          <div className={cn("absolute inset-x-0 top-0", shown ? "runway-in" : "opacity-0")}>
            <div className="runway-track grid grid-cols-5 gap-2.5 md:grid-cols-8 md:gap-4">
              {tiles.map((p, i) => (
                <div key={i} className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/5 shadow-[0_8px_24px_rgb(0_0_0/0.5)] md:rounded-2xl">
                  <Image src={p.src} alt="" fill unoptimized loading="eager" sizes="200px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Brand glow behind the icon */}
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[58%] transition-opacity duration-1000", shown ? "opacity-100" : "opacity-0")}
        style={{
          background:
            "radial-gradient(55% 40% at 50% 30%, rgb(29 60 245 / 0.3), transparent 70%), linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.75) 28%, #000 48%)",
        }}
      />

      {/* Welcome copy */}
      <main id="main" className="absolute inset-x-0 bottom-0 flex flex-col items-center px-7 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
        <div ref={iconRef} className={cn("mb-5", phase === "ready" ? "opacity-100" : "opacity-0")}>
          <AppIcon size={76} glyph={38} />
        </div>
        <h1 className={cn("text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[34px]", rise("delay-150"))}>Welcome to Marquee.</h1>
        <p className={cn("mt-3 max-w-[330px] text-[15.5px] leading-relaxed text-white/70", rise("delay-250"))}>
          Discover Nollywood films you&apos;ll love, rate what you watch, and follow the stars behind them.
        </p>
        <div className={cn("mt-8 flex w-full max-w-[340px] flex-col gap-2.5", rise("delay-350"))}>
          <Link
            href="/signup"
            className="ripple flex h-[52px] items-center justify-center rounded-full bg-white text-[16px] font-semibold text-[#111] transition hover:-translate-y-px active:scale-[0.97]"
          >
            Create a free account
          </Link>
          <Link
            href="/login"
            className="ripple flex h-[52px] items-center justify-center rounded-full bg-white/10 text-[16px] font-semibold text-white transition hover:bg-white/15 active:scale-[0.97]"
          >
            Log in
          </Link>
          <Link href="/" className="mt-1 py-2 text-[14px] font-medium text-white/60 underline-offset-4 hover:text-white hover:underline">
            Just browsing
          </Link>
        </div>
      </main>

      {/* Splash: full screen, then morphs into the icon above */}
      {phase !== "ready" && (
        <div
          ref={splashRef}
          role="presentation"
          onClick={morph}
          className="fixed top-0 left-0 z-10 flex h-dvh w-screen cursor-pointer items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(170deg, #5b74ff 0%, #1d3cf5 45%, #0f22b8 100%)" }}
        >
          <span ref={glyphRef} className="flex items-center justify-center text-white">
            <span className={phase === "splash" ? "splash-breathe" : undefined}>
              <Icon name="ticket" size={96} strokeWidth={2.1} />
            </span>
          </span>
          <span className="sr-only">Marquee</span>
        </div>
      )}
    </div>
  );
}
