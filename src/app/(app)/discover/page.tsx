import type { Metadata } from "next";
import Link from "next/link";
import { FilmCard, FilmRail, FilmRow } from "@/components/film/film-row";
import { SearchPill } from "@/components/film/search-pill";
import { SpotlightDeck } from "@/components/film/spotlight-deck";
import { EmptyState, SectionHeading, TmdbCredit } from "@/components/layout/page";
import { chipClass } from "@/components/ui/styles";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { discoverSearchSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth/session";
import { listFilms, savedFilmIds } from "@/server/queries/films";
import { listPeople, searchChannels, searchPeople } from "@/server/queries/people";
import { ChannelCard, PersonPhoto, PersonResult } from "@/components/people/people-ui";
import { TopPerson } from "@/components/people/top-person";

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
  const [results, featured, boxOffice, streaming, everything, directors, savedIds] = await Promise.all([
    filtering ? listFilms({ ...filters, sort: "top", limit: 40 }) : Promise.resolve([]),
    listFilms({ sort: "top", limit: 10 }),
    filtering ? Promise.resolve([]) : listFilms({ sort: "box-office", limit: 6 }),
    filtering ? Promise.resolve([]) : listFilms({ streaming: true, sort: "top", limit: 10 }),
    filtering ? Promise.resolve([]) : listFilms({ sort: "recent", limit: 20 }),
    filtering
      ? Promise.resolve([])
      : // The most prolific directors, favouring those with a photo so the row is faces, not initials.
        listPeople({ group: "directors", sort: "rank", page: 1, perPage: 24 }).then(({ people }) =>
          [...people].sort((a, b) => Number(Boolean(b.photoUrl)) - Number(Boolean(a.photoUrl))).slice(0, 12),
        ),
    savedFilmIds(user?.id),
  ]);
  const [people, channels] = filters.q ? await Promise.all([searchPeople(filters.q, 6), searchChannels(filters.q, 6)]) : [[], []];
  // A name search puts that person's profile right under the search box.
  const query = filters.q?.trim().toLowerCase() ?? "";
  const topPerson =
    query.length >= 3
      ? people.find((p) => {
          const name = p.name.toLowerCase();
          return name.startsWith(query) || name.includes(` ${query}`); // the query starts a word of their name
        })
      : undefined;

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
            {/* Phones stack the title over the search box; wider screens put them on one line. */}
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="min-w-0">
                <h1 className="text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]">Discover</h1>
                <p className="text-[15px] text-white/85">
                  {filtering && results.length
                    ? `Swipe through ${results.length} ${results.length === 1 ? "match" : "matches"}`
                    : "Swipe through the best of Nollywood"}
                </p>
              </div>
              <SearchPill
                defaultValue={filters.q}
                keep={{ genre: filters.genre, industry: filters.industry, language: filters.language }}
                className="w-full max-w-2xl md:w-[min(520px,52%)] md:shrink-0"
              />
            </div>
            {topPerson && <TopPerson person={topPerson} />}
          </div>
        }
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 pt-2 md:px-8">
        {people.length > 0 && (
          <section aria-labelledby="people-results" className="flex flex-col gap-5">
            <SectionHeading
              title={<span id="people-results">{people.length === 1 ? "1 person" : `${people.length} people`}</span>}
              subtitle="Actors and directors: profiles, YouTube and socials"
              href={`/people?q=${encodeURIComponent(filters.q ?? "")}`}
              linkLabel="All people"
            />
            <div className="grid gap-3 md:grid-cols-2">
              {people.map((p) => (
                <PersonResult key={p.id} person={p} />
              ))}
            </div>
          </section>
        )}

        {channels.length > 0 && (
          <section aria-labelledby="channel-results" className="flex flex-col gap-5">
            <SectionHeading
              title={<span id="channel-results">Watch on YouTube</span>}
              subtitle="Channels that publish Nollywood movies"
              href={`/channels?q=${encodeURIComponent(filters.q ?? "")}`}
              linkLabel="All channels"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </div>
          </section>
        )}

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
                  <Link key={d.id} href={`/people/${d.slug}`} className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center">
                    <span className="transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                      <PersonPhoto name={d.name} photoUrl={d.photoUrl} size={80} className="shadow-card ring-2 ring-page" />
                    </span>
                    <span className="line-clamp-2 text-[14px] leading-tight font-semibold [overflow-wrap:anywhere] group-hover:underline">{d.name}</span>
                    <span className="-mt-1 text-[12.5px] text-sub">{d.filmCount} films</span>
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
