export type SocialNetwork = "youtube" | "instagram" | "x" | "tiktok" | "facebook" | "website" | "imdb" | "wikipedia";

export type SocialLink = { network: SocialNetwork; label: string; detail: string; url: string };

type SocialSource = {
  youtube?: string | null;
  instagram?: string | null;
  x?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  website?: string | null;
  imdbId?: string | null;
  wikipediaUrl?: string | null;
};

const clean = (v: string | null | undefined) => (v ? v.trim().replace(/^@/, "") : "");
const safeHandle = (v: string) => /^[\w.-]{1,100}$/.test(v);

/** YouTube value from Wikidata/TMDB (channel id, @handle or URL) → channel URL. */
export function youtubeUrlFor(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^https:\/\/(www\.)?youtube\.com\/[^\s]+$/.test(v)) return v;
  if (/^UC[\w-]{22}$/.test(v)) return `https://www.youtube.com/channel/${v}`;
  const h = v.replace(/^@/, "");
  return safeHandle(h) ? `https://www.youtube.com/@${h}` : null;
}

/**
 * Public profiles for a person, in the order fans look for them. Only handles
 * people list publicly (via Wikidata/TMDB) are shown; there is no private
 * contact information.
 */
export function socialLinks(p: SocialSource): SocialLink[] {
  const out: SocialLink[] = [];
  const yt = youtubeUrlFor(p.youtube);
  if (yt) out.push({ network: "youtube", label: "YouTube", detail: "Channel", url: yt });

  const ig = clean(p.instagram);
  if (ig && safeHandle(ig)) out.push({ network: "instagram", label: "Instagram", detail: `@${ig}`, url: `https://www.instagram.com/${ig}/` });
  const x = clean(p.x);
  if (x && safeHandle(x)) out.push({ network: "x", label: "X (Twitter)", detail: `@${x}`, url: `https://x.com/${x}` });
  const tt = clean(p.tiktok);
  if (tt && safeHandle(tt)) out.push({ network: "tiktok", label: "TikTok", detail: `@${tt}`, url: `https://www.tiktok.com/@${tt}` });
  const fb = clean(p.facebook);
  if (fb && safeHandle(fb)) out.push({ network: "facebook", label: "Facebook", detail: fb, url: `https://www.facebook.com/${fb}` });

  if (p.website && /^https?:\/\/[^\s]+$/.test(p.website)) {
    let host = p.website;
    try {
      host = new URL(p.website).hostname.replace(/^www\./, "");
    } catch {
      // keep the raw value
    }
    out.push({ network: "website", label: "Official website", detail: host, url: p.website });
  }
  if (p.imdbId && /^nm\d+$/.test(p.imdbId)) out.push({ network: "imdb", label: "IMDb", detail: "Filmography", url: `https://www.imdb.com/name/${p.imdbId}/` });
  if (p.wikipediaUrl?.startsWith("https://en.wikipedia.org/")) out.push({ network: "wikipedia", label: "Wikipedia", detail: "Biography", url: p.wikipediaUrl });
  return out;
}
