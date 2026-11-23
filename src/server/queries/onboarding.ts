import "server-only";

import type { RunwayPoster } from "@/components/onboarding/welcome-experience";
import { listFilms } from "./films";

/**
 * The runway loops seamlessly only when one copy of the list fills whole rows
 * on every layout (5 columns on phones, 8 on desktop), so it always holds
 * exactly 40 posters.
 */
const RUNWAY_POSTERS = 40;

export { WELCOMED_COOKIE } from "@/lib/onboarding";

/** Posters for the onboarding runway: top-rated films, small TMDB images. */
export async function runwayPosters(): Promise<RunwayPoster[]> {
  const films = await listFilms({ sort: "top", limit: 80 });
  const pool: RunwayPoster[] = films
    .filter((f) => f.posterUrl && !f.posterSpoiler)
    // The runway tiles are small: ask TMDB for a lighter image than the 500px default.
    .map((f) => ({
      src: f.posterUrl!.replace("/t/p/w500/", "/t/p/w342/"),
      title: f.title,
    }));
  return pool.length ? Array.from({ length: RUNWAY_POSTERS }, (_, i) => pool[i % pool.length]!) : [];
}

/** Search engines and link previews should index the real page, never the intro. */
export function isCrawler(userAgent: string | null) {
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|headless/i.test(userAgent ?? "");
}
