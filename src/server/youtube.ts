import "server-only";
import { fetchYouTubeDetails, type YouTubeVideo } from "./youtube-oembed";

export { youtubeChannelUrl, youtubeWatchUrl, type YouTubeVideo } from "./youtube-oembed";

const TTL = 6 * 60 * 60 * 1000;
const memo = new Map<string, { at: number; value: YouTubeVideo | null }>();

export const youtubeThumb = (key: string, size: "hq" | "maxres" = "hq") =>
  `https://i.ytimg.com/vi/${encodeURIComponent(key)}/${size === "maxres" ? "maxresdefault" : "hqdefault"}.jpg`;

/**
 * Title and channel of a YouTube video, cached in memory per isolate. Any
 * failure (removed video, timeout) returns null so the page falls back to what
 * TMDB told us.
 */
export async function youtubeDetails(key: string): Promise<YouTubeVideo | null> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const value = await fetchYouTubeDetails(key);
  memo.set(key, { at: Date.now(), value });
  return value;
}
