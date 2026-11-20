"use client";

import Image from "next/image";
import { useState } from "react";
import type { Poster as PosterData } from "@/lib/types";
import { cn } from "@/lib/utils";

type PosterProps = {
  film: PosterData;
  /** Show the title over the artwork (gradient fallbacks always show it). */
  showTitle?: boolean;
  titleClassName?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
};

/**
 * Film artwork. Renders the uploaded poster when there is one, otherwise the
 * design's gradient card. Spoiler artwork stays blurred until revealed.
 */
export function Poster({ film, showTitle, titleClassName, className, sizes = "200px", priority, children }: PosterProps) {
  const [revealed, setRevealed] = useState(false);
  const hidden = film.posterSpoiler && !revealed;
  // Real artwork already carries the title; only gradient fallbacks get a text overlay.
  const titled = !film.posterUrl && (showTitle ?? true);
  // TMDB's CDN already serves sized, optimised images; skip a second pass through our server.
  const external = film.posterUrl?.startsWith("https://image.tmdb.org/") ?? false;

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: film.posterGradient }}>
      {film.posterUrl ? (
        <Image
          src={film.posterUrl}
          alt={`${film.title} poster`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={external}
          className={cn("poster-img object-cover", hidden && "scale-110 blur-xl")}
        />
      ) : (
        <span className="poster-shine" aria-hidden="true" />
      )}
      {titled && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-transparent to-black/55"
          />
          <span
            className={cn(
              "absolute inset-x-3 bottom-3 text-[15px] leading-[1.05] font-extrabold tracking-tight text-white",
              titleClassName,
            )}
          >
            {film.title}
          </span>
        </>
      )}
      {children}
      {hidden && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setRevealed(true);
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-xs font-semibold text-white"
        >
          <span className="rounded-full bg-black/50 px-3 py-1.5">Spoiler artwork · Show</span>
        </button>
      )}
    </div>
  );
}
