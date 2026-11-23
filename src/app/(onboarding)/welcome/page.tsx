import type { Metadata } from "next";
import { WelcomeExperience, type RunwayPoster } from "@/components/onboarding/welcome-experience";
import { listFilms } from "@/server/queries/films";

export const metadata: Metadata = { title: "Welcome" };

/**
 * The runway loops seamlessly only when one copy of the list fills whole rows
 * on every layout (5 columns on phones, 8 on desktop), so it always holds
 * exactly 40 posters.
 */
const RUNWAY_POSTERS = 40;

/**
 * Onboarding: a full-screen splash that morphs into the app icon, then a 3D
 * runway of real Nollywood posters behind the welcome copy.
 */
export default async function WelcomePage() {
  const films = await listFilms({ sort: "top", limit: 80 });
  const pool: RunwayPoster[] = films
    .filter((f) => f.posterUrl && !f.posterSpoiler)
    // The runway tiles are small: ask TMDB for a lighter image than the 500px default.
    .map((f) => ({ src: f.posterUrl!.replace("/t/p/w500/", "/t/p/w342/"), title: f.title }));
  const posters = pool.length ? Array.from({ length: RUNWAY_POSTERS }, (_, i) => pool[i % pool.length]!) : [];

  return <WelcomeExperience posters={posters} />;
}
