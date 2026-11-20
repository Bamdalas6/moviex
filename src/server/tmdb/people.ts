import { inArray, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { slugify } from "../../lib/utils";
import * as schema from "../db/schema";
import { mapLimit, type TmdbClient, type TmdbPerson } from "./client";
import { wikidataProfiles, wikipediaSummary } from "./wiki";

type Db = LibSQLDatabase<typeof schema>;

export type Credit = {
  filmId: string;
  tmdbPersonId: number;
  role: "cast" | "director";
  character: string | null;
  position: number;
};

/**
 * Creates or refreshes a profile for everyone credited on the imported films
 * (top-billed cast and directors), then rewrites those films' credits.
 * Identity comes from TMDB; bio, photo and public social accounts from
 * Wikipedia/Wikidata, with TMDB's own external ids as the fallback.
 */
export async function importPeople(db: Db, tmdb: TmdbClient, credits: Credit[], log: (line: string) => void) {
  const ids = [...new Set(credits.map((c) => c.tmdbPersonId))];
  if (!ids.length) return;

  const fetched = await mapLimit(ids, 6, (id) => tmdb.person(id).catch(() => null));
  const persons = fetched.filter((p): p is TmdbPerson => Boolean(p));

  const wikidataIds = [...new Set(persons.map((p) => p.external_ids?.wikidata_id).filter((v): v is string => Boolean(v)))];
  const wiki = await wikidataProfiles(wikidataIds);
  const summaries = new Map(
    await mapLimit(persons, 4, async (p) => {
      const title = p.external_ids?.wikidata_id ? wiki.get(p.external_ids.wikidata_id)?.wikipediaTitle : null;
      return [p.id, title ? await wikipediaSummary(title) : null] as const;
    }),
  );

  // Slugs: the plain name when it's free, otherwise name + TMDB id (two people can share a name).
  const existing = await db.select({ tmdbId: schema.people.tmdbId, slug: schema.people.slug }).from(schema.people);
  const slugOwner = new Map(existing.map((r) => [r.slug, r.tmdbId]));
  const slugFor = (p: TmdbPerson) => {
    const base = slugify(p.name) || `person-${p.id}`;
    const owner = slugOwner.get(base);
    const slug = owner === undefined || owner === p.id ? base : `${base}-${p.id}`;
    slugOwner.set(slug, p.id);
    return slug;
  };

  let withSocials = 0;
  for (const p of persons) {
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
      photoUrl: summary?.photoUrl ?? null,
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
      updatedAt: new Date(),
    };
    if (values.instagram || values.x || values.facebook || values.tiktok || values.youtube || values.website) withSocials++;
    await db
      .insert(schema.people)
      .values({ ...values, tmdbId: p.id, slug: slugFor(p) })
      .onConflictDoUpdate({ target: schema.people.tmdbId, set: values });
  }

  // Rewrite credits for the films we just imported.
  const rows = await db.select({ id: schema.people.id, tmdbId: schema.people.tmdbId }).from(schema.people).where(inArray(schema.people.tmdbId, ids));
  const personId = new Map(rows.map((r) => [r.tmdbId, r.id]));
  const filmIds = [...new Set(credits.map((c) => c.filmId))];
  for (let i = 0; i < filmIds.length; i += 100) {
    await db.delete(schema.filmPeople).where(inArray(schema.filmPeople.filmId, filmIds.slice(i, i + 100)));
  }
  const links = credits
    .filter((c) => personId.has(c.tmdbPersonId))
    .map((c) => ({ filmId: c.filmId, personId: personId.get(c.tmdbPersonId)!, role: c.role, character: c.character, position: c.position }));
  for (let i = 0; i < links.length; i += 200) {
    await db.insert(schema.filmPeople).values(links.slice(i, i + 200)).onConflictDoNothing();
  }

  const total = await db.select({ n: sql<number>`count(*)` }).from(schema.people);
  log(`People: ${persons.length} refreshed (${withSocials} with public social accounts), ${total[0]?.n ?? 0} profiles in total.`);
}
