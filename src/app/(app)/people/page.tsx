import type { Metadata } from "next";
import Link from "next/link";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { Icon } from "@/components/icons";
import { EmptyState, PageShell, SectionHeading } from "@/components/layout/page";
import { PersonCard, PersonResult } from "@/components/people/people-ui";
import { chipClass } from "@/components/ui/styles";
import { cn } from "@/lib/utils";
import { listPeople, searchPeople, type PeopleGroup, type PeopleSort } from "@/server/queries/people";

export const metadata: Metadata = {
  title: "The Nollywood 500",
  description: "The 500 Nollywood actors and actresses with the most films, plus the directors behind them: profiles, filmographies, YouTube and socials.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

const GROUPS: { key: PeopleGroup; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "actresses", label: "Actresses" },
  { key: "actors", label: "Actors" },
  { key: "directors", label: "Directors" },
];
const SORTS: { key: PeopleSort; label: string }[] = [
  { key: "rank", label: "Most films" },
  { key: "popular", label: "Trending" },
  { key: "name", label: "A–Z" },
];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PER_PAGE = 48;

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 80);
  const group = (GROUPS.find((g) => g.key === one(sp.group))?.key ?? "all") as PeopleGroup;
  const sort = (SORTS.find((s) => s.key === one(sp.sort))?.key ?? "rank") as PeopleSort;
  const letter = LETTERS.find((l) => l === one(sp.letter).toUpperCase());
  const page = Math.max(1, Math.min(50, Number.parseInt(one(sp.page), 10) || 1));

  const [results, list] = await Promise.all([
    q ? searchPeople(q, 24) : Promise.resolve([]),
    listPeople({ group, sort: letter && sort === "rank" ? "name" : sort, page, perPage: PER_PAGE, letter }),
  ]);
  const pages = Math.max(1, Math.ceil(list.total / PER_PAGE));

  const href = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const next = { group, sort, letter, page: undefined as number | undefined, ...patch };
    if (next.group && next.group !== "all") params.set("group", String(next.group));
    if (next.sort && next.sort !== "rank") params.set("sort", String(next.sort));
    if (next.letter) params.set("letter", String(next.letter));
    if (next.page && Number(next.page) > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/people?${qs}` : "/people";
  };

  return (
    <PageShell wide>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-bold tracking-wide text-accent uppercase">The Nollywood 500</p>
        <h1 className="text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]">Actors, actresses and directors</h1>
        <p className="max-w-2xl text-[15px] text-sub">
          The 500 Nollywood stars with the most films, ranked, and the directors behind them. Each profile has a full filmography, frequent co-stars,
          YouTube and the social accounts they list publicly.
        </p>
      </div>

      <form action="/people" role="search" className="flex h-14 max-w-2xl items-center gap-3 rounded-full border border-card-line bg-card pr-2 pl-5 shadow-[0_3px_12px_rgb(0_0_0/0.1)] transition focus-within:shadow-lift">
        <Icon name="search" size={18} strokeWidth={2.4} className="shrink-0" />
        <label className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-tight font-semibold">Find a person</span>
          <input type="search" name="q" defaultValue={q} placeholder="e.g. Funke Akindele, Ramsey Nouah" className="min-w-0 bg-transparent text-[14px] leading-tight outline-none" />
        </label>
        <button type="submit" aria-label="Search" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cta text-white">
          <Icon name="search" size={16} strokeWidth={2.6} />
        </button>
      </form>

      {q && (
        <section className="flex flex-col gap-4">
          <SectionHeading title={results.length ? `${results.length} ${results.length === 1 ? "person" : "people"}` : "No one found"} subtitle={`“${q}”`} href="/people" linkLabel="Clear" />
          {results.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {results.map((p) => (
                <PersonResult key={p.id} person={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No one by that name yet"
              body="We add the cast and directors of every film on Marquee. Check the spelling, or search films instead."
              action={
                <Link href={`/discover?q=${encodeURIComponent(q)}`} className="font-semibold underline underline-offset-4">
                  Search films for “{q}”
                </Link>
              }
            />
          )}
        </section>
      )}

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Who to show" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
            {GROUPS.map((g) => (
              <Link key={g.key} href={href({ group: g.key, letter: undefined })} aria-current={group === g.key ? "true" : undefined} className={chipClass(group === g.key)}>
                {g.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Sort" className="flex items-center gap-1 text-[14px]">
            <span className="mr-1 text-sub">Sort</span>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={href({ sort: s.key })}
                aria-current={sort === s.key ? "true" : undefined}
                className={cn("rounded-full px-3 py-1.5 font-semibold transition", sort === s.key ? "bg-ink text-page" : "hover:bg-field")}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>

        <nav aria-label="First letter" className="scrollbar-none -mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          <Link href={href({ letter: undefined })} className={cn("flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-semibold", !letter ? "bg-ink text-page" : "hover:bg-field")}>
            All
          </Link>
          {LETTERS.map((l) => (
            <Link
              key={l}
              href={href({ letter: l })}
              aria-current={letter === l ? "true" : undefined}
              className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold", letter === l ? "bg-ink text-page" : "text-sub hover:bg-field hover:text-ink")}
            >
              {l}
            </Link>
          ))}
        </nav>

        <p className="text-[14px] text-sub">
          {list.total.toLocaleString("en")} {group === "directors" ? "directors" : group === "actresses" ? "actresses" : group === "actors" ? "actors" : "people"}
          {letter && ` starting with ${letter}`}
          {pages > 1 && ` · page ${page} of ${pages}`}
          {(group === "actresses" || group === "actors") &&
            " · only people whose gender is listed on TMDB or Wikidata; everyone is under Everyone"}
        </p>

        {list.people.length ? (
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {list.people.map((p) => (
              <li key={p.id} className="relative">
                {sort === "rank" && !letter && p.rank && group !== "directors" && (
                  <span className="absolute top-2 left-2 z-10 rounded-full bg-ink px-2 py-0.5 text-[11.5px] font-bold text-page tabular-nums">#{p.rank}</span>
                )}
                <PersonCard person={p} />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No one here yet" body="Try another letter or group." />
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-center gap-2 pt-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className={chipClass(false)}>
                <Icon name="chevronLeft" size={14} /> Previous
              </Link>
            )}
            <span className="px-2 text-[14px] text-sub tabular-nums">
              {page} / {pages}
            </span>
            {page < pages && (
              <Link href={href({ page: page + 1 })} className={chipClass(false)}>
                Next <Icon name="chevronRight" size={14} />
              </Link>
            )}
          </nav>
        )}
      </section>

      <Link href="/channels" data-reveal className="group flex items-center gap-4 rounded-2xl border border-card-line p-5 transition hover:border-ink hover:shadow-card">
        <YouTubeMark size={40} />
        <span className="flex-1">
          <span className="block text-[17px] font-bold">Watch Nollywood free on YouTube</span>
          <span className="block text-[14px] text-sub">Channels that publish full Nigerian movies, from Yoruba hits to the latest romance.</span>
        </span>
        <Icon name="chevronRight" size={20} className="transition group-hover:translate-x-1" />
      </Link>
    </PageShell>
  );
}
