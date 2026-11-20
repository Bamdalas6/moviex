import type { CuratedFilm } from "./import";

/**
 * Films the catalogue must always include, whatever TMDB's popularity lists say.
 * Some landmark titles are missed by "most voted" discovery (e.g. King of Boys is
 * listed on TMDB as a US co-production), and the box-office chart needs ranks
 * TMDB doesn't provide. Used by `npm run db:import-tmdb` (live site + daily refresh).
 */
export const FEATURED_FILMS: CuratedFilm[] = [
  { title: "Behind the Scenes", year: 2025, industry: "Nollywood", badge: "Box office record", boxOfficeRank: 1 },
  { title: "A Tribe Called Judah", year: 2023, industry: "Nollywood", badge: null, boxOfficeRank: 2 },
  { title: "Everybody Loves Jenifa", year: 2024, industry: "Nollywood", badge: null, boxOfficeRank: 3 },
  { title: "Battle on Buka Street", year: 2022, industry: "Nollywood", badge: null, boxOfficeRank: 4 },
  { title: "Gingerrr", year: 2025, industry: "Nollywood", badge: null, boxOfficeRank: 5 },
  { title: "King of Boys", year: 2018, industry: "Nollywood" },
  { title: "Gangs of Lagos", year: 2023, industry: "Nollywood" },
  { title: "Anikulapo", year: 2022, industry: "Nollywood" },
  { title: "Jagun Jagun", year: 2023, industry: "Nollywood" },
  { title: "Azali", year: 2018, industry: "Ghana" },
  { title: "Nairobi Half Life", year: 2012, industry: "Kenya" },
];
