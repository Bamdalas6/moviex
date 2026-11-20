import Link from "next/link";
import { CategoryBar } from "@/components/film/category-bar";
import { FilmCard, FilmRail } from "@/components/film/film-row";
import { SearchPill } from "@/components/film/search-pill";
import { Icon } from "@/components/icons";
import { PageShell, SectionHeading } from "@/components/layout/page";
import { ReviewCard } from "@/components/review/review-card";
import { buttonClass } from "@/components/ui/styles";
import { formatNumber } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { listFilms, ratingActivity, savedFilmIds } from "@/server/queries/films";
import { reviewFeed } from "@/server/queries/reviews";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [inCinemas, topRated, trending, streaming, boxOffice, latest, activity, savedIds] = await Promise.all([
    listFilms({ nowPlaying: true, sort: "recent", limit: 10 }),
    listFilms({ sort: "top", limit: 10 }),
    listFilms({ sort: "trending", limit: 10 }),
    listFilms({ streaming: true, sort: "top", limit: 10 }),
    listFilms({ sort: "box-office", limit: 5 }),
    reviewFeed({ viewerId: user?.id, feed: "latest", stars: "all", limit: 3 }),
    ratingActivity(),
    savedFilmIds(user?.id),
  ]);
  const ctx = { savedIds, signedIn: Boolean(user), returnTo: "/" };

  return (
    <PageShell wide className="gap-10 md:gap-12">
      <div className="flex flex-col gap-6">
        <SearchPill className="mx-auto w-full max-w-2xl" />
        <CategoryBar hrefFor={(g) => (g ? `/discover?genre=${g}` : "/discover")} className="md:flex md:justify-center" />
      </div>

      {inCinemas.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading title="In cinemas now" subtitle="Showing on the big screen across Nigeria" href="/cinemas" linkLabel="Find a cinema" />
          <FilmRail>
            {inCinemas.map((film, i) => (
              <FilmCard key={film.id} film={film} ctx={ctx} priority={i < 2} badge="In cinemas" />
            ))}
          </FilmRail>
        </section>
      )}

      <section className="flex flex-col gap-5">
        <SectionHeading
          title="Top rated"
          subtitle={`${formatNumber(activity.week)} ratings this week · +${formatNumber(activity.today)} today`}
          href="/discover"
        />
        <FilmRail>
          {topRated.map((film, i) => (
            <FilmCard key={film.id} film={film} ctx={ctx} priority={i < 2} badge={i === 0 ? "Fan favourite" : null} />
          ))}
        </FilmRail>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading title="Trending in Nollywood" subtitle="Most rated in the last 30 days" href="/discover" />
        <FilmRail>
          {trending.map((film) => (
            <FilmCard key={film.id} film={film} ctx={ctx} />
          ))}
        </FilmRail>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading title="Box office hits" subtitle="The biggest Nollywood releases in cinemas" href="/discover" />
        <FilmRail>
          {boxOffice.map((film, i) => (
            <FilmCard key={film.id} film={film} ctx={ctx} badge={`#${i + 1} box office`} />
          ))}
        </FilmRail>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading title="Streaming now" subtitle="Watch tonight on your favourite platform" href="/discover" />
        <FilmRail>
          {streaming.map((film) => (
            <FilmCard key={film.id} film={film} ctx={ctx} badge={film.platform} />
          ))}
        </FilmRail>
      </section>

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
