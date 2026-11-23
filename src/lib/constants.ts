export const APP_NAME = "Watch Nollywood";

export const GENRES = [
  "Drama",
  "Comedy",
  "Action",
  "Crime",
  "Thriller",
  "Romance",
  "Epic",
  "Family",
  "Fantasy",
  "Horror",
  "Documentary",
] as const;

/** Nollywood's languages (Hausa-language films are Kannywood, which Watch Nollywood doesn't include). */
export const LANGUAGES = ["English", "Yoruba", "Igbo", "Pidgin"] as const;

/** Watch Nollywood is Nollywood only (no Kannywood or other industries). */
export const INDUSTRIES = ["Nollywood"] as const;

export const MAX_GENRES_PER_FILM = 3;
export const REVIEW_BODY_MAX = 500;
export const REVIEW_HEADLINE_MAX = 80;
export const POSTER_MAX_BYTES = 5 * 1024 * 1024;
export const POSTER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "marquee_session";
export const THEME_COOKIE = "marquee_theme";

export type Genre = (typeof GENRES)[number];
export type Language = (typeof LANGUAGES)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type ThemePreference = "system" | "light" | "dark";

/** Gradients used for genre tiles and as poster fallbacks. */
export const GENRE_GRADIENTS: Record<string, string> = {
  Drama: "linear-gradient(135deg, #F7B733 0%, #E2531F 100%)",
  Comedy: "linear-gradient(135deg, #FF9EC4 0%, #E0457B 100%)",
  Crime: "linear-gradient(135deg, #5B6CFF 0%, #1E2A8C 100%)",
  Epic: "linear-gradient(135deg, #D64545 0%, #7A1414 100%)",
  Romance: "linear-gradient(135deg, #B388FF 0%, #6A3FC9 100%)",
  Thriller: "linear-gradient(135deg, #3DDC97 0%, #0F6B48 100%)",
  Action: "linear-gradient(135deg, #FF6A3D 0%, #C2185B 100%)",
  Family: "linear-gradient(135deg, #FFD15C 0%, #E08A1E 100%)",
  Fantasy: "linear-gradient(135deg, #E9C46A 0%, #B5651D 100%)",
  Horror: "linear-gradient(135deg, #4A4A52 0%, #121214 100%)",
  Documentary: "linear-gradient(135deg, #13A574 0%, #0B3B2C 100%)",
};

export const POSTER_GRADIENTS = [
  "linear-gradient(160deg, #F7B733 0%, #E2531F 55%, #6B1A12 100%)",
  "linear-gradient(160deg, #FF6A3D 0%, #C2185B 60%, #3B0A2A 100%)",
  "linear-gradient(160deg, #3DDC97 0%, #138A5E 50%, #0B3B2C 100%)",
  "linear-gradient(160deg, #FF9EC4 0%, #E0457B 55%, #5A1033 100%)",
  "linear-gradient(160deg, #5B6CFF 0%, #1E2A8C 55%, #0A0F33 100%)",
  "linear-gradient(160deg, #9AA4B8 0%, #3B4256 50%, #0E1018 100%)",
  "linear-gradient(160deg, #E9C46A 0%, #B5651D 50%, #3A1E0A 100%)",
  "linear-gradient(160deg, #D64545 0%, #7A1414 55%, #1F0505 100%)",
  "linear-gradient(160deg, #B388FF 0%, #6A3FC9 55%, #22104A 100%)",
  "linear-gradient(160deg, #FFD15C 0%, #E08A1E 55%, #4A2606 100%)",
] as const;

export const AVATAR_COLORS = ["#FFB020", "#E85A8C", "#13A574", "#5B6CFF", "#B5651D", "#3B4256", "#C2185B"] as const;
