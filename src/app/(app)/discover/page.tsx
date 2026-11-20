import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBar } from "@/components/film/category-bar";
import { FilmCard, FilmRail, FilmRow } from "@/components/film/film-row";
import { SearchPill } from "@/components/film/search-pill";
import { SpotlightDeck } from "@/components/film/spotlight-deck";
import { EmptyState, SectionHeading, TmdbCredit } from "@/components/layout/page";
import { chipClass } from "@/components/ui/styles";
import { INDUSTRIES, LANGUAGES } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import { discoverSearchSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth/session";
import { listFilms, savedFilmIds, topDirectors } from "@/server/queries/films";

export const metadata: Metadata = { title: "Discover" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = discoverSearchSchema.parse(await searchParams);
  const current = { q: filters.q, genre: filters.genre, industry: filters.industry, language: filters.language };
  const filtering = Boolean(filters.q || filters.genre || filters.language || filters.industry);

  const href = (patch: Partial<Record<keyof typeof current, string | undefined>>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...current, ...patch })) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/discover?${qs}` : "/discover";
  };

  const user = await getCurrentUser();
  const [inCinemas, results, featured, boxOffice, streaming, everything, directors, savedIds] = await Promise.all([
    filtering ? Promise.resolve([]) : listFilms({ nowPlaying: true, sort: "recent", limit: 10 }),
    filtering ? listFilms({ ...filters, sort: "top", limit: 40 }) : Promise.resolve([]),
    listFilms({ sort: "top", limit: 10 }),
    filtering ? Promise.resolve([]) : listFilms({ sort: "box-office", limit: 6 }),
    filtering ? Promise.resolve([]) : listFilms({ streaming: true, sort: "top", limit: 10 }),
    filtering ? Promise.resolve([]) : listFilms({ sort: "recent", limit: 20 }),
    filtering ? Promise.resolve([]) : topDirectors(),
    savedFilmIds(user?.id),
  ]);

  // The deck follows your search: swipe through the matches, or the top films when nothing is filtered.
  const deck = filtering && results.length ? results.slice(0, 12) : featured;
  const ctx = { savedIds, signedIn: Boolean(user), returnTo: href({}) };

  return (
    <main id="main" className="pb-28 md:pb-16">
      <SpotlightDeck
        key={deck.map((f) => f.id).join()}
        films={deck}
        savedIds={savedIds}
        signedIn={Boolean(user)}
        header={
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]">Discover</h1>
              <p className="text-[15px] text-white/85">
                {filtering && results.length
                  ? `Swipe through ${results.length} ${results.length === 1 ? "match" : "matches"}`
                  : "Swipe through the best of Nollywood and African cinema"}
              </p>
            </div>
            <SearchPill defaultValue={filters.q} keep={{ genre: filters.genre, industry: filters.industry, language: filters.language }} className="max-w-2xl" />
          </div>
        }
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 pt-2 md:px-8">
        <div className="flex flex-col gap-4 border-b border-line">
          <CategoryBar active={filters.genre} hrefFor={(g) => href({ genre: g })} />
        </div>

        <nav aria-label="Film industry" className="scrollbar-none -mx-5 -mt-4 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          <Link href={href({ industry: undefined })} aria-current={!filters.industry ? "true" : undefined} className={chipClass(!filters.industry)}>
            All industries
          </Link>
          {INDUSTRIES.map((label) => (
            <Link
              key={label}
              href={href({ industry: filters.industry === label ? undefined : label })}
              aria-current={filters.industry === label ? "true" : undefined}
              className={chipClass(filters.industry === label)}
            >
              {label}
            </Link>
          ))}
        </nav>

        {filtering ? (
          <section aria-labelledby="results" className="flex flex-col gap-5">
            <SectionHeading
              title={<span id="results">{results.length ? `${results.length} ${results.length === 1 ? "film" : "films"}` : "No matches"}</span>}
              subtitle={[filters.q && `“${filters.q}”`, filters.genre, filters.industry, filters.language].filter(Boolean).join(" · ")}
              href="/discover"
              linkLabel="Clear filters"
            />
            {results.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
                {results.map((film) => (
                  <FilmCard key={film.id} film={film} ctx={ctx} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No films match yet"
                body="Try a different search, or share a poster for the film you're looking for."
                action={
                  <Link href="/upload" className="font-semibold underline underline-offset-4">
                    Share a poster
                  </Link>
                }
              />
            )}
          </section>
        ) : (
          <>
            {inCinemas.length > 0 && (
              <section aria-labelledby="in-cinemas" className="flex flex-col gap-5">
                <SectionHeading title={<span id="in-cinemas">In cinemas now</span>} href="/cinemas" linkLabel="Find a cinema" />
                <FilmRail>
                  {inCinemas.map((film) => (
                    <FilmCard key={film.id} film={film} ctx={ctx} badge="In cinemas" />
                  ))}
                </FilmRail>
              </section>
            )}

            <section aria-labelledby="box-office" className="flex flex-col gap-3">
              <SectionHeading title={<span id="box-office">Box office chart</span>} subtitle="Highest-grossing Nollywood releases" />
              <ol className="grid gap-x-10 md:grid-cols-2">
                {boxOffice.map((film, i) => (
                  <li key={film.id} className="border-b border-line">
                    <FilmRow film={film} rank={i + 1} />
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="streaming" className="flex flex-col gap-5">
              <SectionHeading title={<span id="streaming">Streaming now</span>} />
              <FilmRail>
                {streaming.map((film) => (
                  <FilmCard key={film.id} film={film} ctx={ctx} badge={film.platform} />
                ))}
              </FilmRail>
            </section>

            <section aria-labelledby="directors" className="flex flex-col gap-5">
              <SectionHeading title={<span id="directors">Directors to know</span>} />
              <div className="scrollbar-none -mx-5 flex gap-6 overflow-x-auto px-5 md:mx-0 md:px-0">
                {directors.map((d) => (
                  <Link
                    key={d.name}
                    href={`/discover?q=${encodeURIComponent(d.name)}`}
                    className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-card transition group-hover:shadow-lift"
                      style={{ background: d.color ?? "var(--cta)" }}
                    >
                      {initials(d.name)}
                    </span>
                    <span className="text-[14px] leading-tight font-semibold">{d.name}</span>
                    {d.knownFor && <span className="-mt-1 text-[12.5px] text-sub">{d.knownFor}</span>}
                  </Link>
                ))}
              </div>
            </section>

            <section aria-labelledby="all-films" className="flex flex-col gap-5">
              <SectionHeading title={<span id="all-films">All films</span>} subtitle="Newest first" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
                {everything.map((film) => (
                  <FilmCard key={film.id} film={film} ctx={ctx} />
                ))}
              </div>
            </section>
          </>
        )}

        <section aria-labelledby="languages" className="flex flex-col gap-4">
          <SectionHeading title={<span id="languages">Explore by language</span>} />
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => {
              const on = filters.language === language;
              return (
                <Link
                  key={language}
                  href={href({ language: on ? undefined : language })}
                  aria-current={on ? "true" : undefined}
                  className={cn(chipClass(on))}
                >
                  {language}
                </Link>
              );
            })}
          </div>
        </section>

        <TmdbCredit className="border-t border-line pt-6" />
      </div>
    </main>
  );
}
