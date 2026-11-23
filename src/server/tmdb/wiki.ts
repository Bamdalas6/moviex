/**
 * Public-profile enrichment from Wikidata and Wikipedia (free, no API key).
 * Wikidata holds the social accounts people list publicly (Instagram, X,
 * Facebook, TikTok, YouTube, official site); Wikipedia gives a readable bio and
 * a photo. Plain Node: used by the TMDB import script.
 */

const HEADERS = { "User-Agent": "Marquee-film-import/1.0", Accept: "application/json" };

export type WikiProfile = {
  headline: string | null;
  /** From Wikidata "sex or gender" (P21), in TMDB's numbering: 1 female, 2 male, 0 unknown. */
  gender: number;
  wikipediaTitle: string | null;
  instagram: string | null;
  x: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
};

export type WikiSummary = { extract: string; url: string; photoUrl: string | null };

const PROPS = { instagram: "P2003", x: "P2002", facebook: "P2013", tiktok: "P7085", youtube: "P2397", website: "P856" } as const;

type Claim = { mainsnak?: { datavalue?: { value?: unknown } }; rank?: string };
type Entity = {
  claims?: Record<string, Claim[]>;
  descriptions?: { en?: { value: string } };
  sitelinks?: { enwiki?: { title: string } };
};

/** Best value of a Wikidata property: preferred rank first, skip deprecated. */
function claimValue(claims: Claim[] | undefined): string | null {
  const usable = (claims ?? []).filter((c) => c.rank !== "deprecated");
  const best = usable.find((c) => c.rank === "preferred") ?? usable[0];
  const value = best?.mainsnak?.datavalue?.value;
  return typeof value === "string" ? value.trim() : null;
}

/** Wikidata items for female (incl. trans woman) and male (incl. trans man). */
function genderOf(claims: Claim[] | undefined): number {
  const value = (claims ?? []).find((c) => c.rank !== "deprecated")?.mainsnak?.datavalue?.value as { id?: string } | undefined;
  if (value?.id === "Q6581072" || value?.id === "Q1052281") return 1;
  if (value?.id === "Q6581097" || value?.id === "Q2449503") return 2;
  return 0;
}

/** Usernames/ids only: anything with spaces or slashes is not a usable handle. */
const handle = (v: string | null) => (v && /^[\w.@-]{1,100}$/.test(v) ? v.replace(/^@/, "") : null);
const website = (v: string | null) => (v && /^https?:\/\/[^\s]+$/.test(v) ? v : null);

/** Looks up to 50 Wikidata items per request. */
export async function wikidataProfiles(ids: string[]): Promise<Map<string, WikiProfile>> {
  const out = new Map<string, WikiProfile>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url =
      "https://www.wikidata.org/w/api.php?" +
      new URLSearchParams({
        action: "wbgetentities",
        ids: batch.join("|"),
        props: "claims|descriptions|sitelinks",
        languages: "en",
        sitefilter: "enwiki",
        format: "json",
      });
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const data = (await res.json()) as { entities?: Record<string, Entity> };
      for (const [id, e] of Object.entries(data.entities ?? {})) {
        out.set(id, {
          headline: e.descriptions?.en?.value ?? null,
          gender: genderOf(e.claims?.P21),
          wikipediaTitle: e.sitelinks?.enwiki?.title ?? null,
          instagram: handle(claimValue(e.claims?.[PROPS.instagram])),
          x: handle(claimValue(e.claims?.[PROPS.x])),
          facebook: handle(claimValue(e.claims?.[PROPS.facebook])),
          tiktok: handle(claimValue(e.claims?.[PROPS.tiktok])),
          youtube: handle(claimValue(e.claims?.[PROPS.youtube])),
          website: website(claimValue(e.claims?.[PROPS.website])),
        });
      }
    } catch {
      // A failed batch just means fewer socials this run; the next import fills them in.
    }
  }
  return out;
}

/** Lead paragraph, page URL and photo of an English Wikipedia article. */
export async function wikipediaSummary(title: string, attempt = 1): Promise<WikiSummary | null> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      // Rate limited or a hiccup: back off and try again.
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return wikipediaSummary(title, attempt + 1);
    }
    if (!res.ok) return null;
    const data = (await res.json()) as {
      type?: string;
      extract?: string;
      thumbnail?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
    };
    if (data.type === "disambiguation" || !data.extract) return null;
    const photo = data.thumbnail?.source;
    return {
      extract: data.extract.slice(0, 1500),
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      photoUrl: photo && /^https:\/\/[\w.-]*wikimedia\.org\//.test(photo) ? photo.replace(/\?.*$/, "") : null,
    };
  } catch {
    if (attempt < 3) return wikipediaSummary(title, attempt + 1);
    return null;
  }
}
