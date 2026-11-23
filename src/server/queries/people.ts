import "server-only";

import { and, asc, desc, eq, isNotNull, like, or, sql, type SQL } from "drizzle-orm";
import type { FilmSummary } from "@/lib/types";
import { socialLinks, youtubeUrlFor, type SocialLink } from "@/lib/socials";
import { db } from "@/server/db/client";
import { channels, filmPeople, films, people, type Channel, type Person } from "@/server/db/schema";
import { tmdbImage } from "@/server/tmdb/client";
import { normalizeChannelUrl } from "@/server/youtube-oembed";
import { cached, filmsByIds } from "./films";

export type PersonCard = {
  id: string;
  slug: string;
  name: string;
  role: string;
  headline: string | null;
  photoUrl: string | null;
  filmCount: number;
  /** Position in the Nollywood collection, or null. */
  rank: number | null;
  socialCount: number;
  /** Public profiles to follow (no IMDb/Wikipedia reference links). */
  socials: SocialLink[];
};

export type PersonDetail = PersonCard & {
  biography: string | null;
  bioSource: Person["bioSource"];
  birthday: string | null;
  placeOfBirth: string | null;
  socials: SocialLink[];
  youtubeChannel: ChannelCard | null;
  /** One entry per film, e.g. "Director · as Jenifa" when they did both. Newest first. */
  credits: { film: FilmSummary; directed: boolean; acted: boolean; character: string | null }[];
  /** Their best-known films (most TMDB votes). */
  knownFor: FilmSummary[];
  career: { firstYear: number | null; lastYear: number | null; genres: { genre: string; count: number }[]; languages: string[] };
  coStars: Collaborator[];
  directors: Collaborator[];
};

export type Collaborator = { slug: string; name: string; photoUrl: string | null; shared: number };

export type ChannelCard = {
  id: string;
  slug: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  kind: Channel["kind"];
  featured: boolean;
  filmCount: number;
  /** A trailer from this channel, for artwork. */
  sampleTrailerKey: string | null;
};

const ROLE_LABEL: Record<string, string> = { Acting: "Actor", Directing: "Director", Writing: "Writer", Production: "Producer" };
/** "Actress"/"Actor" only when TMDB or Wikidata lists their gender; otherwise the neutral "Performer" (never guessed from a name). */
const roleLabel = (p: Pick<Person, "knownFor" | "gender">) => {
  if (p.knownFor !== "Acting") return ROLE_LABEL[p.knownFor ?? ""] ?? "Film-maker";
  return p.gender === 1 ? "Actress" : p.gender === 2 ? "Actor" : "Performer";
};

// Small (185px) for cards and strips; the profile hero asks for the large one.
const photoFor = (p: Pick<Person, "tmdbProfilePath" | "photoUrl">, size: "w185" | "h632" = "w185") => tmdbImage(p.tmdbProfilePath, size) ?? p.photoUrl;

const published = sql`${films.status} = 'published'`;
// Written with explicit table names: Drizzle leaves columns unqualified in single-table
// queries, which would make "id" inside the subquery mean films.id instead of people.id.
const filmCount = sql<number>`(select count(distinct fp.film_id) from film_people fp join films f on f.id = fp.film_id where fp.person_id = "people"."id" and f.status = 'published')`;

function toCard(p: Person, count: number): PersonCard {
  const socials = socialLinks(p).filter((s) => s.network !== "imdb" && s.network !== "wikipedia");
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    role: roleLabel(p),
    headline: p.headline,
    photoUrl: photoFor(p),
    filmCount: Number(count),
    rank: p.rank,
    socialCount: socials.length,
    socials,
  };
}

const term = (q: string) => `%${q.trim().replace(/[%_\\]/g, "")}%`;

/** Actors and directors whose name matches, best match first. */
export function searchPeople(q: string, limit = 8): Promise<PersonCard[]> {
  const query = q.trim();
  if (query.length < 2) return Promise.resolve([]);
  return cached(`people:search:${query.toLowerCase()}:${limit}`, async () => {
    const lower = query.toLowerCase();
    const rows = await db
      .select({ person: people, count: filmCount })
      .from(people)
      .where(like(people.name, term(query)))
      .orderBy(
        // exact name, then name starting with the query, then the most popular
        desc(sql`lower(${people.name}) = ${lower}`),
        desc(sql`lower(${people.name}) like ${lower.replace(/[%_\\]/g, "") + "%"}`),
        // members of the Nollywood collection before lesser-known namesakes
        asc(sql`${people.rank} is null`),
        asc(people.rank),
        desc(people.popularity),
      )
      .limit(limit);
    return rows.filter((r) => Number(r.count) > 0).map((r) => toCard(r.person, r.count));
  });
}

