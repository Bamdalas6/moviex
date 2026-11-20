import { z } from "zod";

/**
 * Validated, typed environment. Imported by server code only; fails fast on boot
 * with a readable message instead of a confusing runtime error later.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("file:./data/marquee.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  UPLOAD_DIR: z.string().min(1).default("./storage/uploads"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsed.data,
  DATABASE_AUTH_TOKEN: parsed.data.DATABASE_AUTH_TOKEN || undefined,
};

// Cloudflare Workers have no local disk, so the SQLite-file default can't work there.
// Fail with instructions instead of libSQL's cryptic "URL scheme not supported".
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
if (onWorkers && env.DATABASE_URL.startsWith("file:")) {
  throw new Error(
    "DATABASE_URL is not set on this Worker. Add your Turso URL (libsql://…) and DATABASE_AUTH_TOKEN " +
      "as secrets in Cloudflare: Worker → Settings → Variables and Secrets, then redeploy.",
  );
}
