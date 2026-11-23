import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/film/backdrop";
import { FilmCard } from "@/components/film/film-row";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { Icon, StarGlyph } from "@/components/icons";
import { EmptyState, IconLink, TmdbCredit } from "@/components/layout/page";
import { ChannelCard, PersonPhoto, SocialButtons } from "@/components/people/people-ui";
import { ShareButton } from "@/components/review/share-button";
import { Poster } from "@/components/ui/poster";
import { buttonClass } from "@/components/ui/styles";
import { POSTER_GRADIENTS } from "@/lib/constants";
import { cn, pickByKey, plural } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { savedFilmIds } from "@/server/queries/films";
import { getPerson, type Collaborator, type PersonDetail } from "@/server/queries/people";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) return { title: "Person not found" };
  return {
    title: person.name,
    description: person.headline ?? `${person.name}: ${plural(person.filmCount, "film")}, YouTube and social accounts.`,
    openGraph: { title: person.name, images: person.photoUrl ? [person.photoUrl] : undefined },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

function Section({ title, subtitle, children, className, id }: { title: React.ReactNode; subtitle?: string; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} data-reveal className={cn("flex scroll-mt-28 flex-col gap-4 border-t border-line py-8", className)}>
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px]">{title}</h2>
        {subtitle && <p className="text-[14px] text-sub">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div data-reveal="scale" className="flex flex-col gap-1 rounded-2xl border border-card-line p-4">
      <span className="text-[13px] text-sub">{label}</span>
      <span className="text-[22px] leading-tight font-bold tracking-[-0.4px]">{value}</span>
    </div>
  );
}

function People({ people, unit }: { people: Collaborator[]; unit: string }) {
  return (
    <ul className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-5 md:px-0">
      {people.map((p) => (
        <li key={p.slug} className="w-[112px] shrink-0 md:w-auto">
          <Link href={`/people/${p.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition hover:bg-field/70">
            <span className="transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
              <PersonPhoto name={p.name} photoUrl={p.photoUrl} size={80} className="shadow-card" />
            </span>
            <span className="line-clamp-2 text-[14px] leading-tight font-semibold group-hover:underline">{p.name}</span>
            <span className="text-[12.5px] text-sub">{plural(p.shared, unit)} together</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Year-by-year filmography: every credit, with role and character. */
function Filmography({ credits }: { credits: PersonDetail["credits"] }) {
  const byYear = new Map<number, PersonDetail["credits"]>();
  for (const c of credits) byYear.set(c.film.year, [...(byYear.get(c.film.year) ?? []), c]);
  return (
    <ol className="flex flex-col">
      {[...byYear.entries()].map(([year, list]) => (
        <li key={year} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 border-b border-line py-3 last:border-0 md:grid-cols-[72px_minmax(0,1fr)]">
          <span className="pt-2 text-[15px] font-bold text-sub tabular-nums">{year}</span>
          <ul className="flex flex-col gap-2">
            {list.map((c) => (
              <li key={c.film.id}>
                <Link href={`/films/${c.film.slug}`} className="group flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-field/70">
                  <Poster film={c.film} showTitle={false} className="h-14 w-10 shrink-0 rounded-md" sizes="40px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold group-hover:underline">{c.film.title}</span>
                    <span className="block truncate text-[13px] text-sub">
                      {[c.directed && "Director", c.acted && (c.character ? `as ${c.character}` : "Cast"), c.film.genres.slice(0, 2).join(", ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {c.film.avgRating !== null && (
                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold">
                      <StarGlyph size={12} /> {c.film.avgRating.toFixed(1)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
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
  const wikipedia = references.find((r) => r.network === "wikipedia");
  const born = [formatDate(person.birthday), person.placeOfBirth].filter(Boolean).join(" · ");
  const firstName = person.name.split(" ")[0];
  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${person.name} full movie`)}`;
  const ctx = { savedIds, signedIn: Boolean(user), returnTo: `/people/${person.slug}` };
  const acted = person.credits.filter((c) => c.acted).length;
  const directed = person.credits.filter((c) => c.directed).length;
  const actingLabel = ["Actress", "Actor"].includes(person.role) ? person.role : "Performer";
  const roles = [acted && actingLabel, directed && "Director"].filter((r): r is string => Boolean(r));
  const { career } = person;
  const span = career.firstYear && career.lastYear ? (career.firstYear === career.lastYear ? `${career.firstYear}` : `${career.firstYear}–${career.lastYear}`) : "–";

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
                {person.rank && (
                  <Link href="/people" className="rounded-full bg-star px-3 py-1 text-[12px] font-bold text-[#222]">
                    #{person.rank} in the Nollywood 500
                  </Link>
                )}
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
                {person.credits.length > 0 && (
                  <a href="#filmography" className={buttonClass("glass", "lg")}>
                    Filmography
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Section title="Career at a glance" className="border-t-0">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Films on Marquee" value={person.filmCount} />
            <Stat label="Years active" value={span} />
            <Stat label={directed ? "Directed" : "Roles"} value={directed ? `${directed}${acted ? ` · acted in ${acted}` : ""}` : acted} />
            <Stat label="Languages" value={<span className="text-[17px]">{career.languages.join(", ") || "–"}</span>} />
          </div>
          {career.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-sub">Most often in</span>
              {career.genres.map((g) => (
                <Link
                  key={g.genre}
                  href={`/discover?genre=${g.genre}&q=${encodeURIComponent(person.name)}`}
                  className="rounded-full border border-card-line px-3 py-1 text-[13.5px] font-semibold transition hover:border-ink"
                >
                  {g.genre} <span className="font-normal text-sub">· {g.count}</span>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {person.knownFor.length > 0 && (
          <Section title="Known for">
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
              {person.knownFor.map((film) => (
                <FilmCard key={film.id} film={film} ctx={ctx} />
              ))}
            </div>
          </Section>
        )}

        <Section title="Follow and contact" id="socials">
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
            {person.bioSource === "wikipedia" && wikipedia && (
              <p className="text-[13px] text-sub">
                From{" "}
                <a href={wikipedia.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
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

        {person.coStars.length > 0 && (
          <Section title="Frequent co-stars" subtitle={`Who ${firstName} shares the screen with most`}>
            <People people={person.coStars} unit="film" />
          </Section>
        )}

        {person.directors.length > 0 && (
          <Section title={acted ? "Directors they work with" : "Directors on their films"}>
            <People people={person.directors.slice(0, 5)} unit="film" />
          </Section>
        )}

        <Section title={`Filmography · ${person.filmCount}`} subtitle="Every credit on Marquee, newest first" id="filmography">
          {person.credits.length ? <Filmography credits={person.credits} /> : <EmptyState title="No films yet" body="Their films will show up here once they're on Marquee." />}
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
