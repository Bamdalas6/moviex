import { migrate } from "drizzle-orm/libsql/migrator";
import { client, db, DATABASE_URL } from "./db";

async function main() {
  console.log(`Migrating ${DATABASE_URL} …`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
