import type { Metadata } from "next";
import Link from "next/link";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { EmptyState, PageShell, SectionHeading } from "@/components/layout/page";
import { ChannelCard } from "@/components/people/people-ui";
import { chipClass } from "@/components/ui/styles";
import { listChannels, searchChannels } from "@/server/queries/people";

export const metadata: Metadata = {
  title: "Nollywood on YouTube",
  description: "YouTube channels that publish full Nollywood and Yoruba movies, plus the studios behind the trailers on Marquee.",
};

type SearchParams = Promise<{ q?: string | string[]; lang?: string | string[] }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 80) ?? "";

const FILTERS = [
  { key: "", label: "All" },
  { key: "English", label: "English" },
  { key: "Yoruba", label: "Yoruba" },
  { key: "studios", label: "Studios & trailers" },
];

export default async function ChannelsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const lang = one(sp.lang);
  const all = q ? await searchChannels(q, 60) : await listChannels();

  const filtered = all.filter((c) =>
    !lang ? true : lang === "studios" ? c.kind === "studio" || c.kind === "trailers" : c.language === lang && c.kind !== "trailers",
  );
  const picks = filtered.filter((c) => c.kind !== "trailers");
  const trailerChannels = filtered.filter((c) => c.kind === "trailers");

  return (
    <PageShell wide>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <YouTubeMark size={52} />
          <div>
            <h1 className="text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]">Nollywood on YouTube</h1>
            <p className="text-[15px] text-sub">Channels that publish full Nigerian movies for free, and the studios behind our trailers.</p>
          </div>
        </div>
        <form action="/channels" role="search" className="flex h-11 w-full items-center gap-2 rounded-full border border-card-line bg-card px-4 md:w-80">
          {lang && <input type="hidden" name="lang" value={lang} />}
          <input type="search" name="q" defaultValue={q} aria-label="Search channels" placeholder="Search channels" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
        </form>
      </div>

      <nav aria-label="Channel language" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
        {FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (f.key) params.set("lang", f.key);
          const qs = params.toString();
          return (
            <Link key={f.key || "all"} href={qs ? `/channels?${qs}` : "/channels"} aria-current={lang === f.key ? "true" : undefined} className={chipClass(lang === f.key)}>
              {f.label}
            </Link>
          );
        })}
      </nav>

      {!filtered.length && <EmptyState title="No channels match" body="Try another name, or clear the search." action={<Link href="/channels" className="font-semibold underline underline-offset-4">Show all channels</Link>} />}

      {picks.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading title={q ? `Channels for “${q}”` : "Where to watch full movies"} subtitle="Hand-picked channels, checked on YouTube" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      )}

      {trailerChannels.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading title="Studios and trailer channels" subtitle="The channels that posted trailers for films on Marquee" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trailerChannels.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      )}

      <p className="text-[13px] text-sub">
        Marquee links to these channels and isn&apos;t affiliated with them or with YouTube.
      </p>
    </PageShell>
  );
}
