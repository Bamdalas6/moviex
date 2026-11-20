/**
 * DTOs shared between server queries and client components. Server code maps
 * DB rows into these shapes so components never depend on the schema directly.
 */

export type Poster = {
  title: string;
  posterUrl: string | null;
  posterGradient: string;
  posterSpoiler: boolean;
};

export type FilmSummary = Poster & {
  id: string;
  slug: string;
  year: number;
  genres: string[];
  director: string | null;
  industry: string;
  language: string;
  platform: string | null;
  badge: string | null;
  runtimeMinutes: number | null;
  synopsis: string;
  nowPlaying: boolean;
  /** YouTube video id of the official trailer, when TMDB lists one. */
  trailerKey: string | null;
  trailerName: string | null;
  avgRating: number | null;
  ratingCount: number;
  reviewCount: number;
};

export type FilmDetail = FilmSummary & {
  cast: string[];
  status: "pending" | "published" | "rejected";
  allowReviews: boolean;
  createdAt: Date;
  uploader: { username: string; name: string; avatarColor: string } | null;
  distribution: { score: number; count: number; percent: number }[];
  watchLink: string | null;
  providers: { kind: "stream" | "rent" | "buy"; name: string; logoUrl: string | null }[];
  viewer: { score: number | null; hasReview: boolean; saved: boolean } | null;
};

export type Author = {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
};

export type ReviewItem = {
  id: string;
  score: number;
  headline: string | null;
  body: string;
  spoiler: boolean;
  createdAt: Date;
  helpfulCount: number;
  viewerVoted: boolean;
  viewerReported: boolean;
  viewerFollows: boolean;
  isOwn: boolean;
  author: Author;
  film: Pick<FilmSummary, "id" | "slug" | "title" | "year" | "posterUrl" | "posterGradient" | "posterSpoiler"> & {
    genre: string | null;
  };
};

export type CinemaBranch = {
  id: string;
  chain: string;
  branch: string;
  city: string;
  country: string;
  website: string | null;
};

export type ActionState<TField extends string = string> = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<TField, string[]>>;
  /** Echo of submitted values so forms keep input after a failed submit. */
  values?: Record<string, string | string[]>;
};
