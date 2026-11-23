import { refreshMedia } from "../src/server/tmdb/media";
import { client, db, ready } from "./db";

/**
 * Fills in faces without a full import: YouTube channel pictures, and Wikidata
 * photos for people TMDB has no photo of. (The TMDB import runs this too.)
 */
async function main() {
  await ready();
  await refreshMedia(db, console.log);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
