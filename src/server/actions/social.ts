"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { films, follows, users, watchlist } from "@/server/db/schema";

export async function toggleFollow(targetUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, reason: "auth" as const };
  if (user.id === targetUserId) return { ok: false as const, reason: "self" as const };

  const [target] = await db.select({ username: users.username }).from(users).where(eq(users.id, targetUserId));
  if (!target) return { ok: false as const, reason: "missing" as const };

  const removed = await db
    .delete(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)))
    .returning();
  if (!removed.length) {
    await db.insert(follows).values({ followerId: user.id, followingId: targetUserId }).onConflictDoNothing();
  }

  revalidatePath(`/u/${target.username}`);
  revalidatePath("/reviews");
  return { ok: true as const, following: !removed.length };
}

export async function toggleWatchlist(filmId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, reason: "auth" as const };

  const [film] = await db.select({ slug: films.slug }).from(films).where(eq(films.id, filmId));
  if (!film) return { ok: false as const, reason: "missing" as const };

  const removed = await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, user.id), eq(watchlist.filmId, filmId)))
    .returning();
  if (!removed.length) {
    await db.insert(watchlist).values({ userId: user.id, filmId }).onConflictDoNothing();
  }

  revalidatePath(`/films/${film.slug}`);
  revalidatePath(`/u/${user.username}`);
  return { ok: true as const, saved: !removed.length };
}
