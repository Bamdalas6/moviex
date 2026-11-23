import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull, like, or, sql, type SQL } from "drizzle-orm";
import type { Genre, Industry, Language } from "@/lib/constants";
import type { FilmDetail, FilmSummary } from "@/lib/types";
import { db } from "@/server/db/client";
import { cinemas, filmGenres, filmPeople, filmProviders, films, people, ratings, users, watchlist, type Film } from "@/server/db/schema";
import { resolvePoster } from "@/server/storage";
import { tmdbImage } from "@/server/tmdb/client";

const DAY = 24 * 60 * 60 * 1000;

/** Per-film aggregates, joined onto film rows. */
const stats = db
  .select({
    filmId: ratings.filmId,
    avg: sql<number>`avg(${ratings.score})`.as("avg"),
    total: sql<number>`count(*)`.as("total"),
    reviews: sql<number>`sum(case when coalesce(${ratings.body}, '') <> '' then 1 else 0 end)`.as("reviews"),
    recent: sql<number>`sum(case when ${ratings.createdAt} > ${sql.raw(
      "(unixepoch() * 1000) - " + 30 * DAY,
    )} then 1 else 0 end)`.as("recent"),
  })
  .from(ratings)
  .groupBy(ratings.filmId)
  .as("stats");

const summaryColumns = {
  film: films,
  avg: stats.avg,
  total: stats.total,
  reviews: stats.reviews,
  // Genres come back in the same query (one round trip instead of two per list).
  genreList: sql<string | null>`(select group_concat(${filmGenres.genre}, '|') from ${filmGenres} where ${filmGenres.filmId} = ${films.id})`,
};

type SummaryRow = { film: Film; avg: number | null; total: number | null; reviews: number | null; genreList: string | null };

/**
 * Tiny per-instance cache for public, viewer-independent lists. Each page used to
 * make several round trips to the database for the same lists on every click;
 * now repeat requests within the TTL are served from memory. Viewer-specific data
 * (sessions, "your rating", watchlist hearts) is never cached here.
 */
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? 60_000 : 0;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

export function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!CACHE_TTL_MS) return load();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key)); // never cache failures
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}

function toSummary(row: SummaryRow): FilmSummary {
  const f = row.film;
  return {
    id: f.id,
    slug: f.slug,
    title: f.title,
    year: f.year,
    genres: (row.genreList ?? "").split("|").filter(Boolean).sort(),
    director: f.director,
    industry: f.industry,
    language: f.language,
    platform: f.platform,
    badge: f.badge,
    runtimeMinutes: f.runtimeMinutes,
    synopsis: f.synopsis,
    nowPlaying: f.nowPlaying,
    trailerKey: f.trailerKey,
    trailerName: f.trailerName,
    posterUrl: resolvePoster(f.posterKey, f.tmdbPosterPath),
    posterGradient: f.posterGradient,
    posterSpoiler: f.posterSpoiler,
    avgRating: row.avg === null ? null : Math.round(Number(row.avg) * 10) / 10,
    ratingCount: Number(row.total ?? 0),
    reviewCount: Number(row.reviews ?? 0),
  };
}

async function hydrate(rows: SummaryRow[]) {
  return rows.map(toSummary);
}

export type FilmSort = "trending" | "top" | "recent" | "box-office";

export type FilmQuery = {
  q?: string;
  genre?: Genre;
  industry?: Industry;
  language?: Language;
  director?: string;
  streaming?: boolean;
  nowPlaying?: boolean;
  withTrailer?: boolean;
  sort?: FilmSort;
  limit?: number;
  /** Rows to skip, for "load more" paging. */
  offset?: number;
};

export function listFilms(query: FilmQuery = {}): Promise<FilmSummary[]> {
  return cached(`films:${JSON.stringify(query)}`, () => loadFilms(query));
}

/** How many published films match a query (for "Swipe through 243 matches" and paging). */
export function countFilms(query: FilmQuery = {}): Promise<number> {
  // Paging and order don't change the count, so they stay out of the cache key.
  const filter = { ...query, limit: undefined, offset: undefined, sort: undefined };
  return cached(`films:count:${JSON.stringify(filter)}`, async () => {
    const [row] = await db
      .select({ n: sql<number>`count(*)` })
      .from(films)
      .where(and(...filmFilters(filter)));
    return Number(row?.n ?? 0);
  });
}