/** The top of the Nollywood collection: the faces of the catalogue. */
export function popularPeople(limit = 12): Promise<PersonCard[]> {
  return listPeople({ group: "all", sort: "rank", page: 1, perPage: limit }).then((r) => r.people);
}

export type PeopleGroup = "all" | "actresses" | "actors" | "directors";
export type PeopleSort = "rank" | "name" | "popular";

const directorCredits = sql`(select count(*) from film_people fp join films f on f.id = fp.film_id where fp.person_id = "people"."id" and fp.role = 'director' and f.status = 'published')`;

/** One page of the people directory: the Nollywood collection, or directors with 2+ films. */
export function listPeople(opts: { group: PeopleGroup; sort: PeopleSort; page: number; perPage: number; letter?: string }) {
  return cached(`people:list:${JSON.stringify(opts)}`, async () => {
    const where: SQL[] = [];
    if (opts.group === "directors") where.push(sql`${directorCredits} >= 2`);
    else where.push(isNotNull(people.rank));
    if (opts.group === "actresses") where.push(eq(people.gender, 1));
    if (opts.group === "actors") where.push(eq(people.gender, 2));
    if (opts.letter) where.push(like(people.name, `${opts.letter}%`));

    const order =
      opts.sort === "name"
        ? [asc(people.name)]
        : opts.sort === "popular"
          ? [desc(people.popularity)]
          : opts.group === "directors"
            ? [desc(directorCredits), desc(people.popularity)]
            : [asc(people.rank)];

    const [rows, [total]] = await Promise.all([
      db
        .select({ person: people, count: filmCount })
        .from(people)
        .where(and(...where))
        .orderBy(...order)
        .limit(opts.perPage)
        .offset((opts.page - 1) * opts.perPage),
      db.select({ n: sql<number>`count(*)` }).from(people).where(and(...where)),
    ]);
    return { people: rows.map((r) => toCard(r.person, r.count)), total: Number(total?.n ?? 0) };
  });
}

