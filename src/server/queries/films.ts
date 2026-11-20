import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull, like, or, sql, type SQL } from "drizzle-orm";
import type { Genre, Industry, Language } from "@/lib/constants";
import type { FilmDetail, FilmSummary } from "@/lib/types";
import { db } from "@/server/db/client";
import { cinemas, filmGenres, filmProviders, films, ratings, users, watchlist, type Film } from "@/server/db/schema";
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
};

type SummaryRow = { film: Film; avg: number | null; total: number | null; reviews: number | null };

async function genresFor(filmIds: string[]) {
  const map = new Map<string, string[]>();
  if (!filmIds.length) return map;
  const rows = await db
    .select()
    .from(filmGenres)
    .where(inArray(filmGenres.filmId, filmIds))
    .orderBy(asc(filmGenres.genre));
  for (const row of rows) map.set(row.filmId, [...(map.get(row.filmId) ?? []), row.genre]);
  return map;
}

function toSummary(row: SummaryRow, genres: string[]): FilmSummary {
  const f = row.film;
  return {
    id: f.id,
    slug: f.slug,
    title: f.title,
    year: f.year,
    genres,
    director: f.director,
    industry: f.industry,
    language: f.language,
    platform: f.platform,
    badge: f.badge,
    runtimeMinutes: f.runtimeMinutes,
    synopsis: f.synopsis,
    nowPlaying: f.nowPlaying,
    posterUrl: resolvePoster(f.posterKey, f.tmdbPosterPath),
    posterGradient: f.posterGradient,
    posterSpoiler: f.posterSpoiler,
    avgRating: row.avg === null ? null : Math.round(Number(row.avg) * 10) / 10,
    ratingCount: Number(row.total ?? 0),
    reviewCount: Number(row.reviews ?? 0),
  };
}

async function hydrate(rows: SummaryRow[]) {
  const genres = await genresFor(rows.map((r) => r.film.id));
  return rows.map((r) => toSummary(r, genres.get(r.film.id) ?? []));
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
  sort?: FilmSort;
  limit?: number;
};

export async function listFilms(query: FilmQuery = {}): Promise<FilmSummary[]> {
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
  if (query.sort === "box-office") where.push(isNotNull(films.boxOfficeRank));

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
    .orderBy(...order)
    .limit(query.limit ?? 24);

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

  const distRows = await db
    .select({ score: ratings.score, n: count() })
    .from(ratings)
    .where(eq(ratings.filmId, f.id))
    .groupBy(ratings.score);

  const total = distRows.reduce((sum, r) => sum + r.n, 0);
  const distribution = [5, 4, 3, 2, 1].map((score) => {
    const n = distRows.find((r) => r.score === score)?.n ?? 0;
    return { score, count: n, percent: total ? Math.round((n / total) * 100) : 0 };
  });

  let viewer: FilmDetail["viewer"] = null;
  if (viewerId) {
    const [mine] = await db
      .select({ score: ratings.score, body: ratings.body })
      .from(ratings)
      .where(and(eq(ratings.filmId, f.id), eq(ratings.userId, viewerId)))
      .limit(1);
    const [saved] = await db
      .select({ filmId: watchlist.filmId })
      .from(watchlist)
      .where(and(eq(watchlist.filmId, f.id), eq(watchlist.userId, viewerId)))
      .limit(1);
    viewer = { score: mine?.score ?? null, hasReview: Boolean(mine?.body), saved: Boolean(saved) };
  }

  const providerRows = await db
    .select({ kind: filmProviders.kind, name: filmProviders.name, logoPath: filmProviders.logoPath })
    .from(filmProviders)
    .where(eq(filmProviders.filmId, f.id))
    .orderBy(asc(filmProviders.priority));

  return {
    ...summary!,
    watchLink: f.watchLink,
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
    })
    .from(films)
    .where(eq(films.slug, slug))
    .limit(1);
  if (!film || film.status !== "published") return null;
  const genres = await genresFor([film.id]);
  return { ...film, posterUrl: resolvePoster(film.posterKey, film.tmdbPosterPath), genres: genres.get(film.id) ?? [] };
}

export async function genreCounts() {
  const rows = await db
    .select({ genre: filmGenres.genre, n: count() })
    .from(filmGenres)
    .innerJoin(films, eq(films.id, filmGenres.filmId))
    .where(eq(films.status, "published"))
    .groupBy(filmGenres.genre);
  return new Map(rows.map((r) => [r.genre, r.n]));
}

export async function topDirectors(limit = 8) {
  const rows = await db
    .select({ director: films.director, n: count() })
    .from(films)
    .where(and(eq(films.status, "published"), isNotNull(films.director)))
    .groupBy(films.director)
    .orderBy(desc(count()), asc(films.director))
    .limit(limit);

  const knownFor = await Promise.all(
    rows.map(async (r) => {
      const [best] = await listFilms({ director: r.director!, sort: "top", limit: 1 });
      return { name: r.director!, films: r.n, knownFor: best?.title ?? null, color: best?.posterGradient ?? null };
    }),
  );
  return knownFor;
}

export async function ratingActivity() {
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
export async function listCinemas() {
  return db.select().from(cinemas).orderBy(asc(cinemas.chain), asc(cinemas.city), asc(cinemas.branch));
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
