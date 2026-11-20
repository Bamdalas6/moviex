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
