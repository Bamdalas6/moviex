/**
 * Minimal, typed client for The Movie Database (TMDB) v3 API.
 * Used by the import script; deliberately free of Next.js imports so it runs under plain Node.
 *
 * Attribution: this product uses the TMDB API but is not endorsed or certified by TMDB.
 */

const API = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbListMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  vote_count: number;
  original_language: string;
};

type Provider = { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number };

export type TmdbMovieDetail = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  adult: boolean;
  vote_average: number;
  vote_count: number;
  original_language: string;
  origin_country?: string[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; english_name: string }[];
  genres: { id: number; name: string }[];
  credits: {
    cast: TmdbCastCredit[];
    crew: TmdbCrewCredit[];
  };
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: {
    results: Record<string, { link?: string; flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[] } | undefined>;
  };
};

type CreditPerson = {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string | null;
  popularity?: number;
  gender?: number;
};
export type TmdbCastCredit = CreditPerson & { order: number; character?: string | null };
export type TmdbCrewCredit = CreditPerson & { job: string };

/** A film in someone's filmography (enough to decide whether to import it). */
export type TmdbFilmographyEntry = { id: number; title: string; poster_path: string | null; release_date?: string; job?: string };

export type TmdbPerson = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number;
  gender?: number;
  movie_credits?: { cast: TmdbFilmographyEntry[]; crew: TmdbFilmographyEntry[] };
  external_ids?: {
    imdb_id: string | null;
    wikidata_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    tiktok_id: string | null;
    twitter_id: string | null;
    youtube_id: string | null;
  };
};

export type TmdbVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
};

const VIDEO_TYPE_RANK: Record<string, number> = { Trailer: 0, Teaser: 1, Clip: 2, Featurette: 3 };

/** Best YouTube video for a film: official trailers first, then teasers, clips, featurettes; newest wins ties. */
export function pickTrailer(videos: TmdbVideo[] | undefined): TmdbVideo | null {
  const candidates = (videos ?? []).filter((v) => v.site === "YouTube" && v.key && v.type in VIDEO_TYPE_RANK);
  candidates.sort(
    (a, b) =>
      VIDEO_TYPE_RANK[a.type]! - VIDEO_TYPE_RANK[b.type]! ||
      Number(b.official) - Number(a.official) ||
      (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
  return candidates[0] ?? null;
}

export class TmdbClient {
  constructor(private readonly apiKey: string) {}

  private async get<T>(path: string, params: Record<string, string | number> = {}, attempt = 1): Promise<T> {
    const url = new URL(API + path);
    url.searchParams.set("api_key", this.apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 429 && attempt <= 4) {
      // Respect TMDB's rate limit with a short back-off.
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return this.get(path, params, attempt + 1);
    }
    if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
    return (await res.json()) as T;
  }

  discover(params: Record<string, string | number>) {
    return this.get<{ results: TmdbListMovie[]; total_pages: number }>("/discover/movie", {
      include_adult: "false",
      ...params,
    });
  }

  nowPlaying(region: string) {
    return this.get<{ results: TmdbListMovie[] }>("/movie/now_playing", { region });
  }

  search(query: string, year?: number) {
    return this.get<{ results: TmdbListMovie[] }>("/search/movie", { query, ...(year ? { year } : {}) });
  }

  movie(id: number) {
    return this.get<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: "credits,watch/providers,videos" });
  }

  person(id: number) {
    return this.get<TmdbPerson>(`/person/${id}`, { append_to_response: "external_ids,movie_credits" });
  }
}

export function tmdbImage(path: string | null | undefined, size: "w92" | "w185" | "w342" | "w500" | "w780" | "h632" = "w500") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

/** Run async work over a list with bounded concurrency. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}
