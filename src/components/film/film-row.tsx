import Link from "next/link";
import { StarGlyph } from "@/components/icons";
import { Poster } from "@/components/ui/poster";
import { RatingBadge } from "@/components/ui/stars";
import type { FilmSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HeartButton } from "./heart-button";

type CardContext = { savedIds: string[]; signedIn: boolean; returnTo: string };

/**
 * Photo-first film card: artwork with a save heart and an optional badge,
 * then title + rating on one line and quiet meta lines underneath.
 */
export function FilmCard({
  film,
  badge,
  ctx,
  priority,
  className,
}: {
  film: FilmSummary;
  badge?: string | null;
  ctx: CardContext;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("group relative min-w-0", className)}>
      <Link href={`/films/${film.slug}`} className="block rounded-2xl">
        <Poster
          film={film}
          priority={priority}
          className="aspect-[2/3] rounded-2xl transition duration-300 group-hover:brightness-95"
          titleClassName="text-lg"
          sizes="(min-width: 1024px) 220px, (min-width: 768px) 25vw, 46vw"
        />
        <div className="mt-2.5 flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-semibold">{film.title}</p>
          {film.avgRating !== null && (
            <span className="flex shrink-0 items-center gap-1 text-[14px]">
              <StarGlyph size={12} />
              {film.avgRating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="truncate text-[14px] text-sub">
          {film.year} · {film.genres.slice(0, 2).join(", ") || film.industry}
        </p>
        <p className="truncate text-[14px] text-sub">{film.director ?? film.language}</p>
      </Link>
      {badge && (
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-[#222] shadow-card">
          {badge}
        </span>
      )}
      <HeartButton
        filmId={film.id}
        title={film.title}
        saved={ctx.savedIds.includes(film.id)}
        signedIn={ctx.signedIn}
        returnTo={ctx.returnTo}
        className="absolute top-1.5 right-1.5"
      />
    </div>
  );
}

/** A row of cards that scrolls sideways on phones and becomes a grid on wider screens. */
export function FilmRail({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-1",
        "md:mx-0 md:grid md:snap-none md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-5",
        "[&>*]:w-[44%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[30%] md:[&>*]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Compact ranked row (box office chart, search results). */
export function FilmRow({ film, rank, className }: { film: FilmSummary; rank?: number; className?: string }) {
  const meta = [film.year, film.genres.slice(0, 2).join(", "), film.director].filter(Boolean).join(" · ");
  return (
    <Link href={`/films/${film.slug}`} className={cn("group flex items-center gap-4 py-3 text-ink", className)}>
      {rank !== undefined && <span className="w-6 text-center text-lg font-bold text-sub">{rank}</span>}
      <Poster film={film} showTitle={false} className="h-[84px] w-[56px] shrink-0 rounded-xl" sizes="56px" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold group-hover:underline">{film.title}</span>
        <span className="mt-0.5 block truncate text-[14px] text-sub">{meta}</span>
      </span>
      <RatingBadge value={film.avgRating} className="font-semibold" />
    </Link>
  );
}
