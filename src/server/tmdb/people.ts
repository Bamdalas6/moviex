import { inArray, isNotNull, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { slugify } from "../../lib/utils";
import * as schema from "../db/schema";
import { runBatched, type Statement } from "./batch";
import { mapLimit, type TmdbPerson } from "./client";
import { photoFromIndex, type PhotoIndex } from "./media";
import { wikidataProfiles, wikipediaSummary } from "./wiki";

type Db = LibSQLDatabase<typeof schema>;

export function genderFromHeadline(headline: string | null | undefined): number {
  const h = (headline ?? "").toLowerCase();
  if (/\b(actress|businesswoman|songstress|she)\b/.test(h)) return 1;
  if (/\b(actor|businessman|he)\b/.test(h)) return 2;
  return 0;
}

export type Credit = {
  filmId: string;
  tmdbPersonId: number;
  role: "cast" | "director";
  character: string | null;
  position: number;
};

/** What a film's credit list tells us about someone, without an extra API call. */
export type LightPerson = {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  knownFor: string | null;
  popularity: number;
  gender: number;
};

/**
 * Writes people and credits for the imported films.
 *
 * Everyone credited gets a page from their credit data alone. The Nollywood
 * collection (`featured`: the most-credited actors and actresses plus prolific
 * directors) also gets a full profile: bio and photo from Wikipedia, public
 * social accounts from Wikidata (falling back to TMDB's external ids), birth
 * details, and a rank. People who drop out of the collection keep their page
 * and profile but lose their rank.
 */
export async function importPeople(
  db: Db,
  input: {
    credits: Credit[];
    lightPeople: Map<number, LightPerson>;
    featured: TmdbPerson[];
    /** Actors in collection order; the first `collectionSize` with a photo get a rank. */
    rankPool: number[];
    collectionSize: number;
    photos: PhotoIndex;
    log: (line: string) => void;
  },
) {
  const { credits, lightPeople, featured, rankPool, collectionSize, photos, log } = input;

  // Enrichment for the collection.
  const wikidataIds = [...new Set(featured.map((p) => p.external_ids?.wikidata_id).filter((v): v is string => Boolean(v)))];
  const wiki = await wikidataProfiles(wikidataIds);
  const summaries = new Map(
    await mapLimit(featured, 4, async (p) => {
      const title = p.external_ids?.wikidata_id ? wiki.get(p.external_ids.wikidata_id)?.wikipediaTitle : null;
      return [p.id, title ? await wikipediaSummary(title) : null] as const;
    }),
  );

  // The collection is faces only: rank the first people in the pool who have a photo
  // (TMDB's, their Wikipedia article's, or Wikidata's).
  const byId = new Map(featured.map((p) => [p.id, p]));
  const wikiPhotoOf = (p: TmdbPerson) => summaries.get(p.id)?.photoUrl ?? photoFromIndex(photos, p.id, p.name);
  const rankOf = new Map<number, number>();
  for (const id of rankPool) {
    if (rankOf.size >= collectionSize) break;
    const p = byId.get(id);
    if (p && (p.profile_path || wikiPhotoOf(p))) rankOf.set(id, rankOf.size + 1);
  }

  // Ids and slugs: one read, then everything is decided in memory.
  const existing = await db.select({ id: schema.people.id, tmdbId: schema.people.tmdbId, slug: schema.people.slug }).from(schema.people);
  const idOf = new Map(existing.map((r) => [r.tmdbId, r.id]));
  const slugOwner = new Map(existing.map((r) => [r.slug, r.tmdbId]));
  const slugFor = (tmdbId: number, name: string) => {
    const base = slugify(name) || `person-${tmdbId}`;
    const owner = slugOwner.get(base);
    const slug = owner === undefined || owner === tmdbId ? base : `${base}-${tmdbId}`;
    slugOwner.set(slug, tmdbId);
    return slug;
  };

  const statements: Statement[] = [db.update(schema.people).set({ rank: null }).where(isNotNull(schema.people.rank))];
  const featuredIds = new Set(featured.map((p) => p.id));

  // Light rows: basic identity only, so enrichment from earlier runs is never wiped.
  for (const p of lightPeople.values()) {
    if (featuredIds.has(p.tmdbId)) continue;
    const id = idOf.get(p.tmdbId) ?? crypto.randomUUID();
    const isNew = !idOf.has(p.tmdbId);
    idOf.set(p.tmdbId, id);
    const values = {
      name: p.name,
      tmdbProfilePath: p.profilePath,
      knownFor: p.knownFor,
      popularity: p.popularity,
      gender: p.gender,
      // A Wikidata photo when TMDB has none (only ever added here, never cleared).
      ...(p.profilePath ? {} : { photoUrl: photoFromIndex(photos, p.tmdbId, p.name) ?? undefined }),
    };
    statements.push(
      isNew
        ? db.insert(schema.people).values({ ...values, id, tmdbId: p.tmdbId, slug: slugFor(p.tmdbId, p.name) }).onConflictDoNothing()
        : db.update(schema.people).set(values).where(sql`${schema.people.tmdbId} = ${p.tmdbId}`),
    );
  }

  // Full profiles for the collection.
  let withSocials = 0;
  for (const p of featured) {
    const ext = p.external_ids;
    const w = ext?.wikidata_id ? wiki.get(ext.wikidata_id) : undefined;
    const summary = summaries.get(p.id) ?? null;
    const tmdbBio = p.biography?.trim() || null;
    const values = {
      name: p.name,
      knownFor: p.known_for_department,
      headline: w?.headline ?? null,
      biography: summary?.extract ?? tmdbBio,
      bioSource: summary ? ("wikipedia" as const) : tmdbBio ? ("tmdb" as const) : null,
      wikipediaUrl: summary?.url ?? null,
      tmdbProfilePath: p.profile_path,
      photoUrl: wikiPhotoOf(p),
      birthday: p.birthday,
      placeOfBirth: p.place_of_birth,
      // Wikidata first (sourced and maintained), TMDB's external ids as the fallback.
      instagram: w?.instagram ?? ext?.instagram_id ?? null,
      x: w?.x ?? ext?.twitter_id ?? null,
      facebook: w?.facebook ?? ext?.facebook_id ?? null,
      tiktok: w?.tiktok ?? ext?.tiktok_id ?? null,
      youtube: w?.youtube ?? ext?.youtube_id ?? null,
      website: w?.website ?? null,
      imdbId: ext?.imdb_id ?? null,
      popularity: p.popularity ?? 0,
      // TMDB often lacks gender for Nollywood actors: fall back to Wikidata, then to the description ("Nigerian actress").
      gender: p.gender || w?.gender || genderFromHeadline(w?.headline),
      rank: rankOf.get(p.id) ?? null,
      updatedAt: new Date(),
    };
    if (values.instagram || values.x || values.facebook || values.tiktok || values.youtube || values.website) withSocials++;
    const id = idOf.get(p.id) ?? crypto.randomUUID();
    idOf.set(p.id, id);
    statements.push(
      db
        .insert(schema.people)
        .values({ ...values, id, tmdbId: p.id, slug: slugFor(p.id, p.name) })
        .onConflictDoUpdate({ target: schema.people.tmdbId, set: values }),
    );
  }

  // Credits for the imported films are rewritten from scratch.
  const filmIds = [...new Set(credits.map((c) => c.filmId))];
  for (let i = 0; i < filmIds.length; i += 200) {
    statements.push(db.delete(schema.filmPeople).where(inArray(schema.filmPeople.filmId, filmIds.slice(i, i + 200))));
  }
  const links = credits
    .filter((c) => idOf.has(c.tmdbPersonId))
    .map((c) => ({ filmId: c.filmId, personId: idOf.get(c.tmdbPersonId)!, role: c.role, character: c.character, position: c.position }));
  for (let i = 0; i < links.length; i += 100) {
    statements.push(db.insert(schema.filmPeople).values(links.slice(i, i + 100)).onConflictDoNothing());
  }

  await runBatched(db, statements);

  const [totals] = await db
    .select({ total: sql<number>`count(*)`, ranked: sql<number>`sum(case when ${schema.people.rank} is not null then 1 else 0 end)` })
    .from(schema.people);
  log(
    `People: ${featured.length} full profiles (${withSocials} with public social accounts), ${totals?.ranked ?? 0} in the Nollywood collection, ` +
      `${totals?.total ?? 0} pages in total, ${links.length} credits.`,
  );
}
