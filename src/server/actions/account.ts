"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, type ThemePreference } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { fieldErrors, profileSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export async function setTheme(theme: ThemePreference) {
  if (!["system", "light", "dark"].includes(theme)) return;
  const jar = await cookies();
  jar.set(THEME_COOKIE, theme, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = {
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    location: String(formData.get("location") ?? ""),
    genres: formData.getAll("genres").map(String),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { values: raw, errors: fieldErrors(parsed.error) };

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      location: parsed.data.location || null,
      favoriteGenres: parsed.data.genres,
    })
    .where(eq(users.id, user.id));

  revalidatePath(`/u/${user.username}`);
  return { ok: true, message: "Profile updated", values: raw };
}
