import "server-only";

import { and, desc, eq, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import type { ReviewItem } from "@/lib/types";
import { db } from "@/server/db/client";
import { filmGenres, films, follows, helpfulVotes, ratings, reviewReports, users } from "@/server/db/schema";
import { resolvePoster } from "@/server/storage";

const helpful = db
  .select({ ratingId: helpfulVotes.ratingId, n: sql<number>`count(*)`.as("n") })
  .from(helpfulVotes)
  .groupBy(helpfulVotes.ratingId)
  .as("helpful");

const hasBody = sql`coalesce(${ratings.body}, '') <> ''`;

/** Viewer-relative flags as correlated EXISTS sub-selects; constant false when signed out. */
function viewerFlags(viewerId: string | undefined) {
  if (!viewerId) {
    return {
      viewerVoted: sql<number>`0`,
      viewerReported: sql<number>`0`,
      viewerFollows: sql<number>`0`,
    };
  }
  return {
    viewerVoted: sql<number>`exists(select 1 from ${helpfulVotes} where ${helpfulVotes.ratingId} = ${ratings.id} and ${helpfulVotes.userId} = ${viewerId})`,
    viewerReported: sql<number>`exists(select 1 from ${reviewReports} where ${reviewReports.ratingId} = ${ratings.id} and ${reviewReports.userId} = ${viewerId})`,
    viewerFollows: sql<number>`exists(select 1 from ${follows} where ${follows.followingId} = ${ratings.userId} and ${follows.followerId} = ${viewerId})`,
  };
}

function reviewSelect(viewerId: string | undefined) {
  return {
    id: ratings.id,
    score: ratings.score,
    headline: ratings.headline,
    body: ratings.body,
    spoiler: ratings.spoiler,
    createdAt: ratings.createdAt,
    helpfulCount: sql<number>`coalesce(${helpful.n}, 0)`,
    ...viewerFlags(viewerId),
    author: { id: users.id, name: users.name, username: users.username, avatarColor: users.avatarColor },
    film: {
      id: films.id,
      slug: films.slug,
      title: films.title,
      year: films.year,
      posterKey: films.posterKey,
      tmdbPosterPath: films.tmdbPosterPath,
      posterGradient: films.posterGradient,
      posterSpoiler: films.posterSpoiler,
      genre: sql<string | null>`(select min(${filmGenres.genre}) from ${filmGenres} where ${filmGenres.filmId} = ${films.id})`,
    },
  };
}

type ReviewRow = Awaited<ReturnType<typeof baseQuery>>[number];

function baseQuery(viewerId: string | undefined, where: SQL | undefined) {
  return db
    .select(reviewSelect(viewerId))
    .from(ratings)
    .innerJoin(users, eq(users.id, ratings.userId))
    .innerJoin(films, eq(films.id, ratings.filmId))
    .leftJoin(helpful, eq(helpful.ratingId, ratings.id))
    .where(and(hasBody, eq(films.status, "published"), where));
}

function toItem(row: ReviewRow, viewerId: string | undefined): ReviewItem {
  const { posterKey, tmdbPosterPath, ...film } = row.film;
  return {
    id: row.id,
    score: row.score,
    headline: row.headline,
    body: row.body ?? "",
    spoiler: row.spoiler,
    createdAt: row.createdAt,
    helpfulCount: Number(row.helpfulCount),
    viewerVoted: Boolean(row.viewerVoted),
    viewerReported: Boolean(row.viewerReported),
    viewerFollows: Boolean(row.viewerFollows),
    isOwn: row.author.id === viewerId,
    author: row.author,
    film: { ...film, posterUrl: resolvePoster(posterKey, tmdbPosterPath) },
  };
}

export async function filmReviews(filmId: string, viewerId: string | undefined, sort: "helpful" | "recent", limit = 20) {
  const rows = await baseQuery(viewerId, eq(ratings.filmId, filmId))
    .orderBy(
      ...(sort === "helpful"
        ? [desc(sql`coalesce(${helpful.n}, 0)`), desc(ratings.createdAt)]
        : [desc(ratings.createdAt)]),
    )
    .limit(limit);
  return rows.map((r) => toItem(r, viewerId));
}

export type FeedKind = "for-you" | "following" | "top" | "latest";
export type StarFilter = "all" | "5" | "4" | "3-";

export async function reviewFeed(opts: { viewerId?: string; feed: FeedKind; stars: StarFilter; limit?: number }) {
  const { viewerId, feed, stars } = opts;
  const where: SQL[] = [];

  if (stars === "5") where.push(eq(ratings.score, 5));
  else if (stars === "4") where.push(eq(ratings.score, 4));
  else if (stars === "3-") where.push(lte(ratings.score, 3));

  if (feed === "following") {
    if (!viewerId) return [];
    where.push(
      inArray(
        ratings.userId,
        db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
      ),
    );
  }

  // "For you": favour reviews of genres the viewer likes, then helpfulness, then recency.
  let forYouBoost: SQL | undefined;
  if (feed === "for-you" && viewerId) {
    const [me] = await db.select({ genres: users.favoriteGenres }).from(users).where(eq(users.id, viewerId));
    const liked = me?.genres ?? [];
    if (liked.length) {
      forYouBoost = sql`exists(select 1 from ${filmGenres} where ${filmGenres.filmId} = ${films.id} and ${inArray(
        filmGenres.genre,
        liked,
      )})`;
    }
  }

  const helpfulDesc = desc(sql`coalesce(${helpful.n}, 0)`);
  const order =
    feed === "top"
      ? [helpfulDesc, desc(ratings.createdAt)]
      : feed === "for-you"
        ? [...(forYouBoost ? [desc(forYouBoost)] : []), desc(sql`${ratings.createdAt} / ${86_400_000 * 3}`), helpfulDesc]
        : [desc(ratings.createdAt)];

  const rows = await baseQuery(viewerId, where.length ? and(...where) : undefined)
    .orderBy(...order)
    .limit(opts.limit ?? 30);
  return rows.map((r) => toItem(r, viewerId));
}

export async function reviewsByUser(userId: string, viewerId: string | undefined, limit = 30) {
  const rows = await baseQuery(viewerId, eq(ratings.userId, userId)).orderBy(desc(ratings.createdAt)).limit(limit);
  return rows.map((r) => toItem(r, viewerId));
}

/** Films the user scored but hasn't written about yet. */
export async function awaitingReview(userId: string, limit = 3) {
  const rows = await db
    .select({
      score: ratings.score,
      slug: films.slug,
      title: films.title,
      posterKey: films.posterKey,
      tmdbPosterPath: films.tmdbPosterPath,
      posterGradient: films.posterGradient,
      posterSpoiler: films.posterSpoiler,
    })
    .from(ratings)
    .innerJoin(films, eq(films.id, ratings.filmId))
    .where(
      and(
        eq(ratings.userId, userId),
        eq(films.status, "published"),
        eq(films.allowReviews, true),
        or(isNull(ratings.body), eq(ratings.body, "")),
      ),
    )
    .orderBy(desc(ratings.createdAt))
    .limit(limit);
  return rows.map(({ posterKey, tmdbPosterPath, ...r }) => ({ ...r, posterUrl: resolvePoster(posterKey, tmdbPosterPath) }));
}

export type MyRatingsKind = "reviews" | "ratings";
export type MyRatingsSort = "recent" | "helpful" | "score";

/**
 * Everything a user has dropped — written reviews or score-only ratings — for
 * their own dashboard. Includes unpublished films they uploaded and rated.
 */
export async function ratingsByOwner(userId: string, kind: MyRatingsKind, sort: MyRatingsSort) {
  const order =
    sort === "helpful"
      ? [desc(sql`coalesce(${helpful.n}, 0)`), desc(ratings.updatedAt)]
      : sort === "score"
        ? [desc(ratings.score), desc(ratings.updatedAt)]
        : [desc(ratings.updatedAt)];

  const rows = await db
    .select({
      id: ratings.id,
      score: ratings.score,
      headline: ratings.headline,
      body: ratings.body,
      spoiler: ratings.spoiler,
      createdAt: ratings.createdAt,
      updatedAt: ratings.updatedAt,
      helpfulCount: sql<number>`coalesce(${helpful.n}, 0)`,
      film: {
        id: films.id,
        slug: films.slug,
        title: films.title,
        year: films.year,
        posterKey: films.posterKey,
        tmdbPosterPath: films.tmdbPosterPath,
        posterGradient: films.posterGradient,
        posterSpoiler: films.posterSpoiler,
        allowReviews: films.allowReviews,
      },
    })
    .from(ratings)
    .innerJoin(films, eq(films.id, ratings.filmId))
    .leftJoin(helpful, eq(helpful.ratingId, ratings.id))
    .where(and(eq(ratings.userId, userId), kind === "reviews" ? hasBody : sql`not (${hasBody})`))
    .orderBy(...order);

  return rows.map(({ film: { posterKey, tmdbPosterPath, ...film }, ...r }) => ({
    ...r,
    helpfulCount: Number(r.helpfulCount),
    film: { ...film, posterUrl: resolvePoster(posterKey, tmdbPosterPath) },
  }));
}

export type OwnedRating = Awaited<ReturnType<typeof ratingsByOwner>>[number];

export async function reviewStats(userId: string) {
  const [row] = await db
    .select({
      reviews: sql<number>`sum(case when ${hasBody} then 1 else 0 end)`,
      ratingsOnly: sql<number>`sum(case when ${hasBody} then 0 else 1 end)`,
      average: sql<number | null>`avg(${ratings.score})`,
      helpful: sql<number>`(select count(*) from ${helpfulVotes} inner join ${ratings} r2 on r2.id = ${helpfulVotes.ratingId} where r2.user_id = ${userId})`,
    })
    .from(ratings)
    .where(eq(ratings.userId, userId));
  return {
    reviews: Number(row?.reviews ?? 0),
    ratingsOnly: Number(row?.ratingsOnly ?? 0),
    average: row?.average === null || row?.average === undefined ? null : Math.round(Number(row.average) * 10) / 10,
    helpful: Number(row?.helpful ?? 0),
  };
}

export async function getOwnRating(userId: string, filmId: string) {
  const [row] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.filmId, filmId)))
    .limit(1);
  return row ?? null;
}
