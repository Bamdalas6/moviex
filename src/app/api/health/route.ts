import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Liveness + database readiness probe. Imports the database lazily so a
 * misconfiguration (e.g. a missing DATABASE_URL secret on Cloudflare) is
 * reported here as readable JSON instead of a blank 500.
 */
export async function GET() {
  try {
    const { db } = await import("@/server/db/client");
    await db.run(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ status: "error", database: "unreachable", message }, { status: 503 });
  }
}
