import "server-only";

export type YouTubeVideo = {
  title: string;
  channel: string | null;
  channelUrl: string | null;
};

const TTL = 6 * 60 * 60 * 1000;
const memo = new Map<string, { at: number; value: YouTubeVideo | null }>();

export const youtubeWatchUrl = (key: string) => `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`;
export const youtubeThumb = (key: string, size: "hq" | "maxres" = "hq") =>
  `https://i.ytimg.com/vi/${encodeURIComponent(key)}/${size === "maxres" ? "maxresdefault" : "hqdefault"}.jpg`;

/**
 * Title and channel of a YouTube video via the public oEmbed endpoint (no API
 * key). Cached in memory per isolate; any failure (removed video, timeout)
 * returns null so the page falls back to what TMDB told us.
 */
export async function youtubeDetails(key: string): Promise<YouTubeVideo | null> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  let value: YouTubeVideo | null = null;
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeWatchUrl(key))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500), headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as { title?: string; author_name?: string; author_url?: string };
      if (data.title) {
        value = {
          title: data.title,
          channel: data.author_name ?? null,
          channelUrl: data.author_url?.startsWith("https://www.youtube.com/") ? data.author_url : null,
        };
      }
    }
  } catch {
    // Network hiccup or timeout: show the page without channel details.
  }
  memo.set(key, { at: Date.now(), value });
  return value;
}