function filmFilters(query: FilmQuery): SQL[] {
  const where: SQL[] = [eq(films.status, "published")];

  if (query.q) {
    // Drop LIKE wildcards from user input rather than escaping them (SQLite needs an ESCAPE clause otherwise).
    const term = `%${query.q.replace(/[%_\\]/g, "")}%`;
    where.push(
      or(
        like(films.title, term),
        like(films.director, term),
        // cast is a JSON array; a LIKE over its text is a cheap, adequate actor search
        sql`${films.cast} like ${term}`,
        // ...and anyone credited further down the bill (up to 12 cast plus directors per film)
        inArray(
          films.id,
          db
            .select({ id: filmPeople.filmId })
            .from(filmPeople)
            .innerJoin(people, eq(people.id, filmPeople.personId))
            .where(like(people.name, term)),
        ),
      )!,
    );
  }
  if (query.genre) {
    where.push(
      inArray(films.id, db.select({ id: filmGenres.filmId }).from(filmGenres).where(eq(filmGenres.genre, query.genre))),
    );
  }
  if (query.industry) where.push(eq(films.industry, query.industry));
  if (query.language) where.push(eq(films.language, query.language));
  if (query.director) where.push(eq(films.director, query.director));
  if (query.streaming) where.push(isNotNull(films.platform));
  if (query.nowPlaying) where.push(eq(films.nowPlaying, true));
  if (query.withTrailer) where.push(isNotNull(films.trailerKey));
  if (query.sort === "box-office") where.push(isNotNull(films.boxOfficeRank));
  return where;
}

async function loadFilms(query: FilmQuery): Promise<FilmSummary[]> {
  const where = filmFilters(query);
  const order = {
    trending: [desc(sql`coalesce(${stats.recent}, 0)`), desc(sql`coalesce(${stats.avg}, 0)`)],
    top: [desc(sql`coalesce(${stats.avg}, 0)`), desc(sql`coalesce(${stats.total}, 0)`)],
    recent: [desc(films.year), desc(films.publishedAt)],
    "box-office": [asc(films.boxOfficeRank)],
  }[query.sort ?? "trending"];

  const rows = await db
    .select(summaryColumns)
    .from(films)
    .leftJoin(stats, eq(stats.filmId, films.id))
    .where(and(...where))
    // Stable tie-break so paging never repeats or skips a film.
    .orderBy(...order, asc(films.id))
    .limit(query.limit ?? 24)
    .offset(query.offset ?? 0);

  return hydrate(rows);
}

export async function getFilmDetail(slug: string, viewerId?: string): Promise<FilmDetail | null> {
  const [row] = await db
    .select({ ...summaryColumns, uploader: { username: users.username, name: users.name, avatarColor: users.avatarColor } })
    .from(films)
    .leftJoin(stats, eq(stats.filmId, films.id))
    .leftJoin(users, eq(users.id, films.uploadedById))
    .where(eq(films.slug, slug))
    .limit(1);

  if (!row) return null;
  const f = row.film;
  // Unpublished films are visible only to their uploader (and admins, via moderation).
  if (f.status !== "published" && f.uploadedById !== viewerId) return null;

  const [summary] = await hydrate([row]);

  // Independent lookups run in parallel — one round trip to the database instead of four.
  const [distRows, mine, saved, providerRows] = await Promise.all([
    db.select({ score: ratings.score, n: count() }).from(ratings).where(eq(ratings.filmId, f.id)).groupBy(ratings.score),
    viewerId
      ? db
          .select({ score: ratings.score, body: ratings.body })
          .from(ratings)
          .where(and(eq(ratings.filmId, f.id), eq(ratings.userId, viewerId)))
          .limit(1)
      : Promise.resolve([]),
    viewerId
      ? db
          .select({ filmId: watchlist.filmId })
          .from(watchlist)
          .where(and(eq(watchlist.filmId, f.id), eq(watchlist.userId, viewerId)))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ kind: filmProviders.kind, name: filmProviders.name, logoPath: filmProviders.logoPath })
      .from(filmProviders)
      .where(eq(filmProviders.filmId, f.id))
      .orderBy(asc(filmProviders.priority)),
  ]);

  const total = distRows.reduce((sum, r) => sum + r.n, 0);
  const distribution = [5, 4, 3, 2, 1].map((score) => {
    const n = distRows.find((r) => r.score === score)?.n ?? 0;
    return { score, count: n, percent: total ? Math.round((n / total) * 100) : 0 };
  });

  const viewer: FilmDetail["viewer"] = viewerId
    ? { score: mine[0]?.score ?? null, hasReview: Boolean(mine[0]?.body), saved: Boolean(saved[0]) }
    : null;

  return {
    ...summary!,
    watchLink: f.watchLink,
    trailer: f.trailerKey ? { type: f.trailerType, official: f.trailerOfficial, publishedAt: f.trailerPublishedAt } : null,
    providers: providerRows.map((p) => ({ kind: p.kind, name: p.name, logoUrl: tmdbImage(p.logoPath, "w92") })),
    cast: f.cast,
    status: f.status,
    allowReviews: f.allowReviews,
    createdAt: f.createdAt,
    uploader: row.uploader?.username ? row.uploader : null,
    distribution,
    viewer,
  };
}

