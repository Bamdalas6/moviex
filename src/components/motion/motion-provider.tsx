"use client";

import { useEffect } from "react";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * App-wide motion behaviour, mounted once in the app layout:
 *
 * 1. Scroll reveal: every element with `data-reveal` that starts below the fold
 *    animates in (rise, scale or slide) the moment it scrolls into view, and
 *    elements arriving in the same frame are staggered. Content already on screen
 *    never animates, so nothing flashes on load or navigation.
 * 2. Click ripple: pressing any `.ripple` element spawns an ink circle from the
 *    pointer position.
 *
 * The reveal runs on the Web Animations API instead of toggling attributes, so it
 * never touches server-rendered markup (no hydration mismatches). A
 * MutationObserver picks up content streamed in or rendered by navigation.
 */
const FROM: Record<string, Keyframe> = {
  "": { opacity: 0, transform: "translateY(32px)" },
  scale: { opacity: 0, transform: "scale(0.9)" },
  left: { opacity: 0, transform: "translateX(-36px)" },
};

export function MotionProvider() {
  useEffect(() => {
    if (reduceMotion()) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      visible.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      visible.forEach((el, i) => {
        io.unobserve(el);
        const from = FROM[el.dataset.reveal ?? ""] ?? FROM[""]!;
        el.animate([from, { opacity: 1, transform: "none" }], {
          duration: 700,
          delay: Math.min(i * 70, 490),
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          // Hold the hidden first frame through the stagger delay.
          fill: "backwards",
        });
      });
    });

    const scan = () => {
      const fold = window.innerHeight;
      const right = window.innerWidth;
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        const rect = el.getBoundingClientRect();
        // Streamed content first lands in a hidden container (zero-size); wait until it's laid out.
        if (!rect.width && !rect.height) return;
        seen.add(el);
        // Only animate what the visitor can't see yet (below the fold, or off to the side in a rail).
        if (rect.top > fold || rect.left > right) io.observe(el);
      });
    };

    let queued = 0;
    const queueScan = () => {
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(scan);
    };
    // New nodes (navigation, streaming) trigger a scan. Suspense reveals un-hide
    // content by flipping a style attribute instead, which a scroll catches.
    const mo = new MutationObserver(queueScan);
    scan();
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", queueScan, { passive: true });

    const onPointerDown = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(".ripple");
      if (!target || event.button !== 0) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const ink = document.createElement("span");
      ink.className = "ripple-ink";
      ink.style.width = ink.style.height = `${size}px`;
      ink.style.left = `${event.clientX - rect.left}px`;
      ink.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(ink);
      ink.addEventListener("animationend", () => ink.remove(), { once: true });
    };
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", queueScan);
      cancelAnimationFrame(queued);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
