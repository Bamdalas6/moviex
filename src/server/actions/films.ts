"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { POSTER_GRADIENTS } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { pickByKey, slugify } from "@/lib/utils";
import { fieldErrors, uploadFilmSchema } from "@/lib/validation";
import { requireAdmin, requireUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { filmGenres, films } from "@/server/db/schema";
import { slugExists } from "@/server/queries/films";
import { rateLimit } from "@/server/rate-limit";
import { PosterError, savePoster } from "@/server/storage";

export type UploadState = ActionState & { film?: { title: string; slug: string; posterUrl: string | null } };

async function uniqueSlug(title: string, year: number) {
  const base = slugify(`${title}-${year}`) || "film";
  let slug = base;
  for (let i = 2; await slugExists(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export async function submitFilm(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireUser("/upload");

  const raw = {
    title: String(formData.get("title") ?? ""),
    year: String(formData.get("year") ?? ""),
    runtime: String(formData.get("runtime") ?? ""),
    genres: formData.getAll("genres").map(String),
    language: String(formData.get("language") ?? ""),
    industry: String(formData.get("industry") || "Nollywood"),
    director: String(formData.get("director") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    allowReviews: formData.get("allowReviews"),
    posterSpoiler: formData.get("posterSpoiler"),
    rights: formData.get("rights") ?? undefined,
  };
  const values = {
    title: raw.title,
    year: raw.year,
    runtime: raw.runtime,
    genres: raw.genres,
    language: raw.language,
    director: raw.director,
    synopsis: raw.synopsis,
  };

  if (!(await rateLimit(`upload:${user.id}`, 10, 60 * 60 * 1000)).ok) {
    return { values, message: "You've uploaded a lot this hour. Please try again later." };
  }

  const parsed = uploadFilmSchema.safeParse(raw);
  const poster = formData.get("poster");
  const posterFile = poster instanceof File && poster.size > 0 ? poster : null;

  if (!parsed.success || !posterFile) {
    const errors = parsed.success ? {} : fieldErrors(parsed.error);
    if (!posterFile) errors.poster = ["Choose a poster image"];
    return { values, errors };
  }

  let posterKey: string;
  try {
    posterKey = await savePoster(posterFile);
  } catch (error) {
    if (error instanceof PosterError) return { values, errors: { poster: [error.message] } };
    throw error;
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.title, data.year);

  const [film] = await db
    .insert(films)
    .values({
      slug,
      title: data.title,
      year: data.year,
      runtimeMinutes: data.runtime,
      synopsis: data.synopsis,
      director: data.director || null,
      language: data.language,
      industry: data.industry,
      posterKey,
      posterGradient: pickByKey(POSTER_GRADIENTS, slug),
      posterSpoiler: data.posterSpoiler,
      allowReviews: data.allowReviews,
      status: "pending",
      uploadedById: user.id,
    })
    .returning({ id: films.id });

  await db.insert(filmGenres).values(data.genres.map((genre) => ({ filmId: film!.id, genre })));

  revalidatePath(`/u/${user.username}`);
  revalidatePath("/admin");
  return { ok: true, film: { title: data.title, slug, posterUrl: `/api/posters/${posterKey}` } };
}

export async function moderateFilm(filmId: string, decision: "published" | "rejected") {
  await requireAdmin();
  await db
    .update(films)
    .set({ status: decision, publishedAt: decision === "published" ? new Date() : null })
    .where(eq(films.id, filmId));
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/discover");
}
