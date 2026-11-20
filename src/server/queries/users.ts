import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { films, follows, ratings, users, watchlist } from "@/server/db/schema";
import { filmsByIds } from "./films";

export async function getProfile(username: string, viewerId?: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: users.bio,
      location: users.location,
      avatarColor: users.avatarColor,
      favoriteGenres: users.favoriteGenres,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  if (!user) return null;

  const [[uploads], [reviews], [followers], [following], given, viewerFollows] = await Promise.all([
    db
      .select({ n: count() })
      .from(films)
      .where(and(eq(films.uploadedById, user.id), eq(films.status, "published"))),
    db
      .select({ n: count() })
      .from(ratings)
      .where(and(eq(ratings.userId, user.id), sql`coalesce(${ratings.body}, '') <> ''`)),
    db.select({ n: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ n: count() }).from(follows).where(eq(follows.followerId, user.id)),
    db
      .select({ score: ratings.score, n: count() })
      .from(ratings)
      .where(eq(ratings.userId, user.id))
      .groupBy(ratings.score),
    viewerId && viewerId !== user.id
      ? db
          .select({ id: follows.followerId })
          .from(follows)
          .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, user.id)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const totalGiven = given.reduce((s, g) => s + g.n, 0);
  const average = totalGiven ? given.reduce((s, g) => s + g.score * g.n, 0) / totalGiven : null;
  const maxBucket = Math.max(1, ...given.map((g) => g.n));

  const topIds = await db
    .select({ filmId: ratings.filmId })
    .from(ratings)
    .innerJoin(films, eq(films.id, ratings.filmId))
    .where(and(eq(ratings.userId, user.id), eq(films.status, "published")))
    .orderBy(desc(ratings.score), desc(ratings.createdAt))
    .limit(4);

  return {
    ...user,
    isSelf: viewerId === user.id,
    viewerFollows: viewerFollows.length > 0,
    stats: {
      uploads: uploads?.n ?? 0,
      reviews: reviews?.n ?? 0,
      followers: followers?.n ?? 0,
      following: following?.n ?? 0,
    },
    taste: {
      average: average === null ? null : Math.round(average * 10) / 10,
      totalRatings: totalGiven,
      distribution: [5, 4, 3, 2, 1].map((score) => {
        const n = given.find((g) => g.score === score)?.n ?? 0;
        return { score, count: n, percent: Math.round((n / maxBucket) * 100) };
      }),
    },
    topFour: await filmsByIds(topIds.map((t) => t.filmId)),
  };
}

export type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

export async function watchlistFor(userId: string) {
  const rows = await db
    .select({ filmId: watchlist.filmId })
    .from(watchlist)
    .innerJoin(films, eq(films.id, watchlist.filmId))
    .where(and(eq(watchlist.userId, userId), eq(films.status, "published")))
    .orderBy(desc(watchlist.createdAt));
  return filmsByIds(rows.map((r) => r.filmId));
}

export type ActivityItem = {
  kind: "rated" | "reviewed" | "uploaded" | "followed" | "saved";
  text: string;
  href: string;
  at: Date;
};

/** A merged, time-ordered activity stream derived from the user's own rows. */
export async function activityFor(userId: string, limit = 15): Promise<ActivityItem[]> {
  const [rated, uploaded, followed, saved] = await Promise.all([
    db
      .select({ title: films.title, slug: films.slug, score: ratings.score, body: ratings.body, at: ratings.updatedAt })
      .from(ratings)
      .innerJoin(films, eq(films.id, ratings.filmId))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.updatedAt))
      .limit(limit),
    db
      .select({ title: films.title, slug: films.slug, status: films.status, at: films.createdAt })
      .from(films)
      .where(eq(films.uploadedById, userId))
      .orderBy(desc(films.createdAt))
      .limit(limit),
    db
      .select({ username: users.username, at: follows.createdAt })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followingId))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit),
    db
      .select({ title: films.title, slug: films.slug, at: watchlist.createdAt })
      .from(watchlist)
      .innerJoin(films, eq(films.id, watchlist.filmId))
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.createdAt))
      .limit(limit),
  ]);

  const statusLabel = { pending: "in review", published: "published", rejected: "not approved" } as const;

  const items: ActivityItem[] = [
    ...rated.map((r) => ({
      kind: r.body ? ("reviewed" as const) : ("rated" as const),
      text: r.body ? `Reviewed ${r.title}` : `Rated ${r.title} ${r.score} ${r.score === 1 ? "star" : "stars"}`,
      href: `/films/${r.slug}`,
      at: r.at,
    })),
    ...uploaded.map((u) => ({
      kind: "uploaded" as const,
      text: `Uploaded a poster for ${u.title} · ${statusLabel[u.status]}`,
      href: `/films/${u.slug}`,
      at: u.at,
    })),
    ...followed.map((f) => ({
      kind: "followed" as const,
      text: `Started following @${f.username}`,
      href: `/u/${f.username}`,
      at: f.at,
    })),
    ...saved.map((s) => ({
      kind: "saved" as const,
      text: `Added ${s.title} to your watchlist`,
      href: `/films/${s.slug}`,
      at: s.at,
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
