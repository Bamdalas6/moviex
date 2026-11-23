import { eq } from "drizzle-orm";
import { slugify } from "../src/lib/utils";
import { hashPassword } from "../src/server/auth/password";
import { client, db, DATABASE_URL, schema } from "./db";

/**
 * Creates (or promotes) an admin account — use this on production instead of
 * the demo seed. Reads everything from the environment so the password never
 * appears in the command line:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD=… npm run db:create-admin
 *
 * If the email already exists the account is promoted to admin (and its
 * password replaced when ADMIN_PASSWORD is set).
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || "Watch Nollywood Admin";
  const password = process.env.ADMIN_PASSWORD;
  const username = (process.env.ADMIN_USERNAME?.trim() || slugify(name).replace(/-/g, ".")).toLowerCase();

  if (!email) throw new Error("Set ADMIN_EMAIL");
  console.log(`Using ${DATABASE_URL.startsWith("file:") ? DATABASE_URL : DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (existing) {
    await db
      .update(schema.users)
      .set({ role: "admin", ...(password ? { passwordHash: await hashPassword(password) } : {}) })
      .where(eq(schema.users.id, existing.id));
    console.log(`Promoted ${email} to admin${password ? " and reset the password" : ""}.`);
  } else {
    if (!password || password.length < 12) throw new Error("Set ADMIN_PASSWORD (12+ characters) to create a new admin");
    await db.insert(schema.users).values({ email, name, username, role: "admin", passwordHash: await hashPassword(password) });
    console.log(`Created admin ${email} (@${username}).`);
  }
  client.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
