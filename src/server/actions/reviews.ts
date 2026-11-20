"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";
import { fieldErrors, quickRatingSchema, reviewSchema } from "@/lib/validation";
import { getCurrentUser, requireUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { films, helpfulVotes, ratings, reviewReports } from "@/server/db/schema";

async function reviewableFilm(filmId: string) {
  const [film] = await db
    .select({ slug: films.slug, status: films.status, allowReviews: films.allowReviews })
    .from(films)
    .where(eq(films.id, filmId))
    .limit(1);
  return film && film.status === "published" && film.allowReviews ? film : null;
}

function revalidateFilm(slug: string) {
  revalidatePath(`/films/${slug}`);
  revalidatePath("/reviews");
  revalidatePath("/account/reviews");
  revalidatePath("/");
}

/** Full rate & review form. Upserts the viewer's single rating row for the film. */
export async function saveReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = {
    filmId: String(formData.get("filmId") ?? ""),
    score: formData.get("score") ?? "0",
    headline: String(formData.get("headline") ?? ""),
    body: String(formData.get("body") ?? ""),
    spoiler: formData.get("spoiler"),
  };
  const values = { headline: raw.headline, body: raw.body, score: String(raw.score) };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { values, errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const film = await reviewableFilm(data.filmId);
  if (!film) return { values, message: "Reviews are closed for this film." };

  const now = new Date();
  await db
    .insert(ratings)
    .values({
      userId: user.id,
      filmId: data.filmId,
      score: data.score,
      headline: data.headline || null,
      body: data.body || null,
      spoiler: data.spoiler,
    })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.filmId],
      set: {
        score: data.score,
        headline: data.headline || null,
        body: data.body || null,
        spoiler: data.spoiler,
        updatedAt: now,
      },
    });

  revalidateFilm(film.slug);
  revalidatePath(`/u/${user.username}`);
  return { ok: true, message: data.body ? "Review posted" : "Rating saved", values };
}

/** One-tap star rating from the film page. Keeps any existing review text. */
export async function rateFilm(filmId: string, score: number) {
  const user = await requireUser();
  const parsed = quickRatingSchema.safeParse({ filmId, score });
  if (!parsed.success) return { ok: false as const };

  const film = await reviewableFilm(filmId);
  if (!film) return { ok: false as const };

  await db
    .insert(ratings)
    .values({ userId: user.id, filmId, score: parsed.data.score })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.filmId],
      set: { score: parsed.data.score, updatedAt: new Date() },
    });

  revalidateFilm(film.slug);
  return { ok: true as const };
}

export async function deleteReview(filmId: string) {
  const user = await requireUser();
  const [film] = await db.select({ slug: films.slug }).from(films).where(eq(films.id, filmId)).limit(1);
  await db.delete(ratings).where(and(eq(ratings.userId, user.id), eq(ratings.filmId, filmId)));
  if (film) revalidateFilm(film.slug);
  else revalidatePath("/account/reviews");
  revalidatePath(`/u/${user.username}`);
}

export async function toggleHelpful(ratingId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, reason: "auth" as const };

  const [own] = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(and(eq(ratings.id, ratingId), eq(ratings.userId, user.id)))
    .limit(1);
  if (own) return { ok: false as const, reason: "own" as const };

  const removed = await db
    .delete(helpfulVotes)
    .where(and(eq(helpfulVotes.userId, user.id), eq(helpfulVotes.ratingId, ratingId)))
    .returning();
  if (!removed.length) {
    await db.insert(helpfulVotes).values({ userId: user.id, ratingId }).onConflictDoNothing();
  }

  revalidatePath("/reviews");
  return { ok: true as const, voted: !removed.length };
}

export async function reportReview(ratingId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, reason: "auth" as const };
  await db.insert(reviewReports).values({ userId: user.id, ratingId }).onConflictDoNothing();
  return { ok: true as const };
}
