import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/env";
import { POSTER_MAX_BYTES } from "@/lib/constants";

/**
 * Poster storage with two drivers behind one tiny interface:
 * - Cloudflare Workers: the R2 bucket bound as `POSTERS` (see wrangler.jsonc)
 * - Node (local dev, any regular server): files under UPLOAD_DIR
 */

const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) =>
      String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP",
  },
];

export class PosterError extends Error {}

/** Sniffs the real file type from its bytes — never trusts the client-sent MIME type. */
export function detectImageType(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

/** Minimal slice of Cloudflare's R2Bucket API that we use. */
type PosterBucket = {
  put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
};

const onWorkers = () => typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

async function bucket(): Promise<PosterBucket | null> {
  if (!onWorkers()) return null;
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  return ((getCloudflareContext().env as { POSTERS?: PosterBucket }).POSTERS ?? null) as PosterBucket | null;
}

// Runtime-configured directory: tell the bundler not to trace it into the server build.
const root = () => path.resolve(/* turbopackIgnore: true */ env.UPLOAD_DIR);

export async function savePoster(file: File): Promise<string> {
  if (file.size === 0) throw new PosterError("Choose a poster image");
  if (file.size > POSTER_MAX_BYTES) throw new PosterError("Posters can be up to 5 MB");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new PosterError("Use a JPG, PNG or WebP image");

  const key = `${randomUUID()}.${type.ext}`;
  const r2 = await bucket();
  if (r2) {
    await r2.put(key, bytes, { httpMetadata: { contentType: type.mime } });
  } else if (onWorkers()) {
    throw new PosterError("Poster uploads aren't set up on this server yet.");
  } else {
    await mkdir(root(), { recursive: true });
    await writeFile(path.join(/* turbopackIgnore: true */ root(), key), bytes);
  }
  return key;
}

const KEY_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export async function readPoster(key: string) {
  if (!KEY_PATTERN.test(key)) return null; // also blocks path traversal
  try {
    const r2 = await bucket();
    let bytes: Uint8Array<ArrayBuffer>;
    if (r2) {
      const object = await r2.get(key);
      if (!object) return null;
      bytes = new Uint8Array(await object.arrayBuffer());
    } else {
      bytes = new Uint8Array(await readFile(path.join(/* turbopackIgnore: true */ root(), key)));
    }
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
