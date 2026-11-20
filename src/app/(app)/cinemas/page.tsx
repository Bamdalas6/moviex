import type { Metadata } from "next";
import { FilmCard, FilmRail } from "@/components/film/film-row";
import { CinemaChains } from "@/components/film/where-to-watch";
import { EmptyState, PageShell, PageTitle, SectionHeading, TmdbCredit } from "@/components/layout/page";
import { getCurrentUser } from "@/server/auth/session";
import { listCinemas, listFilms, savedFilmIds } from "@/server/queries/films";

export const metadata: Metadata = {
  title: "Cinemas",
  description: "Nollywood films showing in Nigerian cinemas now, and where to watch them.",
};

export default async function CinemasPage() {
  const user = await getCurrentUser();
  const [showing, cinemas, savedIds] = await Promise.all([
    listFilms({ nowPlaying: true, sort: "recent", limit: 20 }),
    listCinemas(),
    savedFilmIds(user?.id),
  ]);
  const ctx = { savedIds, signedIn: Boolean(user), returnTo: "/cinemas" };

  return (
    <PageShell wide className="gap-10">
      <PageTitle title="Cinemas" subtitle="Catch Nollywood on the big screen" />

      <section className="flex flex-col gap-5">
        <SectionHeading title="Now showing in Nigeria" subtitle="From Nigeria's current now-showing list" />
        {showing.length ? (
          <FilmRail>
            {showing.map((film, i) => (
              <FilmCard key={film.id} film={film} ctx={ctx} priority={i < 2} badge="In cinemas" />
            ))}
          </FilmRail>
        ) : (
          <EmptyState title="Nothing on the list right now" body="Check back soon — the list refreshes with every import." />
        )}
      </section>

      <section className="flex flex-col gap-5 border-t border-line pt-10">
        <SectionHeading
          title="Cinema directory"
          subtitle={`${cinemas.length} branches · tap a branch for directions, or a chain for showtimes and tickets`}
        />
        <CinemaChains cinemas={cinemas} />
        <p className="text-[13px] text-sub">
          Showtimes and ticket prices are set by each cinema. Branch list compiled from public sources; let us know if a location has
          changed.
        </p>
      </section>

      <TmdbCredit className="border-t border-line pt-6" />
    </PageShell>
  );
}
