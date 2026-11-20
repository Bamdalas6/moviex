import Image from "next/image";
import type { Poster } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Blurred, colour-saturated poster wash behind a hero. Every film gets a layer
 * and only the active one is opaque, so switching films cross-fades instead of
 * popping. Gradient posters blur as-is; uploaded posters blur the image.
 */
export function Backdrop({
  films,
  active = 0,
  className,
  fadeTo = "page",
}: {
  films: Poster[];
  active?: number;
  className?: string;
  /** Fade the bottom edge into the page colour so content below sits on a clean canvas. */
  fadeTo?: "page" | "none";
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#111]", className)}>
      {/* parallax-layer: drifts down slower than the page as you scroll (scroll-driven CSS). */}
      <div className="parallax-layer absolute inset-0">
      {films.map((film, i) => (
        <div
          key={`${film.title}-${i}`}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <div className="absolute -inset-[20%] blur-[70px] saturate-150" style={{ background: film.posterGradient }}>
            {film.posterUrl && (
              <Image
                src={film.posterUrl}
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
                unoptimized={film.posterUrl.startsWith("https://image.tmdb.org/")}
              />
            )}
          </div>
        </div>
      ))}
      </div>
      {/* Darken for legible white text, then dissolve into the page. */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Keep this shorter than the host's bottom padding so it never sits under white text. */}
      {/* -bottom-px: overlap the edge so a fractional section height can't leave a dark seam. */}
      {fadeTo === "page" && <div className="absolute inset-x-0 -bottom-px h-20 bg-gradient-to-b from-transparent via-page/70 to-page" />}
    </div>
  );
}
