import { config } from "dotenv";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/server/db/schema";

// CLI scripts read .env.local first (Next's convention), then .env.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export const DATABASE_URL = process.env.DATABASE_URL || "file:./data/marquee.db";

if (DATABASE_URL.startsWith("file:")) {
  mkdirSync(path.dirname(path.resolve(DATABASE_URL.slice(5))), { recursive: true });
}

export const client = createClient({
  url: DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
export { schema };