/** Lightweight lookup used by the review form. */
export async function getFilmForReview(slug: string) {
  const [film] = await db
    .select({
      id: films.id,
      slug: films.slug,
      title: films.title,
      year: films.year,
      director: films.director,
      posterKey: films.posterKey,
      tmdbPosterPath: films.tmdbPosterPath,
      posterGradient: films.posterGradient,
      posterSpoiler: films.posterSpoiler,
      allowReviews: films.allowReviews,
      status: films.status,
      genreList: summaryColumns.genreList,
    })
    .from(films)
    .where(eq(films.slug, slug))
    .limit(1);
  if (!film || film.status !== "published") return null;
  const { genreList, ...rest } = film;
  return {
    ...rest,
    posterUrl: resolvePoster(film.posterKey, film.tmdbPosterPath),
    genres: (genreList ?? "").split("|").filter(Boolean).sort(),
  };
}

export function genreCounts() {
  return cached("genre-counts", async () => {
    const rows = await db
      .select({ genre: filmGenres.genre, n: count() })
      .from(filmGenres)
      .innerJoin(films, eq(films.id, filmGenres.filmId))
      .where(eq(films.status, "published"))
      .groupBy(filmGenres.genre);
    return new Map(rows.map((r) => [r.genre, r.n]));
  });
}

/** Directors with the most films, each with their best-rated title — computed from one cached list. */
export async function topDirectors(limit = 8) {
  const all = await listFilms({ sort: "top", limit: 1000 });
  const byDirector = new Map<string, { films: number; best: FilmSummary }>();
  for (const film of all) {
    if (!film.director) continue;
    const entry = byDirector.get(film.director);
    if (entry) entry.films += 1;
    else byDirector.set(film.director, { films: 1, best: film }); // list is best-first
  }
  return [...byDirector.entries()]
    .sort((a, b) => b[1].films - a[1].films || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, d]) => ({ name, films: d.films, knownFor: d.best.title, color: d.best.posterGradient }));
}

export function ratingActivity() {
  return cached("rating-activity", loadRatingActivity);
}

async function loadRatingActivity() {
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({
      week: sql<number>`sum(case when ${ratings.createdAt} > ${now - 7 * DAY} then 1 else 0 end)`,
      today: sql<number>`sum(case when ${ratings.createdAt} > ${startOfDay.getTime()} then 1 else 0 end)`,
      allTime: count(),
    })
    .from(ratings);
  return { week: Number(row?.week ?? 0), today: Number(row?.today ?? 0), allTime: Number(row?.allTime ?? 0) };
}

/** Every cinema branch, ordered for display (chain, then city). */
export function listCinemas() {
  return cached("cinemas", () =>
    db.select().from(cinemas).orderBy(asc(cinemas.chain), asc(cinemas.city), asc(cinemas.branch)),
  );
}

/** Film ids on the viewer's watchlist, for the heart buttons on cards. */
export async function savedFilmIds(userId: string | undefined): Promise<string[]> {
  if (!userId) return [];
  const rows = await db.select({ filmId: watchlist.filmId }).from(watchlist).where(eq(watchlist.userId, userId));
  return rows.map((r) => r.filmId);
}

export async function slugExists(slug: string) {
  const [row] = await db.select({ id: films.id }).from(films).where(eq(films.slug, slug)).limit(1);
  return Boolean(row);
}

export async function pendingFilms() {
  const rows = await db
    .select({ ...summaryColumns, uploader: { username: users.username, name: users.name } })
    .from(films)
    .leftJoin(stats, eq(stats.filmId, films.id))
    .leftJoin(users, eq(users.id, films.uploadedById))
    .where(eq(films.status, "pending"))
    .orderBy(asc(films.createdAt));
  const summaries = await hydrate(rows);
  return summaries.map((s, i) => ({
    ...s,
    createdAt: rows[i]!.film.createdAt,
    uploader: rows[i]!.uploader,
  }));
}

export async function filmsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await db
    .select(summaryColumns)
    .from(films)
    .leftJoin(stats, eq(stats.filmId, films.id))
    .where(inArray(films.id, ids));
  const summaries = await hydrate(rows);
  const byId = new Map(summaries.map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter((f): f is FilmSummary => Boolean(f));
}

export async function filmsUploadedBy(userId: string, includeUnpublished: boolean) {
  const rows = await db
    .select(summaryColumns)
    .from(films)
    .leftJoin(stats, eq(stats.filmId, films.id))
    .where(
      includeUnpublished
        ? eq(films.uploadedById, userId)
        : and(eq(films.uploadedById, userId), eq(films.status, "published")),
    )
    .orderBy(desc(films.createdAt));
  const summaries = await hydrate(rows);
  return summaries.map((s, i) => ({ ...s, status: rows[i]!.film.status }));
}
