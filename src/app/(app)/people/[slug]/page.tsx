import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/film/backdrop";
import { FilmCard } from "@/components/film/film-row";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { Icon } from "@/components/icons";
import { EmptyState, IconLink, TmdbCredit } from "@/components/layout/page";
import { ChannelCard, PersonPhoto, SocialButtons } from "@/components/people/people-ui";
import { ShareButton } from "@/components/review/share-button";
import { buttonClass } from "@/components/ui/styles";
import { POSTER_GRADIENTS } from "@/lib/constants";
import { cn, pickByKey, plural } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { savedFilmIds } from "@/server/queries/films";
import { getPerson } from "@/server/queries/people";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) return { title: "Person not found" };
  return {
    title: person.name,
    description: person.headline ?? `${person.name}: films, YouTube and social accounts.`,
    openGraph: { title: person.name, images: person.photoUrl ? [person.photoUrl] : undefined },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

function Section({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section data-reveal className={cn("flex flex-col gap-4 border-t border-line py-8", className)}>
      <h2 className="text-[22px] font-bold tracking-[-0.4px]">{title}</h2>
      {children}
    </section>
  );
}

export default async function PersonPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [person, user] = await Promise.all([getPerson(slug), getCurrentUser()]);
  if (!person) notFound();
  const savedIds = await savedFilmIds(user?.id);

  const youtube = person.socials.find((s) => s.network === "youtube");
  const contacts = person.socials.filter((s) => s.network !== "imdb" && s.network !== "wikipedia");
  const references = person.socials.filter((s) => s.network === "imdb" || s.network === "wikipedia");
  const born = [formatDate(person.birthday), person.placeOfBirth].filter(Boolean).join(" · ");
  const firstName = person.name.split(" ")[0];
  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${person.name} full movie`)}`;
  const ctx = { savedIds, signedIn: Boolean(user), returnTo: `/people/${person.slug}` };
  const roles = [person.credits.some((c) => c.acted) && "Actor", person.credits.some((c) => c.directed) && "Director"].filter(
    (r): r is string => Boolean(r),
  );
  const creditLabel = (c: (typeof person.credits)[number]) =>
    [c.directed && "Director", c.acted && (c.character ? `as ${c.character}` : "Cast")].filter(Boolean).join(" · ");

  return (
    <main id="main" className="pb-28 md:pb-16">
      <section className="relative isolate text-white">
        <Backdrop
          films={[{ title: person.name, posterUrl: person.photoUrl, posterGradient: pickByKey(POSTER_GRADIENTS, person.name), posterSpoiler: false }]}
        />
        <div className="mx-auto max-w-6xl px-5 pt-5 pb-20 md:px-8 md:pt-8">
          <div className="flex items-center justify-between">
            <IconLink href="/people" label="All actors and directors" icon="chevronLeft" variant="glass" />
            <ShareButton path={`/people/${person.slug}`} title={person.name} label="Share profile" variant="glass" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:gap-8 md:text-left">
            <div className="hero-recede animate-pop rounded-full ring-4 ring-white/20">
              <PersonPhoto name={person.name} photoUrl={person.photoUrl} size={176} className="shadow-[0_24px_48px_rgb(0_0_0/0.45)]" />
            </div>
            <div className="flex flex-col items-center gap-2 md:items-start md:pb-2">
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {(roles.length ? roles : [person.role]).map((r) => (
                  <span key={r} className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#222]">
                    {r}
                  </span>
                ))}
              </div>
              <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-1px] md:text-[48px]">{person.name}</h1>
              {person.headline && <p className="text-[15px] text-white/90 first-letter:uppercase">{person.headline}</p>}
              <p className="text-[14px] text-white/75">{[born && `Born ${born}`, plural(person.filmCount, "film") + " on Marquee"].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2.5 md:justify-start">
                {youtube ? (
                  <a href={youtube.url} target="_blank" rel="noopener noreferrer" className={buttonClass("white", "lg", "gap-2")}>
                    <YouTubeMark size={22} /> {firstName}&apos;s YouTube channel
                  </a>
                ) : (
                  <a href={youtubeSearch} target="_blank" rel="noopener noreferrer" className={buttonClass("white", "lg", "gap-2")}>
                    <YouTubeMark size={22} /> Find {firstName}&apos;s movies on YouTube
                  </a>
                )}
                {contacts.length > 0 && (
                  <a href="#socials" className={buttonClass("glass", "lg")}>
                    Follow {firstName}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Section title={<span id="socials" className="scroll-mt-28">Follow and contact</span>} className="border-t-0">
          {contacts.length ? (
            <>
              <SocialButtons links={contacts} />
              <p className="text-[13px] text-sub">
                Public accounts listed on Wikidata and TMDB. For bookings and business, use the contact details on {firstName}&apos;s own pages.
              </p>
            </>
          ) : (
            <EmptyState
              title="No public social accounts listed yet"
              body={`We only show accounts ${firstName} has listed publicly. Try their films on YouTube in the meantime.`}
              action={
                <a href={youtubeSearch} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  Search YouTube for {person.name}
                </a>
              }
            />
          )}
        </Section>

        {person.youtubeChannel && (
          <Section title="YouTube channel">
            <ChannelCard channel={person.youtubeChannel} className="max-w-md" />
          </Section>
        )}

        {person.biography && (
          <Section title="Biography">
            <p className="max-w-3xl text-[16px] leading-relaxed whitespace-pre-line">{person.biography}</p>
            {person.bioSource === "wikipedia" && references.find((r) => r.network === "wikipedia") && (
              <p className="text-[13px] text-sub">
                From{" "}
                <a href={references.find((r) => r.network === "wikipedia")!.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Wikipedia
                </a>
                , available under{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  CC BY-SA 4.0
                </a>
                .
              </p>
            )}
          </Section>
        )}

        <Section title={`Films on Marquee · ${person.filmCount}`}>
          {person.credits.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
              {person.credits.map((c) => (
                <div key={c.film.id} className="flex flex-col gap-1">
                  <FilmCard film={c.film} ctx={ctx} />
                  <p className="truncate text-[13px] text-sub">{creditLabel(c)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No films yet" body="Their films will show up here once they're on Marquee." />
          )}
        </Section>

        {references.length > 0 && (
          <Section title="More about them">
            <SocialButtons links={references} />
          </Section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6">
          <Link href="/channels" className="flex items-center gap-2 text-[15px] font-semibold underline-offset-4 hover:underline">
            <YouTubeMark size={20} /> Nollywood channels on YouTube <Icon name="arrowRight" size={16} />
          </Link>
          <TmdbCredit />
        </div>
      </div>
    </main>
  );
}
