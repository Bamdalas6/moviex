"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, StarGlyph } from "@/components/icons";
import { Poster } from "@/components/ui/poster";
import { buttonClass, iconButtonClass } from "@/components/ui/styles";
import type { FilmSummary } from "@/lib/types";
import { cn, plural } from "@/lib/utils";
import { Backdrop } from "./backdrop";
import { HeartButton } from "./heart-button";

/**
 * Swipeable film spotlight. The track uses native CSS scroll-snap, so touch
 * swipes, trackpads and mouse-wheel all feel native; we only *observe* scroll
 * position to work out which film is centred. The page backdrop is the blurred
 * artwork of that film and cross-fades as you swipe.
 */
export function SpotlightDeck({
  films,
  savedIds,
  signedIn,
  header,
}: {
  films: FilmSummary[];
  savedIds: string[];
  signedIn: boolean;
  /** Rendered on top of the backdrop, above the cards (title, search…). */
  header?: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    setActive(best);
  }, []);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  };

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame.current);
    };
  }, [measure]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const target = track?.children[Math.max(0, Math.min(films.length - 1, index))] as HTMLElement | undefined;
    if (!track || !target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  if (!films.length) return null;
  const film = films[active] ?? films[0]!;
  const meta = [film.year, film.genres.slice(0, 2).join(", "), film.director].filter(Boolean).join(" · ");

  return (
    <section aria-roledescription="carousel" aria-label="Film spotlight" className="relative isolate pb-24 text-white">
      <Backdrop films={films} active={active} />

      <div className="mx-auto max-w-6xl px-5 pt-5 md:px-8 md:pt-8">{header}</div>

      <div className="relative mt-6">
        <div
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={0}
          aria-label="Swipe to browse films"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              goTo(active + 1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              goTo(active - 1);
            }
          }}
          className="scrollbar-none relative flex snap-x snap-mandatory gap-4 overflow-x-auto py-4 outline-none [--card-w:62vw] sm:[--card-w:240px] md:gap-6 md:[--card-w:260px]"
          style={{ paddingInline: "calc(50% - var(--card-w) / 2)" }}
        >
          {films.map((f, i) => {
            const on = i === active;
            return (
              <div
                key={f.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${films.length}: ${f.title}`}
                className="w-[var(--card-w)] shrink-0 snap-center transition-[transform,opacity] duration-300 ease-out"
                style={{ transform: on ? "scale(1)" : "scale(0.86)", opacity: on ? 1 : 0.6 }}
              >
                <Link
                  href={`/films/${f.slug}`}
                  tabIndex={on ? 0 : -1}
                  onClick={(e) => {
                    // Tapping a side card brings it to the centre instead of navigating away.
                    if (!on) {
                      e.preventDefault();
                      goTo(i);
                    }
                  }}
                  className="block rounded-[22px]"
                >
                  <Poster
                    film={f}
                    priority={i < 3}
                    className="aspect-[2/3] rounded-[22px] shadow-[0_24px_48px_rgb(0_0_0/0.45)] ring-1 ring-white/15"
                    titleClassName="inset-x-4 bottom-4 text-2xl"
                    sizes="(min-width: 768px) 260px, 62vw"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {films.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous film"
              className={iconButtonClass("glass", "absolute top-1/2 left-8 hidden size-12 -translate-y-1/2 disabled:opacity-0 md:inline-flex")}
            >
              <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === films.length - 1}
              aria-label="Next film"
              className={iconButtonClass("glass", "absolute top-1/2 right-8 hidden size-12 -translate-y-1/2 disabled:opacity-0 md:inline-flex")}
            >
              <Icon name="chevronRight" size={20} strokeWidth={2.4} />
            </button>
          </>
        )}
      </div>

      <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Choose a film">
        {films.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={f.title}
            onClick={() => goTo(i)}
            className="flex h-6 items-center"
          >
            <span className={cn("block h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-white/50")} />
          </button>
        ))}
      </div>

      <div className="mx-auto mt-5 flex max-w-xl flex-col items-center px-6 text-center" aria-live="polite">
        <p className="flex items-center gap-1.5 text-[14px] font-medium text-white/90">
          <StarGlyph size={14} />
          <span className="font-semibold text-white">{film.avgRating?.toFixed(1) ?? "New"}</span>
          {film.ratingCount > 0 && <span>· {plural(film.ratingCount, "rating")}</span>}
          {film.platform && <span>· {film.platform}</span>}
        </p>
        <h2 className="mt-1.5 text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]">{film.title}</h2>
        <p className="mt-1 text-[14px] text-white/85">{meta}</p>
        {film.synopsis && <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-white/90">{film.synopsis}</p>}
        <div className="mt-5 flex items-center gap-2.5">
          <Link href={`/films/${film.slug}`} className={buttonClass("white", "md")}>
            View details
          </Link>
          <Link href={`/films/${film.slug}/review`} className={buttonClass("glass", "md")}>
            <Icon name="star" size={16} /> Rate
          </Link>
          <HeartButton
            key={film.id}
            filmId={film.id}
            title={film.title}
            saved={savedIds.includes(film.id)}
            signedIn={signedIn}
            returnTo="/discover"
            className="size-11 rounded-xl border border-white/40 bg-white/15 backdrop-blur-md"
            size={20}
          />
        </div>
      </div>
    </section>
  );
}
