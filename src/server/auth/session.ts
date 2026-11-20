import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/constants";
import { db } from "@/server/db/client";
import { sessions, users, type User } from "@/server/db/schema";

/**
 * Database-backed sessions.
 * - The cookie holds a 256-bit random token; the DB stores only its SHA-256,
 *   so a leaked database can't be replayed as live sessions.
 * - Sessions are revocable (logout deletes the row) and slide forward when
 *   more than half their lifetime has passed.
 */

export type SessionUser = Pick<
  User,
  "id" | "name" | "username" | "email" | "role" | "avatarColor" | "bio" | "location" | "favoriteGenres" | "createdAt"
>;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  // Opportunistic cleanup keeps the table from growing without a cron job.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  await setSessionCookie(token, expiresAt);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

/** Current user for this request (memoised per render pass). Returns null when signed out. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const id = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        role: users.role,
        avatarColor: users.avatarColor,
        bio: users.bio,
        location: users.location,
        favoriteGenres: users.favoriteGenres,
        createdAt: users.createdAt,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt.getTime() - Date.now() < SESSION_TTL_MS / 2) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    try {
      // Cookies are writable only in actions/route handlers. During a plain render
      // this throws and we leave both cookie and row as they are, keeping them in sync.
      await setSessionCookie(token, expiresAt);
      await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    } catch {
      /* not writable in this context */
    }
  }

  return row.user;
});

/** For pages and actions that need a signed-in user. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

/** Only allow same-site relative redirects after login (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
