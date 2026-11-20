import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/env";
import * as schema from "./schema";

function ensureLocalDirectory(url: string) {
  if (!url.startsWith("file:")) return;
  const file = url.slice("file:".length);
  mkdirSync(path.dirname(path.resolve(/* turbopackIgnore: true */ file)), { recursive: true });
}

function createLibsqlClient(): Client {
  ensureLocalDirectory(env.DATABASE_URL);
  const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });
  // SQLite needs foreign keys switched on per connection.
  void client.execute("PRAGMA foreign_keys = ON");
  return client;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { libsql?: Client };
const client = globalForDb.libsql ?? createLibsqlClient();
if (env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export type Database = typeof db;
