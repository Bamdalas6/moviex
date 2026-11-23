import type { BatchItem } from "drizzle-orm/batch";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../db/schema";

export type Statement = BatchItem<"sqlite">;

/**
 * Runs statements in batches: each batch is a single round trip and a single
 * transaction on libSQL/Turso. Writing ~1,000 films one statement at a time
 * from CI to a remote database would take tens of minutes; batched it takes
 * seconds.
 */
export async function runBatched(db: LibSQLDatabase<typeof schema>, statements: Statement[], size = 100) {
  for (let i = 0; i < statements.length; i += size) {
    const chunk = statements.slice(i, i + size);
    await db.batch(chunk as [Statement, ...Statement[]]);
  }
}
