import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrailerCard } from "@/components/film/trailer";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { Icon } from "@/components/icons";
import { EmptyState, IconLink, PageShell, SectionHeading } from "@/components/layout/page";
import { ChannelCard } from "@/components/people/people-ui";
import { buttonClass } from "@/components/ui/styles";
import { initials, plural } from "@/lib/utils";
import { getChannel, listChannels } from "@/server/queries/people";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getChannel(slug);
  if (!data) return { title: "Channel not found" };
  return { title: `${data.channel.name} on YouTube`, description: data.channel.description ?? `Films from ${data.channel.name} on Watch Nollywood.` };
}

const KIND: Record<string, string> = {
  network: "Full Nollywood movies",
  creator: "Creator channel: full movies",
  studio: "Film studio",
  trailers: "Posted trailers for films on Watch Nollywood",
};

export default async function ChannelPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getChannel(slug);
  if (!data) notFound();
  const { channel, films, person } = data;
  const similar = (await listChannels())
    .filter((c) => c.id !== channel.id && c.kind !== "trailers" && (c.language === channel.language || channel.kind === "trailers"))
    .slice(0, 3);

  return (
    <PageShell wide>
      <IconLink href="/channels" label="All YouTube channels" icon="chevronLeft" />

      <section className="relative isolate overflow-hidden rounded-3xl bg-[#141414] p-6 text-white md:p-10">
        <div aria-hidden="true" className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-[#FF0033]/30 blur-3xl" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <span className="animate-pop flex size-24 shrink-0 items-center justify-center rounded-full bg-white text-[30px] font-bold text-[#222] shadow-lift">
            {initials(channel.name)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-white/75">
              <YouTubeMark size={20} /> {KIND[channel.kind]}
              {channel.language && <span>· {channel.language}</span>}
            </p>
            <h1 className="text-[30px] leading-tight font-bold tracking-[-0.6px] md:text-[40px]">{channel.name}</h1>
            {channel.description && <p className="max-w-2xl text-[15px] leading-relaxed text-white/85">{channel.description}</p>}
            {person && (
              <p className="text-[14px] text-white/80">
                Run by{" "}
                <Link href={`/people/${person.slug}`} className="font-semibold text-white underline underline-offset-4">
                  {person.name}
                </Link>
              </p>
            )}
          </div>
          <a href={channel.url} target="_blank" rel="noopener noreferrer" className={buttonClass("white", "lg", "gap-2 self-start md:self-center")}>
            <YouTubeMark size={22} /> Open on YouTube <Icon name="external" size={15} />
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading title={films.length ? `${plural(films.length, "film")} on Watch Nollywood from this channel` : "Films on Watch Nollywood"} />
        {films.length ? (
          <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {films.map((f) =>
              f.trailerKey ? (
                <div key={f.id} data-reveal="scale">
                  <TrailerCard slug={f.slug} videoKey={f.trailerKey} title={f.title} subtitle={`${f.year} · ${f.genres.slice(0, 2).join(", ")}`} />
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <EmptyState
            title="Watch them on YouTube"
            body={`${channel.name} publishes its films on YouTube. Open the channel to start watching, then come back to rate them.`}
            action={
              <a href={channel.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                Open {channel.name}
              </a>
            }
          />
        )}
      </section>

      {similar.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading title="More channels like this" href="/channels" linkLabel="All channels" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
