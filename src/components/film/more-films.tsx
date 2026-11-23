"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/styles";
import type { FilmSummary } from "@/lib/types";
import { FilmCard } from "./film-row";

type CardContext = { savedIds: string[]; signedIn: boolean; returnTo: string };

/**
 * "Show more" for a results grid: appends the next page of matches from
 * /api/films under the ones the server rendered, until every match is shown.
 */
export function MoreFilms({ moreFrom, offset, total, ctx }: { moreFrom: string; offset: number; total: number; ctx: CardContext }) {
  const [films, setFilms] = useState<FilmSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const shown = offset + films.length;
  const left = Math.max(0, total - shown);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/films?${moreFrom}&offset=${shown}&limit=48`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { films: FilmSummary[] };
      setFilms((prev) => {
        const seen = new Set(prev.map((f) => f.id));
        return [...prev, ...data.films.filter((f) => !seen.has(f.id))];
      });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {films.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
          {films.map((film) => (
            <FilmCard key={film.id} film={film} ctx={ctx} />
          ))}
        </div>
      )}
      {left > 0 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button type="button" onClick={load} disabled={loading} className={buttonClass("outline", "lg", "min-w-56 disabled:opacity-60")}>
            {loading ? "Loading…" : `Show more films (${left.toLocaleString("en")} more)`}
          </button>
          {failed && <p className="text-[13px] text-accent">Couldn&apos;t load more. Try again.</p>}
          <p className="text-[13px] text-sub">
            Showing {shown.toLocaleString("en")} of {total.toLocaleString("en")}
          </p>
        </div>
      )}
    </>
  );
}
