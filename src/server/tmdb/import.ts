import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { GENRES, MAX_GENRES_PER_FILM, POSTER_GRADIENTS } from "../../lib/constants";
import { pickByKey, slugify } from "../../lib/utils";
import * as schema from "../db/schema";
import { mapLimit, TmdbClient, type TmdbListMovie, type TmdbMovieDetail } from "./client";

/**
 * Imports Nollywood and wider African cinema from TMDB:
 * films, official posters, cast/crew, genres, streaming availability in
 * Nigeria and the "now playing in Nigerian cinemas" list.
 *
 * Idempotent: films are matched by TMDB id, then by slug, so re-running
 * refreshes data (and the now-playing flags) instead of duplicating rows.
 * Community data (ratings, reviews, uploads) is never touched.
 */

type Db = LibSQLDatabase<typeof schema>;

export type CuratedFilm = {
  title: string;
  year: number;
  industry?: string;
  badge?: string | null;
  boxOfficeRank?: number | null;
};

export type ImportedFilm = {
  id: string;
  slug: string;
  title: string;
  tmdbRating: number | null;
  tmdbVotes: number;
};

type Hint = { curated?: CuratedFilm; nowPlaying?: boolean };

const REGION = "NG";

const FRANCOPHONE = new Set(["SN", "CI", "ML", "BF", "CM", "BJ", "TG", "CD", "NE", "GN", "CG", "GA"]);

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
  sw: "Swahili",
  tw: "Twi",
  ak: "Twi",
  fr: "French",
  zu: "Zulu",
  xh: "Xhosa",
  af: "Afrikaans",
  wo: "Wolof",
};

/** TMDB genre → Marquee genre. Unlisted TMDB genres (e.g. "TV Movie") are dropped. */
const GENRE_MAP: Record<string, (typeof GENRES)[number]> = {
  Drama: "Drama",
  Comedy: "Comedy",
  Action: "Action",
  Adventure: "Action",
  Crime: "Crime",
  Thriller: "Thriller",
  Mystery: "Thriller",
  Romance: "Romance",
  History: "Epic",
  War: "Epic",
  Western: "Epic",
  Family: "Family",
  Animation: "Family",
  Fantasy: "Fantasy",
  "Science Fiction": "Fantasy",
  Horror: "Horror",
  Documentary: "Documentary",
  Music: "Drama",
};

/** Which industry a film belongs to, or null when it isn't African cinema. */
export function industryFor(detail: Pick<TmdbMovieDetail, "original_language" | "origin_country" | "production_countries">) {
  const countries = new Set([...(detail.origin_country ?? []), ...detail.production_countries.map((c) => c.iso_3166_1)]);
  const lang = detail.original_language;
  if (countries.has("NG") || ["yo", "ig", "ha"].includes(lang)) return lang === "ha" ? "Kannywood" : "Nollywood";
  if (countries.has("GH") || lang === "tw" || lang === "ak") return "Ghana";
  if (countries.has("KE")) return "Kenya";
  if (countries.has("ZA")) return "South Africa";
  if ([...countries].some((c) => FRANCOPHONE.has(c))) return "Francophone";
  return null;
}

export function mapGenres(names: string[]) {
  const mapped = names.map((n) => GENRE_MAP[n]).filter((g): g is (typeof GENRES)[number] => Boolean(g));
  return [...new Set(mapped)].slice(0, MAX_GENRES_PER_FILM);
}

