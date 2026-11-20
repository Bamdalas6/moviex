"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import { rateFilm } from "@/server/actions/reviews";

const WORDS = ["Tap a star to rate", "You rated it 1 of 5", "You rated it 2 of 5", "You rated it 3 of 5", "You rated it 4 of 5", "You rated it 5 of 5"];

/** One-tap rating with optimistic feedback. */
export function QuickRate({
  filmId,
  slug,
  score,
  signedIn,
  className,
}: {
  filmId: string;
  slug: string;
  score: number | null;
  signedIn: boolean;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(score ?? 0);
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2", className)}>
      <div>
        <h2 className="text-[15px] font-semibold">Your rating</h2>
        <p className="mt-0.5 text-[13px] text-sub" aria-live="polite">
          {signedIn ? WORDS[optimistic] : "Log in to rate this film"}
        </p>
      </div>
      <div className="-mr-1.5 flex" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((k) => {
          const on = k <= optimistic;
          const star = (
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill={on ? "#FFB020" : "none"} stroke={on ? "#FFB020" : "var(--idle)"} strokeWidth="1.5" strokeLinejoin="round">
              <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
            </svg>
          );
          const label = `Rate ${k} ${k === 1 ? "star" : "stars"}`;
          return signedIn ? (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={k === optimistic}
              aria-label={label}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setOptimistic(k);
                  await rateFilm(filmId, k);
                })
              }
              className="flex h-11 w-9 items-center justify-center transition hover:scale-110 active:scale-90"
            >
              {star}
            </button>
          ) : (
            <Link key={k} href={`/login?next=/films/${slug}`} aria-label={label} className="flex h-11 w-9 items-center justify-center">
              {star}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function RatingBars({
  rows,
  show = "percent",
  className,
}: {
  rows: { score: number; percent: number; count: number }[];
  show?: "percent" | "count";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-2", className)}>
      {rows.map((row) => (
        <div key={row.score} className="flex items-center gap-3 text-[13px]">
          <span className="w-2.5 text-sub">{row.score}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-ink" style={{ width: `${row.percent}%` }} />
          </div>
          <span className="w-9 text-right font-medium">{show === "percent" ? `${row.percent}%` : row.count}</span>
        </div>
      ))}
    </div>
  );
}
