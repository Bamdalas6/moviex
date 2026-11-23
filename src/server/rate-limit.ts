import "server-only";

import { createHash } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";

/**
 * Fixed-window rate limiting shared by every server instance: the counters live
 * in the database, so a burst spread across many Cloudflare isolates is still
 * counted once. Keys are stored as a SHA-256 (no raw IPs or emails).
 *
 * If the database can't be reached the check falls back to a per-instance
 * in-memory counter, so an outage degrades protection instead of locking
 * everyone out.
 */

export type LimitResult = { ok: boolean; retryAfterMs: number };

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, limit: number, windowMs: number, now: number): LimitResult {
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    if (memory.size > 10_000) for (const [k, b] of memory) if (b.resetAt <= now) memory.delete(k);
    return { ok: true, retryAfterMs: 0 };
  }
  bucket.count += 1;
  return bucket.count > limit ? { ok: false, retryAfterMs: bucket.resetAt - now } : { ok: true, retryAfterMs: 0 };
}

/** Counts one attempt against `key` and says whether it is still within `limit` per `windowMs`. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const now = Date.now();
  const id = hashKey(key);
  try {
    // One atomic upsert: start a new window if the old one ended, otherwise count up.
    // (SQLite evaluates every SET expression against the row as it was before the update.)
    const [row] = await db
      .insert(rateLimits)
      .values({ key: id, count: 1, resetAt: now + windowMs })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${now + windowMs} else ${rateLimits.resetAt} end`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

    // Now and then, clear out windows that ended a while ago.
    if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, now - 60 * 60 * 1000));

    if (!row) return { ok: true, retryAfterMs: 0 };
    return row.count > limit ? { ok: false, retryAfterMs: row.resetAt - now } : { ok: true, retryAfterMs: 0 };
  } catch {
    return memoryHit(id, limit, windowMs, now);
  }
}

/** Whether `key` is still under `limit` in its current window, without counting an attempt. */
export async function underLimit(key: string, limit: number): Promise<boolean> {
  const now = Date.now();
  const id = hashKey(key);
  try {
    const [row] = await db.select({ count: rateLimits.count, resetAt: rateLimits.resetAt }).from(rateLimits).where(eq(rateLimits.key, id)).limit(1);
    return !row || row.resetAt <= now || row.count < limit;
  } catch {
    const bucket = memory.get(id);
    return !bucket || bucket.resetAt <= now || bucket.count < limit;
  }
}

/** Forget the attempts against `key` (e.g. after a successful login). */
export async function clearLimit(key: string) {
  const id = hashKey(key);
  memory.delete(id);
  try {
    await db.delete(rateLimits).where(eq(rateLimits.key, id));
  } catch {
    /* best effort */
  }
}
