import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/env";
import { POSTER_MAX_BYTES } from "@/lib/constants";

/**
 * Poster storage. Local disk for development; the interface is deliberately
 * tiny so an S3/R2 driver can replace it without touching callers.
 */

const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export class PosterError extends Error {}

/** Sniffs the real file type from its bytes — never trusts the client-sent MIME type. */
export function detectImageType(bytes: Buffer) {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

// Runtime-configured directory: tell the bundler not to trace it into the server build.
const root = () => path.resolve(/* turbopackIgnore: true */ env.UPLOAD_DIR);

export async function savePoster(file: File): Promise<string> {
  if (file.size === 0) throw new PosterError("Choose a poster image");
  if (file.size > POSTER_MAX_BYTES) throw new PosterError("Posters can be up to 20 MB");

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new PosterError("Use a JPG, PNG or WebP image");

  const key = `${randomUUID()}.${type.ext}`;
  await mkdir(root(), { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ root(), key), bytes);
  return key;
}

const KEY_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export async function readPoster(key: string) {
  if (!KEY_PATTERN.test(key)) return null; // also blocks path traversal
  try {
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ root(), key));
    const type = detectImageType(bytes);
    return type ? { bytes, mime: type.mime } : null;
  } catch {
    return null;
  }
}

export const posterUrl = (key: string | null | undefined) => (key ? `/api/posters/${key}` : null);

/** A community upload wins; otherwise the official TMDB poster; otherwise null (gradient fallback). */
export const resolvePoster = (key: string | null | undefined, tmdbPath: string | null | undefined) =>
  posterUrl(key) ?? (tmdbPath ? `https://image.tmdb.org/t/p/w500${tmdbPath}` : null);
