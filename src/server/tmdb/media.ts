/**
 * Faces for the catalogue (plain Node: used by the import).
 *
 * - YouTube channels: each channel's own profile picture, read from the
 *   og:image tag of its public page (no API key needed).
 * - People: TMDB has no photo for most Nollywood actors, so Wikidata fills the
 *   gap: Nigerian film people with a photo on Wikimedia Commons, matched by
 *   their TMDB id when Wikidata lists it, otherwise by a name that only one of
 *   them has.
 */

import { createHash } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../db/schema";
import { mapLimit } from "./client";

type Db = LibSQLDatabase<typeof schema>;

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const BOT_UA = "watch-nollywood-import/1.0 (film catalogue photo matching)";

// ---------------------------------------------------------------------------
// YouTube channel pictures
// ---------------------------------------------------------------------------

/** The og:image of a YouTube channel page, sized for avatars (240px). */
export function avatarFromHtml(html: string): string | null {
  const m = html.match(/<meta property="og:image" content="(https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/[^"]+)"/);
  if (!m) return null;
  const url = m[1]!.replace(/&amp;/g, "&");
  return /=s\d+/.test(url) ? url.replace(/=s\d+[^/]*$/, "=s240-c-k-c0x00ffffff-no-rj") : url;
}

/**
 * Reads a channel page only until its og:image appears (about 1 MB in), then stops.
 * The SOCS cookie is YouTube's "reject all" consent answer, so no consent page.
 */