export async function importFromTmdb(
  db: Db,
  opts: { apiKey: string; curated?: CuratedFilm[]; log?: (message: string) => void },
): Promise<ImportedFilm[]> {
  const log = opts.log ?? (() => undefined);
  const tmdb = new TmdbClient(opts.apiKey);
  const candidates = new Map<number, Hint>();

  const take = (list: TmdbListMovie[], max: number, hint: Hint = {}) => {
    let added = 0;
    for (const movie of list) {
      if (added >= max) break;
      if (!movie.poster_path) continue;
      const existing = candidates.get(movie.id);
      candidates.set(movie.id, { ...existing, ...hint });
      if (!existing) added++;
    }
  };

  // 1. Most-voted films per industry (vote count is TMDB's best proxy for "known").
  const pages = async (params: Record<string, string | number>, count: number) => {
    const out: TmdbListMovie[] = [];
    for (let page = 1; page <= count; page++) {
      const res = await tmdb.discover({ sort_by: "vote_count.desc", page, ...params });
      out.push(...res.results);
      if (page >= res.total_pages) break;
    }
    return out;
  };

  take(await pages({ with_origin_country: "NG", "vote_count.gte": 2 }, 4), 60);
  take(await pages({ with_origin_country: "GH" }, 1), 12);
  take(await pages({ with_origin_country: "KE", with_original_language: "en|sw" }, 1), 10);
  take(await pages({ with_origin_country: "ZA", with_original_language: "zu|xh|af|st|tn" }, 1), 10);
  take(await pages({ with_origin_country: "SN" }, 1), 5);
  take(await pages({ with_origin_country: "CI" }, 1), 4);

  // 2. Hand-picked titles (e.g. the seed's reviewed films) by title + year.
  for (const film of opts.curated ?? []) {
    const { results } = await tmdb.search(film.title, film.year);
    const match =
      results.find((r) => r.poster_path && r.title.toLowerCase() === film.title.toLowerCase()) ?? results.find((r) => r.poster_path);
    if (match) take([match], 1, { curated: film });
    else log(`  · no TMDB match for "${film.title}" (${film.year})`);
  }

  // 3. What's in Nigerian cinemas right now.
  take((await tmdb.nowPlaying(REGION)).results, 40, { nowPlaying: true });

  log(`Fetching details for ${candidates.size} films from TMDB …`);
  const ids = [...candidates.keys()];
  const details = await mapLimit(ids, 6, (id) => tmdb.movie(id).catch(() => null));

  // Reset now-playing; this import's list is the source of truth.
  await db.update(schema.films).set({ nowPlaying: false }).where(isNotNull(schema.films.tmdbId));

  const imported: ImportedFilm[] = [];
  let skipped = 0;

  for (const [i, detail] of details.entries()) {
    const hint = candidates.get(ids[i]!)!;
    if (!detail || detail.adult || !detail.poster_path || !detail.release_date) {
      skipped++;
      continue;
    }
    const industry = hint.curated?.industry ?? industryFor(detail);
    if (!industry) {
      skipped++; // e.g. a Hollywood title on the Nigerian now-playing list
      continue;
    }

    const year = Number(detail.release_date.slice(0, 4));
    const title = hint.curated?.title ?? detail.title;
    const ngProviders = detail["watch/providers"]?.results[REGION];
    const byPriority = <T extends { display_priority: number }>(list?: T[]) =>
      [...(list ?? [])].sort((a, b) => a.display_priority - b.display_priority);
    const streams = byPriority(ngProviders?.flatrate);
    const directors = detail.credits.crew.filter((c) => c.job === "Director").map((c) => c.name);

    const values = {
      title,
      year,
      runtimeMinutes: detail.runtime || null,
      synopsis: (detail.overview ?? "").slice(0, 600),
      director: directors.slice(0, 2).join(" & ") || null,
      cast: [...detail.credits.cast].sort((a, b) => a.order - b.order).slice(0, 6).map((c) => c.name),
      industry,
      language: LANGUAGE_NAMES[detail.original_language] ??
        detail.spoken_languages.find((l) => l.iso_639_1 === detail.original_language)?.english_name ??
        "English",
      platform: streams[0]?.provider_name ?? null,
      tmdbId: detail.id,
      tmdbPosterPath: detail.poster_path,
      tmdbBackdropPath: detail.backdrop_path,
      tmdbRating: detail.vote_count ? detail.vote_average : null,
      tmdbVotes: detail.vote_count,
      releaseDate: detail.release_date,
      nowPlaying: Boolean(hint.nowPlaying),
      watchLink: ngProviders?.link ?? null,
      ...(hint.curated?.badge !== undefined ? { badge: hint.curated.badge } : {}),
      ...(hint.curated?.boxOfficeRank !== undefined ? { boxOfficeRank: hint.curated.boxOfficeRank } : {}),
    };

    // Match an existing row: same TMDB id, else the same slug (title + year).
    const baseSlug = slugify(`${title}-${year}`) || `film-${detail.id}`;
    const [existing] = await db
      .select({ id: schema.films.id, slug: schema.films.slug })
      .from(schema.films)
      .where(sql`${schema.films.tmdbId} = ${detail.id} or ${schema.films.slug} = ${baseSlug}`)
      .limit(1);

    let filmId: string;
    let slug: string;
    if (existing) {
      await db.update(schema.films).set(values).where(eq(schema.films.id, existing.id));
      filmId = existing.id;
      slug = existing.slug;
    } else {
      slug = baseSlug;
      for (let n = 2; (await db.select({ id: schema.films.id }).from(schema.films).where(eq(schema.films.slug, slug))).length; n++) {
        slug = `${baseSlug}-${n}`;
      }
      const [row] = await db
        .insert(schema.films)
        .values({
          ...values,
          slug,
          posterGradient: pickByKey(POSTER_GRADIENTS, slug),
          status: "published",
          publishedAt: new Date(),
        })
        .returning({ id: schema.films.id });
      filmId = row!.id;
    }

    const genres = mapGenres(detail.genres.map((g) => g.name));
    await db.delete(schema.filmGenres).where(eq(schema.filmGenres.filmId, filmId));
    if (genres.length) await db.insert(schema.filmGenres).values(genres.map((genre) => ({ filmId, genre })));

    await db.delete(schema.filmProviders).where(eq(schema.filmProviders.filmId, filmId));
    const providerRows = (
      [
        ["stream", streams],
        ["rent", byPriority(ngProviders?.rent)],
        ["buy", byPriority(ngProviders?.buy)],
      ] as const
    ).flatMap(([kind, list]) =>
      list.map((p) => ({
        filmId,
        kind,
        providerId: p.provider_id,
        name: p.provider_name,
        logoPath: p.logo_path,
        priority: p.display_priority,
      })),
    );
    if (providerRows.length) await db.insert(schema.filmProviders).values(providerRows).onConflictDoNothing();

    imported.push({ id: filmId, slug, title, tmdbRating: values.tmdbRating, tmdbVotes: detail.vote_count });
  }

  const nowPlaying = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.films)
    .where(and(eq(schema.films.nowPlaying, true), isNotNull(schema.films.tmdbId)));
  log(`Imported ${imported.length} films (${skipped} skipped, ${nowPlaying[0]?.n ?? 0} in Nigerian cinemas now).`);
  return imported;
}