export async function getPerson(slug: string): Promise<PersonDetail | null> {
  const [person] = await db.select().from(people).where(eq(people.slug, slug)).limit(1);
  if (!person) return null;

  const creditRows = await db
    .select({ filmId: filmPeople.filmId, role: filmPeople.role, character: filmPeople.character, votes: films.tmdbVotes })
    .from(filmPeople)
    .innerJoin(films, eq(films.id, filmPeople.filmId))
    .where(and(eq(filmPeople.personId, person.id), published))
    .orderBy(desc(films.year), asc(filmPeople.position));

  const ytUrl = normalizeChannelUrl(youtubeUrlFor(person.youtube));
  const [summaries, channelRow, coStars, directors] = await Promise.all([
    filmsByIds([...new Set(creditRows.map((c) => c.filmId))]),
    ytUrl ? listChannels().then((all) => all.find((c) => c.url === ytUrl) ?? null) : Promise.resolve(null),
    collaborators(person.id, "cast"),
    collaborators(person.id, "director"),
  ]);
  const byId = new Map(summaries.map((f) => [f.id, f]));
  const merged = new Map<string, PersonDetail["credits"][number]>();
  for (const c of creditRows) {
    const film = byId.get(c.filmId);
    if (!film) continue;
    const entry = merged.get(film.id) ?? { film, directed: false, acted: false, character: null };
    if (c.role === "director") entry.directed = true;
    else {
      entry.acted = true;
      entry.character ??= c.character;
    }
    merged.set(film.id, entry);
  }
  const credits = [...merged.values()];

  const votes = new Map(creditRows.map((c) => [c.filmId, c.votes ?? 0]));
  const knownFor = [...credits]
    .sort((a, b) => (votes.get(b.film.id) ?? 0) - (votes.get(a.film.id) ?? 0) || b.film.year - a.film.year)
    .slice(0, 4)
    .map((c) => c.film);
  const years = credits.map((c) => c.film.year).filter((y) => y > 1900);
  const genreCounts = new Map<string, number>();
  for (const c of credits) for (const g of c.film.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  const career = {
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
    genres: [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([genre, count]) => ({ genre, count })),
    languages: [...new Set(credits.map((c) => c.film.language).filter((l): l is string => Boolean(l)))].slice(0, 4),
  };

  return {
    ...toCard(person, credits.length),
    photoUrl: photoFor(person, "h632"),
    biography: person.biography,
    bioSource: person.bioSource,
    birthday: person.birthday,
    placeOfBirth: person.placeOfBirth,
    socials: socialLinks(person),
    youtubeChannel: channelRow,
    credits,
    knownFor,
    career,
    coStars,
    directors,
  };
}

/** People who share the most films with someone: co-stars (cast) or the directors they work with. */
async function collaborators(personId: string, role: "cast" | "director", limit = 10): Promise<Collaborator[]> {
  const rows = await db.all<{ slug: string; name: string; tmdb_profile_path: string | null; photo_url: string | null; shared: number }>(sql`
    select p.slug, p.name, p.tmdb_profile_path, p.photo_url, count(distinct other.film_id) as shared
    from film_people mine
    join films f on f.id = mine.film_id and f.status = 'published'
    join film_people other on other.film_id = mine.film_id and other.person_id <> mine.person_id and other.role = ${role}
    join people p on p.id = other.person_id
    where mine.person_id = ${personId}
    group by p.id
    having count(distinct other.film_id) >= ${role === "cast" ? 2 : 1}
    order by shared desc, p.popularity desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    photoUrl: tmdbImage(r.tmdb_profile_path, "w185") ?? r.photo_url,
    shared: Number(r.shared),
  }));
}

/** Cast and directors of one film, linked to their profiles. */
export async function filmCredits(filmId: string) {
  const rows = await db
    .select({ person: people, role: filmPeople.role, character: filmPeople.character })
    .from(filmPeople)
    .innerJoin(people, eq(people.id, filmPeople.personId))
    .where(eq(filmPeople.filmId, filmId))
    .orderBy(asc(filmPeople.role), asc(filmPeople.position));
  return rows.map((r) => ({
    slug: r.person.slug,
    name: r.person.name,
    photoUrl: photoFor(r.person),
    role: r.role,
    character: r.character,
  }));
}

// ---------------------------------------------------------------------------
// YouTube channels
// ---------------------------------------------------------------------------

const channelFilms = sql<number>`(select count(*) from films f where f.trailer_channel_url = "youtube_channels"."url" and f.status = 'published')`;
const channelTrailer = sql<string | null>`(select f.trailer_key from films f where f.trailer_channel_url = "youtube_channels"."url" and f.status = 'published' order by f.year desc limit 1)`;

function toChannel(c: Channel, count: number, trailer: string | null): ChannelCard {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    url: c.url,
    description: c.description,
    language: c.language,
    kind: c.kind,
    featured: c.featured,
    filmCount: Number(count),
    sampleTrailerKey: trailer,
  };
}

/** Every channel: hand-picked ones first, then studios that posted our trailers. */
export function listChannels(): Promise<ChannelCard[]> {
  return cached("channels:all", async () => {
    const rows = await db
      .select({ channel: channels, count: channelFilms, trailer: channelTrailer })
      .from(channels)
      .orderBy(desc(channels.featured), sql`${channels.kind} = 'trailers'`, asc(channels.priority), desc(channelFilms), asc(channels.name));
    return rows.map((r) => toChannel(r.channel, r.count, r.trailer));
  });
}

/** Words that mean "where can I watch Nollywood on YouTube?" rather than a specific name. */
const GENERIC = /\b(you\s?tube|channels?|nollywood|naija|nigerian?|full\s*movies?|free\s*movies?|movies?|films?)\b/i;

/** Channels matching a search: by name, language or description; generic Nollywood searches get the featured ones. */
export async function searchChannels(q: string, limit = 6): Promise<ChannelCard[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const all = await listChannels();
  const t = query.toLowerCase();
  const direct = all.filter(
    (c) => c.name.toLowerCase().includes(t) || c.language?.toLowerCase() === t || (c.kind !== "trailers" && c.description?.toLowerCase().includes(t)),
  );
  const generic = GENERIC.test(query) ? all.filter((c) => c.featured) : [];
  return [...new Map([...direct, ...generic].map((c) => [c.id, c])).values()].slice(0, limit);
}

export async function getChannel(slug: string) {
  const all = await listChannels();
  const channel = all.find((c) => c.slug === slug);
  if (!channel) return null;
  const ids = await db
    .select({ id: films.id })
    .from(films)
    .where(and(eq(films.trailerChannelUrl, channel.url), published))
    .orderBy(desc(films.year));
  const [channelFilmsList, person] = await Promise.all([
    filmsByIds(ids.map((r) => r.id)),
    // A creator channel that belongs to someone in our catalogue links back to them.
    db
      .select({ slug: people.slug, name: people.name })
      .from(people)
      .where(or(eq(people.youtube, channel.url), like(people.youtube, `%${channel.url.split("/").pop()}`)))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);
  return { channel, films: channelFilmsList, person };
}
