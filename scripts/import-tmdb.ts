import { CINEMA_BRANCHES } from "../src/server/db/cinema-data";
import { importFromTmdb } from "../src/server/tmdb/import";
import { client, db, schema } from "./db";

/**
 * Refreshes films, posters, streaming availability and the "in cinemas now"
 * list from TMDB, and makes sure the cinema directory exists. Safe to run on a
 * live database (e.g. nightly): it never touches ratings, reviews or uploads.
 */
async function main() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error("TMDB_API_KEY is not set. Add it to .env.local (https://www.themoviedb.org/settings/api).");
    process.exit(1);
  }

  await importFromTmdb(db, { apiKey, log: console.log });
  await db.insert(schema.cinemas).values(CINEMA_BRANCHES).onConflictDoNothing();
  console.log(`Cinema directory: ${CINEMA_BRANCHES.length} branches.`);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
