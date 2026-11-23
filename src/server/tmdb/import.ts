import { eq, isNotNull, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { GENRES, MAX_GENRES_PER_FILM, POSTER_GRADIENTS } from "../../lib/constants";
import { pickByKey, slugify } from "../../lib/utils";
import * as schema from "../db/schema";
import { fetchYouTubeDetails } from "../youtube-oembed";
import { runBatched, type Statement } from "./batch";
import {
  mapLimit,
  pickTrailer,
  TmdbClient,
  type TmdbCastCredit,
  type TmdbCrewCredit,
  type TmdbListMovie,
  type TmdbMovieDetail,
  type TmdbPerson,
} from "./client";
import { importPeople, type Credit, type LightPerson } from "./people";

/**
 * Imports Nollywood and wider African cinema from TMDB: every Nigerian film
 * TMDB lists (with a poster), a selection from Ghana, Kenya, South Africa and
 * francophone Africa, posters, cast/crew, genres, trailers, streaming in
 * Nigeria and the "now playing in Nigerian cinemas" list. Then it builds the
 * Nollywood collection: the most-credited actors and actresses with full
 * profiles and complete filmographies.
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

/** Billed cast stored per film (the cast strip on film pages and everyone's filmography). */
const CAST_PER_FILM = 12;

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
  opts: {
    apiKey: string;
    curated?: CuratedFilm[];
    log?: (message: string) => void;
    /** How many actors and actresses make the Nollywood collection. */
    collectionSize?: number;
    /** Cap on Nigerian discover pages (20 films each); the default takes them all. */
    nigerianPages?: number;
  },
): Promise<ImportedFilm[]> {
  const log = opts.log ?? (() => undefined);
  const tmdb = new TmdbClient(opts.apiKey);
  const collectionSize = opts.collectionSize ?? 500;
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

  const pages = async (params: Record<string, string | number>, count: number) => {
    const out: TmdbListMovie[] = [];
    for (let page = 1; page <= count; page++) {
      const res = await tmdb.discover({ sort_by: "vote_count.desc", page, ...params });
      out.push(...res.results);
      if (page >= res.total_pages) break;
    }
    return out;
  };

  // 1. Every Nigerian film TMDB knows, most popular first.
  take(await pages({ with_origin_country: "NG", sort_by: "popularity.desc" }, opts.nigerianPages ?? 500), 100_000);
  take(await pages({ with_origin_country: "GH" }, 2), 30);
  take(await pages({ with_origin_country: "KE", with_original_language: "en|sw" }, 1), 12);
  take(await pages({ with_origin_country: "ZA", with_original_language: "zu|xh|af|st|tn" }, 1), 12);
  take(await pages({ with_origin_country: "SN" }, 1), 5);
  take(await pages({ with_origin_country: "CI" }, 1), 4);

  // 2. Hand-picked titles by title + year.
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
  const details = new Map<number, TmdbMovieDetail>();
  const fetchDetails = async (ids: number[]) => {
    const got = await mapLimit(ids, 8, (id) => tmdb.movie(id).catch(() => null));
    for (const d of got) {
      if (d && !d.adult && d.poster_path && d.release_date && (industryFor(d) || candidates.get(d.id)?.curated)) details.set(d.id, d);
    }
  };
  await fetchDetails([...candidates.keys()]);

  // 4. The Nollywood collection: actors and actresses with the most Nigerian films, plus prolific directors.
  const isNollywood = (d: TmdbMovieDetail) => {
    const industry = candidates.get(d.id)?.curated?.industry ?? industryFor(d);
    return industry === "Nollywood" || industry === "Kannywood";
  };
  const tally = (role: "cast" | "director") => {
    const counts = new Map<number, { n: number; popularity: number }>();
    for (const d of details.values()) {
      if (!isNollywood(d)) continue;
      const credited = role === "cast" ? d.credits.cast.slice(0, CAST_PER_FILM) : d.credits.crew.filter((c) => c.job === "Director");
      for (const p of new Map(credited.map((c) => [c.id, c])).values()) {
        const t = counts.get(p.id) ?? { n: 0, popularity: p.popularity ?? 0 };
        t.n++;
        counts.set(p.id, t);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n || b[1].popularity - a[1].popularity);
  };
  const actorIds = tally("cast")
    .slice(0, Math.round(collectionSize * 1.15)) // headroom: a few credited cast turn out to be crew
    .map(([id]) => id);
  const directorIds = tally("director")
    .filter(([, t]) => t.n >= 2)
    .slice(0, 120)
    .map(([id]) => id);

  const profileIds = [...new Set([...actorIds, ...directorIds])];
  log(`Fetching ${profileIds.length} profiles with full filmographies …`);
  const profiles = new Map(
    (await mapLimit(profileIds, 8, (id) => tmdb.person(id).catch(() => null)))
      .filter((p): p is TmdbPerson => Boolean(p))
      .map((p) => [p.id, p]),
  );

  // 5. Complete their filmographies: any African film of theirs we don't have yet.
  const missing = new Set<number>();
  for (const p of profiles.values()) {
    const entries = [...(p.movie_credits?.cast ?? []), ...(p.movie_credits?.crew ?? []).filter((c) => c.job === "Director")];
    for (const e of entries) if (e.poster_path && e.release_date && !details.has(e.id) && !candidates.has(e.id)) missing.add(e.id);
  }
  const before = details.size;
  await fetchDetails([...missing]);
  log(`Filmographies: checked ${missing.size} more films, added ${details.size - before} African ones.`);

  // Which YouTube channel posted each trailer (names the studio/producer channel).
  const trailerOf = (d: TmdbMovieDetail) => pickTrailer(d.videos?.results);
  const channelByKey = new Map(
    await mapLimit([...details.values()], 8, async (d) => {
      const key = trailerOf(d)?.key;
      return [key ?? "", key ? await fetchYouTubeDetails(key, 8000) : null] as const;
    }),
  );

  // 6. Write films: one read of what exists, then batched writes (one round trip per ~100 statements).
  const existingFilms = await db.select({ id: schema.films.id, slug: schema.films.slug, tmdbId: schema.films.tmdbId }).from(schema.films);
  const byTmdb = new Map(existingFilms.filter((f) => f.tmdbId !== null).map((f) => [f.tmdbId!, f]));
  const bySlug = new Map(existingFilms.map((f) => [f.slug, f]));

  const statements: Statement[] = [db.update(schema.films).set({ nowPlaying: false }).where(isNotNull(schema.films.tmdbId))];
  const imported: ImportedFilm[] = [];
  const credits: Credit[] = [];
  const lightPeople = new Map<number, LightPerson>();
  const remember = (c: TmdbCastCredit | TmdbCrewCredit) => {
    if (lightPeople.has(c.id)) return;
    lightPeople.set(c.id, {
      tmdbId: c.id,
      name: c.name,
      profilePath: c.profile_path ?? null,
      knownFor: c.known_for_department ?? null,
      popularity: c.popularity ?? 0,
      gender: c.gender ?? 0,
    });
  };

  for (const detail of details.values()) {
    const hint = candidates.get(detail.id) ?? {};
    const industry = hint.curated?.industry ?? industryFor(detail) ?? "Nollywood";
    const year = Number(detail.release_date.slice(0, 4));
    const title = hint.curated?.title ?? detail.title;
    const ngProviders = detail["watch/providers"]?.results[REGION];
    const byPriority = <T extends { display_priority: number }>(list?: T[]) =>
      [...(list ?? [])].sort((a, b) => a.display_priority - b.display_priority);
    const streams = byPriority(ngProviders?.flatrate);
    const directors = detail.credits.crew.filter((c) => c.job === "Director");
    const trailer = trailerOf(detail);
    const channel = trailer ? channelByKey.get(trailer.key) : null;

    const values = {
      title,
      year,
      runtimeMinutes: detail.runtime || null,
      synopsis: (detail.overview ?? "").slice(0, 600),
      director: directors.slice(0, 2).map((d) => d.name).join(" & ") || null,
      cast: [...detail.credits.cast].sort((a, b) => a.order - b.order).slice(0, 6).map((c) => c.name),
      industry,
      language:
        LANGUAGE_NAMES[detail.original_language] ??
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
      trailerKey: trailer?.key ?? null,
      trailerName: trailer?.name ?? null,
      trailerType: trailer?.type ?? null,
      trailerOfficial: trailer ? trailer.official : null,
      trailerPublishedAt: trailer?.published_at ?? null,
      trailerChannel: channel?.channel ?? null,
      trailerChannelUrl: channel?.channelUrl ?? null,
      ...(hint.curated?.badge !== undefined ? { badge: hint.curated.badge } : {}),
      ...(hint.curated?.boxOfficeRank !== undefined ? { boxOfficeRank: hint.curated.boxOfficeRank } : {}),
    };

    // Match an existing row: same TMDB id, else the same slug (title + year) unless that's another TMDB film.
    const baseSlug = slugify(`${title}-${year}`) || `film-${detail.id}`;
    const sameSlug = bySlug.get(baseSlug);
    const existing = byTmdb.get(detail.id) ?? (sameSlug && (sameSlug.tmdbId === null || sameSlug.tmdbId === detail.id) ? sameSlug : undefined);

    let filmId: string;
    let slug: string;
    if (existing) {
      filmId = existing.id;
      slug = existing.slug;
      statements.push(db.update(schema.films).set(values).where(eq(schema.films.id, filmId)));
    } else {
      slug = baseSlug;
      for (let n = 2; bySlug.has(slug); n++) slug = `${baseSlug}-${n}`;
      filmId = crypto.randomUUID();
      statements.push(
        db.insert(schema.films).values({
          ...values,
          id: filmId,
          slug,
          posterGradient: pickByKey(POSTER_GRADIENTS, slug),
          status: "published",
          publishedAt: new Date(),
        }),
      );
    }
    const row = { id: filmId, slug, tmdbId: detail.id };
    bySlug.set(slug, row);
    byTmdb.set(detail.id, row);

    const genres = mapGenres(detail.genres.map((g) => g.name));
    statements.push(db.delete(schema.filmGenres).where(eq(schema.filmGenres.filmId, filmId)));
    if (genres.length) statements.push(db.insert(schema.filmGenres).values(genres.map((genre) => ({ filmId, genre }))));

    statements.push(db.delete(schema.filmProviders).where(eq(schema.filmProviders.filmId, filmId)));
    const providerRows = (
      [
        ["stream", streams],
        ["rent", byPriority(ngProviders?.rent)],
        ["buy", byPriority(ngProviders?.buy)],
      ] as const
    ).flatMap(([kind, list]) =>
      list.map((p) => ({ filmId, kind, providerId: p.provider_id, name: p.provider_name, logoPath: p.logo_path, priority: p.display_priority })),
    );
    if (providerRows.length) statements.push(db.insert(schema.filmProviders).values(providerRows).onConflictDoNothing());

    const cast = [...detail.credits.cast].sort((a, b) => a.order - b.order).slice(0, CAST_PER_FILM);
    const seen = new Set<number>();
    cast.forEach((c, position) => {
      if (seen.has(c.id)) return; // the same actor billed twice (two roles)
      seen.add(c.id);
      remember(c);
      credits.push({ filmId, tmdbPersonId: c.id, role: "cast", character: c.character?.trim() || null, position });
    });
    [...new Map(directors.map((d) => [d.id, d])).values()].slice(0, 2).forEach((c, position) => {
      remember(c);
      credits.push({ filmId, tmdbPersonId: c.id, role: "director", character: null, position });
    });

    imported.push({ id: filmId, slug, title, tmdbRating: values.tmdbRating, tmdbVotes: detail.vote_count });
  }

  await runBatched(db, statements);
  const [counts] = await db
    .select({
      total: sql<number>`count(*)`,
      nowPlaying: sql<number>`sum(case when ${schema.films.nowPlaying} then 1 else 0 end)`,
    })
    .from(schema.films)
    .where(eq(schema.films.status, "published"));
  log(`Imported ${imported.length} films (${counts?.nowPlaying ?? 0} in Nigerian cinemas now, ${counts?.total ?? 0} published in total).`);

  // Channels that posted our trailers join the YouTube directory (hand-checked entries keep their details).
  const trailerChannels = new Map<string, string>();
  for (const v of channelByKey.values()) if (v?.channel && v.channelUrl) trailerChannels.set(v.channelUrl, v.channel);
  const known = await db.select({ url: schema.channels.url, slug: schema.channels.slug }).from(schema.channels);
  const urls = new Set(known.map((c) => c.url));
  const slugs = new Set(known.map((c) => c.slug));
  const channelInserts: Statement[] = [];
  for (const [url, name] of trailerChannels) {
    if (urls.has(url)) continue;
    const base = slugify(name) || "channel";
    let slug = base;
    for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
    slugs.add(slug);
    channelInserts.push(db.insert(schema.channels).values({ url, name, slug, kind: "trailers" }).onConflictDoNothing());
  }
  await runBatched(db, channelInserts);
  log(`YouTube: ${trailerChannels.size} trailer channels.`);

  // 7. People: everyone credited gets a page; the collection gets full profiles and a rank.
  const nollywoodFilms = new Set([...details.values()].filter(isNollywood).map((d) => byTmdb.get(d.id)!.id));
  const filmsPerPerson = new Map<number, number>();
  for (const c of credits) {
    if (c.role === "cast" && nollywoodFilms.has(c.filmId)) filmsPerPerson.set(c.tmdbPersonId, (filmsPerPerson.get(c.tmdbPersonId) ?? 0) + 1);
  }
  const ranked = actorIds
    .filter((id) => profiles.get(id)?.known_for_department === "Acting")
    .sort(
      (a, b) =>
        (filmsPerPerson.get(b) ?? 0) - (filmsPerPerson.get(a) ?? 0) || (profiles.get(b)!.popularity ?? 0) - (profiles.get(a)!.popularity ?? 0),
    )
    .slice(0, collectionSize);
  const rankOf = new Map(ranked.map((id, i) => [id, i + 1]));
  const featured = [...new Set([...ranked, ...directorIds])].map((id) => profiles.get(id)).filter((p): p is TmdbPerson => Boolean(p));

  await importPeople(db, { credits, lightPeople, featured, rankOf, log });
  return imported;
}
