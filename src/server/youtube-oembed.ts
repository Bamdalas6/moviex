/**
 * YouTube helpers with no Next.js or server-only imports, so the TMDB import
 * script (plain Node) and the app share them.
 */

export type YouTubeVideo = {
  title: string;
  channel: string | null;
  channelUrl: string | null;
};

export const youtubeWatchUrl = (key: string) => `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`;

/**
 * Canonical form of a channel URL so the same channel from different sources
 * matches: https, www host, no trailing slash, and lower-cased @handles (handles
 * are case-insensitive; /channel/UC… ids are not, so those keep their case).
 */
export function normalizeChannelUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!/(^|\.)youtube\.com$/.test(url.hostname)) return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (!path || path === "/") return null;
  const clean = path.startsWith("/@") ? path.toLowerCase() : path;
  return `https://www.youtube.com${clean}`;
}

/** URL for a YouTube value from Wikidata/TMDB: a channel id (UC…), an @handle, or a full URL. */
export function youtubeChannelUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^https?:\/\//.test(v)) return normalizeChannelUrl(v);
  if (/^UC[\w-]{22}$/.test(v)) return `https://www.youtube.com/channel/${v}`;
  if (/^@?[\w.-]{3,30}$/.test(v)) return `https://www.youtube.com/@${v.replace(/^@/, "").toLowerCase()}`;
  return null;
}

/**
 * Title and channel of a YouTube video via the public oEmbed endpoint (no API
 * key). Returns null when the video is gone or YouTube doesn't answer in time.
 */
export async function fetchYouTubeDetails(key: string, timeoutMs = 2500): Promise<YouTubeVideo | null> {
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeWatchUrl(key))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string; author_url?: string };
    if (!data.title) return null;
    return { title: data.title, channel: data.author_name ?? null, channelUrl: normalizeChannelUrl(data.author_url) };
  } catch {
    return null;
  }
}
