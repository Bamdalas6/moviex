import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * libSQL connection. Locally a SQLite file (file:./data/marquee.db); in
 * production a hosted libSQL database such as Turso (libsql://…), which is also
 * what Cloudflare Workers use — there the package resolves to its HTTP client.
 */

const isFile = env.DATABASE_URL.startsWith("file:");

function createLibsqlClient(): Client {
  if (isFile) {
    mkdirSync(path.dirname(path.resolve(/* turbopackIgnore: true */ env.DATABASE_URL.slice("file:".length))), {
      recursive: true,
    });
  }
  const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });
  // A local SQLite connection needs foreign keys switched on; hosted libSQL enforces them server-side.
  if (isFile) void client.execute("PRAGMA foreign_keys = ON");
  return client;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { libsql?: Client };
const client = globalForDb.libsql ?? createLibsqlClient();
if (env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export type Database = typeof db;
