import type { Metadata } from "next";
import Link from "next/link";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { Icon } from "@/components/icons";
import { EmptyState, PageShell, SectionHeading } from "@/components/layout/page";
import { PersonCard, PersonResult } from "@/components/people/people-ui";
import { popularPeople, searchPeople } from "@/server/queries/people";

export const metadata: Metadata = {
  title: "Actors and directors",
  description: "Find Nollywood actors and directors: their films, YouTube channels and social accounts.",
};

type SearchParams = Promise<{ q?: string | string[] }>;

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? "";
  const [results, popular] = await Promise.all([q ? searchPeople(q, 24) : Promise.resolve([]), popularPeople(30)]);

  return (
    <PageShell wide>
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]">Actors and directors</h1>
        <p className="text-[15px] text-sub">Profiles, films, YouTube channels and where to follow them.</p>
      </div>

      <form action="/people" role="search" className="flex h-14 max-w-2xl items-center gap-3 rounded-full border border-card-line bg-card pr-2 pl-5 shadow-[0_3px_12px_rgb(0_0_0/0.1)] transition focus-within:shadow-lift">
        <Icon name="search" size={18} strokeWidth={2.4} className="shrink-0" />
        <label className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-tight font-semibold">Find a person</span>
          <input type="search" name="q" defaultValue={q} placeholder="e.g. Funke Akindele" className="min-w-0 bg-transparent text-[14px] leading-tight outline-none" />
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

      <section className="flex flex-col gap-4">
        <SectionHeading title="Faces of Nollywood" subtitle="The people with the most films on Marquee" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {popular.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      </section>

      <Link
        href="/channels"
        data-reveal
        className="group flex items-center gap-4 rounded-2xl border border-card-line p-5 transition hover:border-ink hover:shadow-card"
      >
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
