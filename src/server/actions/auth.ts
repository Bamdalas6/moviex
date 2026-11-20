"use server";

import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AVATAR_COLORS } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { pickByKey } from "@/lib/utils";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";
import { getDummyHash, hashPassword, needsRehash, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, safeNext } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { rateLimit } from "@/server/rate-limit";

async function clientKey(scope: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  };
  const values = { email: raw.email };

  const limited = rateLimit(await clientKey("login"), 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return { values, message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { values, errors: fieldErrors(parsed.error) };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) return { values, message: "That email and password don't match an account." };

  // Transparently upgrade old or cheaper hashes now that we have the plaintext.
  if (needsRehash(user.passwordHash)) {
    await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(users.id, user.id));
  }

  await createSession(user.id);
  redirect(safeNext(parsed.data.next));
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? "").replace(/^@/, ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    genres: formData.getAll("genres").map(String),
    terms: formData.get("terms") ?? undefined,
  };
  const values = { name: raw.name, username: raw.username, email: raw.email, genres: raw.genres };

  const limited = rateLimit(await clientKey("signup"), 5, 60 * 60 * 1000);
  if (!limited.ok) return { values, message: "Too many sign-ups from this network. Try again later." };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { values, errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const taken = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, data.email), eq(users.username, data.username)));

  if (taken.length) {
    const errors: ActionState["errors"] = {};
    if (taken.some((t) => t.username === data.username)) errors.username = ["That username is taken"];
    if (taken.some((t) => t.email === data.email)) errors.email = ["An account with this email already exists"];
    return { values, errors };
  }

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      username: data.username,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      favoriteGenres: data.genres,
      avatarColor: pickByKey(AVATAR_COLORS, data.username),
    })
    .returning({ id: users.id });

  await createSession(user!.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/welcome");
}
