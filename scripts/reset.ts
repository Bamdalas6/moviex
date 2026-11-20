import { config } from "dotenv";
import { rmSync } from "node:fs";
import path from "node:path";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const url = process.env.DATABASE_URL || "file:./data/marquee.db";

if (!url.startsWith("file:")) {
  console.error("db:reset only deletes local SQLite files. Refusing to touch a remote database.");
  process.exit(1);
}

const file = path.resolve(url.slice(5));
for (const suffix of ["", "-wal", "-shm"]) rmSync(file + suffix, { force: true });
console.log(`Removed ${file}`);