export async function fetchChannelAvatar(channelUrl: string, timeoutMs = 20000): Promise<string | null> {
  try {
    const res = await fetch(channelUrl, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en", Cookie: "SOCS=CAI" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let read = 0;
    try {
      while (read < 4_000_000) {
        const { done, value } = await reader.read();
        if (done) break;
        read += value.length;
        text += decoder.decode(value, { stream: true });
        const found = avatarFromHtml(text);
        if (found) return found;
        if (text.length > 300_000) text = text.slice(-4000); // keep a tail for a tag split across chunks
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Photos of people from Wikidata / Wikimedia Commons
// ---------------------------------------------------------------------------

/** Lower-case ASCII letters only, so "Ọmọ́tọ́lá Jalade-Ekeinde" and "Omotola Jalade Ekeinde" match. */
export function nameKey(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

/** A Commons file (Special:FilePath URL) as a 330px thumbnail (Wikimedia only serves its standard sizes) on upload.wikimedia.org; null for formats we can't show. */
export function commonsThumb(fileUrl: string, width = 330): string | null {
  const raw = decodeURIComponent(fileUrl.split("/Special:FilePath/")[1] ?? "").replace(/ /g, "_");
  if (!raw || !/\.(jpe?g|png|webp)$/i.test(raw)) return null;
  const md5 = createHash("md5").update(raw).digest("hex");
  const file = encodeURIComponent(raw);
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${file}/${width}px-${file}`;
}

export type PhotoIndex = { byTmdb: Map<number, string>; byName: Map<string, string> };

// Nigerian citizens who work in film or TV (actors, directors, producers, writers, presenters, comedians …) with a photo.
const QUERY = `
SELECT ?p ?pLabel ?alt ?img ?tmdb WHERE {
  ?p wdt:P31 wd:Q5; wdt:P27 wd:Q1033; wdt:P18 ?img.
  ?p wdt:P106 ?occ.
  VALUES ?occ { wd:Q33999 wd:Q10800557 wd:Q10798782 wd:Q2526255 wd:Q3282637 wd:Q28389 wd:Q2405480 wd:Q245068 wd:Q488111
                wd:Q2259451 wd:Q177220 wd:Q947873 wd:Q578109 wd:Q1028181 wd:Q4610556 wd:Q3455803 }
  OPTIONAL { ?p wdt:P4985 ?tmdb. }
  OPTIONAL { ?p skos:altLabel ?alt. FILTER(LANG(?alt) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

type Binding = Record<string, { value: string } | undefined>;

/** One SPARQL query; an empty index if Wikidata is unavailable (the next import tries again). */
export async function nigerianFilmPhotos(): Promise<PhotoIndex> {
  const index: PhotoIndex = { byTmdb: new Map(), byName: new Map() };
  try {
    const res = await fetch(`https://query.wikidata.org/sparql?${new URLSearchParams({ query: QUERY })}`, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": BOT_UA },
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return index;
    const rows = ((await res.json()) as { results: { bindings: Binding[] } }).results.bindings;

    const byPerson = new Map<string, { photo: string; names: Set<string>; tmdb: Set<number> }>();
    for (const b of rows) {
      const id = b.p?.value;
      const photo = b.img ? commonsThumb(b.img.value) : null;
      if (!id || !photo) continue;
      const entry = byPerson.get(id) ?? { photo, names: new Set<string>(), tmdb: new Set<number>() };
      for (const n of [b.pLabel?.value, b.alt?.value]) if (n && !/^Q\d+$/.test(n)) entry.names.add(nameKey(n));
      if (b.tmdb && /^\d+$/.test(b.tmdb.value)) entry.tmdb.add(Number(b.tmdb.value));
      byPerson.set(id, entry);
    }

    // Names shared by two different people are ambiguous: never used.
    const owners = new Map<string, Set<string>>();
    for (const [id, e] of byPerson) for (const n of e.names) owners.set(n, (owners.get(n) ?? new Set()).add(id));
    for (const [id, e] of byPerson) {
      for (const t of e.tmdb) index.byTmdb.set(t, e.photo);
      for (const n of e.names) if (n.includes(" ") && owners.get(n)!.size === 1 && owners.get(n)!.has(id)) index.byName.set(n, e.photo);
    }
  } catch {
    /* fall through with what we have */
  }
  return index;
}

export function photoFromIndex(index: PhotoIndex, tmdbId: number, name: string) {
  return index.byTmdb.get(tmdbId) ?? index.byName.get(nameKey(name)) ?? null;
}

// ---------------------------------------------------------------------------
// Fill in what's missing
// ---------------------------------------------------------------------------

/** Channel pictures for channels without one, and Wikidata photos for people without any photo. */
export async function refreshMedia(db: Db, log: (line: string) => void, opts: { photos?: PhotoIndex } = {}) {
  const channels = await db
    .select({ id: schema.channels.id, url: schema.channels.url })
    .from(schema.channels)
    .where(isNull(schema.channels.avatarUrl));
  const avatars = await mapLimit(channels, 4, async (c) => [c.id, await fetchChannelAvatar(c.url)] as const);
  let channelHits = 0;
  for (const [id, avatarUrl] of avatars) {
    if (!avatarUrl) continue;
    channelHits++;
    await db.update(schema.channels).set({ avatarUrl }).where(eq(schema.channels.id, id));
  }
  log(`YouTube: pictures for ${channelHits} of ${channels.length} channels that had none.`);

  const photos = opts.photos ?? (await nigerianFilmPhotos());
  const faceless = await db
    .select({ id: schema.people.id, tmdbId: schema.people.tmdbId, name: schema.people.name })
    .from(schema.people)
    .where(and(isNull(schema.people.tmdbProfilePath), isNull(schema.people.photoUrl)));
  const updates = faceless
    .map((p) => ({ id: p.id, photo: photoFromIndex(photos, p.tmdbId, p.name) }))
    .filter((u): u is { id: string; photo: string } => Boolean(u.photo));
  for (let i = 0; i < updates.length; i += 50) {
    await db.batch(
      updates.slice(i, i + 50).map((u) => db.update(schema.people).set({ photoUrl: u.photo }).where(eq(schema.people.id, u.id))) as never,
    );
  }
  const [left] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.people)
    .where(and(isNull(schema.people.tmdbProfilePath), isNull(schema.people.photoUrl)));
  log(`People: Wikidata photos for ${updates.length} more; ${left?.n ?? 0} still without a photo (hidden from people lists).`);
}
