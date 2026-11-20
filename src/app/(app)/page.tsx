import Link from "next/link";
import { CategoryBar } from "@/components/film/category-bar";
import { FilmCard, FilmRail } from "@/components/film/film-row";
import { SearchPill } from "@/components/film/search-pill";
import { Icon } from "@/components/icons";
import { EmptyState, PageShell, SectionHeading } from "@/components/layout/page";
import { ReviewCard } from "@/components/review/review-card";
import { buttonClass } from "@/components/ui/styles";
import { GENRES, type Genre } from "@/lib/constants";
import type { FilmSummary } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { listFilms, ratingActivity, savedFilmIds } from "@/server/queries/films";
import { reviewFeed } from "@/server/queries/reviews";

type SearchParams = Promise<{ genre?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const requested = (await searchParams).genre;
  // The genre bar filters Home in place (/?genre=Drama) instead of jumping to Discover.
  const genre = GENRES.find((g) => g === requested) as Genre | undefined;

  // Start the public film queries straight away, in parallel with the session lookup.
  const filmsPromise = Promise.all([
    listFilms({ genre, nowPlaying: true, sort: "recent", limit: 10 }),
    listFilms({ genre, sort: "top", limit: 10 }),
    listFilms({ genre, sort: "trending", limit: 10 }),
    listFilms({ genre, streaming: true, sort: "top", limit: 10 }),
    listFilms({ genre, sort: "box-office", limit: 5 }),
    genre ? listFilms({ genre, sort: "recent", limit: 30 }) : Promise.resolve([] as FilmSummary[]),
    ratingActivity(),
  ]);
  const user = await getCurrentUser();
  const [[inCinemas, topRated, trending, streaming, boxOffice, everything, activity], latest, savedIds] = await Promise.all([
    filmsPromise,
    genre ? Promise.resolve([]) : reviewFeed({ viewerId: user?.id, feed: "latest", stars: "all", limit: 3 }),
    savedFilmIds(user?.id),
  ]);

  const ctx = { savedIds, signedIn: Boolean(user), returnTo: genre ? `/?genre=${genre}` : "/" };
  const label = genre ? genre.toLowerCase() : null;
  const nothing = genre && !topRated.length && !everything.length;

  return (
    <PageShell wide className="gap-10 md:gap-12">
      <div className="flex flex-col gap-6">
        <SearchPill className="mx-auto w-full max-w-2xl" keep={{ genre }} />
        <CategoryBar active={genre} hrefFor={(g) => (g ? `/?genre=${g}` : "/")} className="md:flex md:justify-center" />
      </div>

      {nothing && (
        <EmptyState
          title={`No ${label} films yet`}
          body="Try another genre, or share a poster for a film you love."
          action={
            <Link href="/" className="font-semibold underline underline-offset-4">
              Show all films
            </Link>
          }
        />
      )}

      {inCinemas.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading
            title={genre ? `${genre} in cinemas now` : "In cinemas now"}
            subtitle="Showing on the big screen across Nigeria"
            href="/cinemas"
            linkLabel="Find a cinema"
          />
          <FilmRail>
            {inCinemas.map((film, i) => (
              <FilmCard key={film.id} film={film} ctx={ctx} priority={i < 2} badge="In cinemas" />
            ))}
          </FilmRail>
        </section>
      )}

      {topRated.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading
            title={genre ? `Top rated ${label}` : "Top rated"}
            subtitle={`${formatNumber(activity.week)} ratings this week · +${formatNumber(activity.today)} today`}
            href={genre ? `/discover?genre=${genre}` : "/discover"}
          />
          <FilmRail>
            {topRated.map((film, i) => (
              <FilmCard key={film.id} film={film} ctx={ctx} priority={i < 2} badge={i === 0 ? "Fan favourite" : null} />
            ))}
          </FilmRail>
        </section>
      )}

      {trending.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading
            title={genre ? `Trending ${label}` : "Trending in Nollywood"}
            subtitle="Most rated in the last 30 days"
            href={genre ? `/discover?genre=${genre}` : "/discover"}
          />
          <FilmRail>
            {trending.map((film) => (
              <FilmCard key={film.id} film={film} ctx={ctx} />
            ))}
          </FilmRail>
        </section>
      )}

      {boxOffice.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading title="Box office hits" subtitle="The biggest Nollywood releases in cinemas" />
          <FilmRail>
            {boxOffice.map((film) => (
              <FilmCard key={film.id} film={film} ctx={ctx} badge={film.badge ?? "Box office hit"} />
            ))}
          </FilmRail>
        </section>
      )}

      {streaming.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading
            title={genre ? `${genre} to stream tonight` : "Streaming now"}
            subtitle="Watch on your favourite platform"
          />
          <FilmRail>
            {streaming.map((film) => (
              <FilmCard key={film.id} film={film} ctx={ctx} badge={film.platform} />
            ))}
          </FilmRail>
        </section>
      )}

      {genre && everything.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading title={`All ${label} films`} subtitle={`${everything.length} films · newest first`} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
            {everything.map((film) => (
              <FilmCard key={film.id} film={film} ctx={ctx} />
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading title="Fresh from the community" href="/reviews?feed=latest" linkLabel="All reviews" />
          <div className="grid gap-4 md:grid-cols-3">
            {latest.map((review) => (
              <ReviewCard key={review.id} review={review} showFilm signedIn={Boolean(user)} compact />
            ))}
          </div>
        </section>
      )}

      {!user && (
        <section className="flex flex-col items-start gap-4 rounded-3xl bg-field p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="text-[26px] font-bold tracking-[-0.5px]">Join the conversation</h2>
            <p className="mt-1 max-w-md text-[15px] text-sub">Rate films, write reviews and share posters with thousands of Nollywood fans.</p>
          </div>
          <Link href="/signup" className={buttonClass("primary", "lg")}>
            Create an account <Icon name="arrowRight" size={16} />
          </Link>
        </section>
      )}
    </PageShell>
  );
}
