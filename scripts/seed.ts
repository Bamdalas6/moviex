import { eq, sql } from "drizzle-orm";
import { AVATAR_COLORS } from "../src/lib/constants";
import { slugify } from "../src/lib/utils";
import { hashPassword } from "../src/server/auth/password";
import { CINEMA_BRANCHES } from "../src/server/db/cinema-data";
import { importFromTmdb } from "../src/server/tmdb/import";
import { client, db, schema } from "./db";

/**
 * Seeds a realistic dataset: the films, people and reviews from the Watch Nollywood
 * design, plus a crowd of synthetic raters so averages and distributions look
 * like a live product. Deterministic (seeded PRNG) so every reset matches.
 */

const PASSWORD = process.env.SEED_PASSWORD || "marquee-demo-2026";
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261120);
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)] as T;
const ago = (days: number) => new Date(now - days * DAY - Math.floor(rand() * 3_600_000));

/** Draw a 1–5 score whose mean lands near `target`. */
function scoreNear(target: number) {
  const v = target + (rand() + rand() + rand() - 1.5) * 1.4;
  return Math.min(5, Math.max(1, Math.round(v)));
}

type SeedFilm = {
  key: string;
  title: string;
  year: number;
  genres: string[];
  director: string;
  cast: string[];
  synopsis: string;
  gradient: string;
  target: number;
  crowd: number;
  runtime?: number;
  language?: string;
  industry?: string;
  platform?: string;
  badge?: string;
  boxOffice?: number;
  status?: "published" | "pending";
  uploader?: string;
};

const FILMS: SeedFilm[] = [
  {
    key: "bts",
    title: "Behind the Scenes",
    year: 2025,
    genres: ["Drama", "Family"],
    director: "Funke Akindele",
    cast: ["Funke Akindele", "Tobi Bakre", "Iyabo Ojo", "Uzor Arukwe"],
    synopsis:
      "A family drama that pulls back the curtain on the “rich aunty” everyone depends on, and what that role really costs her.",
    gradient: "linear-gradient(160deg, #F7B733 0%, #E2531F 55%, #6B1A12 100%)",
    target: 4.5,
    crowd: 46,
    runtime: 143,
    badge: "Box office record",
    boxOffice: 1,
    uploader: "lagos.reels",
  },
  {
    key: "gingerrr",
    title: "Gingerrr",
    year: 2025,
    genres: ["Action", "Comedy"],
    director: "Yemi Morafa",
    cast: [],
    synopsis: "Four friends with nothing to lose plan a daring heist in this loud, high-energy action comedy.",
    gradient: "linear-gradient(160deg, #FF6A3D 0%, #C2185B 60%, #3B0A2A 100%)",
    target: 3.9,
    crowd: 26,
    platform: "Netflix",
    boxOffice: 5,
  },
  {
    key: "judah",
    title: "A Tribe Called Judah",
    year: 2023,
    genres: ["Comedy", "Drama"],
    director: "Funke Akindele",
    cast: ["Funke Akindele", "Timini Egbuson", "Jide Kene Achufusi", "Uzee Usman"],
    synopsis:
      "A single mother and her five very different sons hatch a desperate plan when she needs money for medical treatment.",
    gradient: "linear-gradient(160deg, #3DDC97 0%, #138A5E 50%, #0B3B2C 100%)",
    target: 4.6,
    crowd: 52,
    platform: "Prime Video",
    boxOffice: 2,
    uploader: "kemi.frames",
  },
  {
    key: "jenifa",
    title: "Everybody Loves Jenifa",
    year: 2024,
    genres: ["Comedy"],
    director: "Funke Akindele",
    cast: ["Funke Akindele"],
    synopsis: "Lagos' favourite loudmouth returns for a festive comedy packed with neighbourhood chaos.",
    gradient: "linear-gradient(160deg, #FF9EC4 0%, #E0457B 55%, #5A1033 100%)",
    target: 4.3,
    crowd: 40,
    boxOffice: 3,
  },
  {
    key: "gangs",
    title: "Gangs of Lagos",
    year: 2023,
    genres: ["Crime", "Thriller"],
    director: "Jadesola Osiberu",
    cast: ["Tobi Bakre", "Adesua Etomi-Wellington", "Chike"],
    synopsis: "Three friends who grew up on the streets of Isale Eko are pulled back into the gang life they tried to leave.",
    gradient: "linear-gradient(160deg, #5B6CFF 0%, #1E2A8C 55%, #0A0F33 100%)",
    target: 4.1,
    crowd: 34,
    platform: "Prime Video",
    uploader: "kemi.frames",
  },
  {
    key: "kob",
    title: "King of Boys",
    year: 2018,
    genres: ["Crime", "Drama"],
    director: "Kemi Adetiba",
    cast: ["Sola Sobowale", "Adesua Etomi-Wellington", "Toni Tones", "Illbliss"],
    synopsis:
      "A powerful Lagos businesswoman with political ambitions fights to hold on to everything she has built when her empire is threatened.",
    gradient: "linear-gradient(160deg, #9AA4B8 0%, #3B4256 50%, #0E1018 100%)",
    target: 4.8,
    crowd: 58,
    platform: "Netflix",
    uploader: "kemi.frames",
  },
  {
    key: "aniku",
    title: "Anikulapo",
    year: 2022,
    genres: ["Fantasy", "Epic"],
    director: "Kunle Afolayan",
    cast: ["Kunle Remi", "Bimbo Ademoye", "Sola Sobowale"],
    synopsis:
      "A travelling cloth weaver in the Oyo Empire is given a second chance at life, and learns the price of the power that came with it.",
    gradient: "linear-gradient(160deg, #E9C46A 0%, #B5651D 50%, #3A1E0A 100%)",
    target: 4.2,
    crowd: 36,
    language: "Yoruba",
    platform: "Netflix",
    uploader: "kemi.frames",
  },
  {
    key: "jagun",
    title: "Jagun Jagun",
    year: 2023,
    genres: ["Epic", "Action"],
    director: "Adebayo Tijani",
    cast: ["Femi Adebayo", "Lateef Adedimeji", "Odunlade Adekola"],
    synopsis: "An ambitious young man trains under a feared warlord, and discovers what it really costs to become a warrior.",
    gradient: "linear-gradient(160deg, #D64545 0%, #7A1414 55%, #1F0505 100%)",
    target: 4.0,
    crowd: 30,
    language: "Yoruba",
    platform: "Netflix",
  },
  {
    key: "buka",
    title: "Battle on Buka Street",
    year: 2022,
    genres: ["Comedy", "Family"],
    director: "Funke Akindele",
    cast: ["Funke Akindele", "Mercy Johnson"],
    synopsis: "Two half-sisters who run rival food businesses take their lifelong feud to the streets.",
    gradient: "linear-gradient(160deg, #FFD15C 0%, #E08A1E 55%, #4A2606 100%)",
    target: 4.2,
    crowd: 28,
    boxOffice: 4,
  },
  {
    key: "iyalode",
    title: "Iyalode",
    year: 2026,
    genres: ["Drama", "Epic"],
    director: "",
    cast: [],
    synopsis: "Submitted by a community member and waiting for moderation.",
    gradient: "linear-gradient(160deg, #B388FF 0%, #6A3FC9 55%, #22104A 100%)",
    target: 0,
    crowd: 0,
    language: "Yoruba",
    status: "pending",
    uploader: "kemi.frames",
  },
];

type SeedUser = { username: string; name: string; email: string; bio?: string; location?: string; color: string; genres?: string[]; role?: "admin" };

const PEOPLE: SeedUser[] = [
  {
    username: "kemi.frames",
    name: "Kemi Okafor",
    email: "kemi@marquee.test",
    bio: "Nollywood fan since the VCD days. I mostly review comedies and crime dramas.",
    location: "Lagos, Nigeria",
    color: "#FFB020",
    genres: ["Comedy", "Drama", "Crime", "Epic"],
  },
  { username: "admin", name: "Watch Nollywood Moderation", email: "admin@marquee.test", color: "#3B4256", role: "admin" },
  { username: "amaka.watches", name: "Amaka O.", email: "amaka@marquee.test", color: "#E85A8C", location: "Lekki, Lagos" },
  { username: "dele.f", name: "Dele F.", email: "dele@marquee.test", color: "#13A574" },
  { username: "nneka.b", name: "Nneka B.", email: "nneka@marquee.test", color: "#FFB020" },
  { username: "tunde.reels", name: "Tunde B.", email: "tunde@marquee.test", color: "#3B4256" },
  { username: "zee.cinema", name: "Zainab K.", email: "zainab@marquee.test", color: "#FFB020", location: "Kano, Nigeria" },
  { username: "chidi.frames", name: "Chidi E.", email: "chidi@marquee.test", color: "#B5651D" },
  { username: "ife.on.film", name: "Ife A.", email: "ife@marquee.test", color: "#5B6CFF" },
  { username: "lagos.reels", name: "Lagos Reels", email: "reels@marquee.test", color: "#13A574", bio: "Posters, premieres and press kits." },
];

type SeedReview = { by: string; film: string; score: number; days: number; headline?: string; body: string; spoiler?: boolean; helpful: number };

const REVIEWS: SeedReview[] = [
  { by: "amaka.watches", film: "bts", score: 5, days: 0.1, helpful: 98, headline: "A family story every Nigerian will recognise", body: "Watched it with my whole family in Lekki and we all saw someone we know in it. Funny, emotional and very Nigerian." },
  { by: "dele.f", film: "bts", score: 4, days: 4, helpful: 41, body: "Strong cast and a story that hits home. It runs long, but the performances carry it." },
  { by: "nneka.b", film: "bts", score: 4, days: 7, helpful: 77, spoiler: true, body: "The last act completely changes how you see the family. I did not see that ending coming at all." },
  { by: "tunde.reels", film: "kob", score: 5, days: 0.3, helpful: 211, headline: "Still the crown jewel of Nollywood crime", body: "Rewatched it this weekend and it holds up. Sola Sobowale owns every scene she is in." },
  { by: "zee.cinema", film: "gingerrr", score: 3, days: 1, helpful: 44, headline: "Big fun, busy plot", body: "The four leads have great chemistry and the heist set pieces are a blast, but there is a lot going on in the story." },
  { by: "chidi.frames", film: "aniku", score: 4, days: 2, helpful: 87, spoiler: true, headline: "The ending stayed with me", body: "Watching Saro lose the very power that made him is brutal. Pride really does come before the fall here." },
  { by: "ife.on.film", film: "gangs", score: 4, days: 3, helpful: 63, headline: "Gritty and gorgeous", body: "Some of the best-looking frames in recent Nollywood. The second half loses a bit of steam, but the world-building is excellent." },
  { by: "kemi.frames", film: "judah", score: 5, days: 14, helpful: 124, headline: "Funny and heartfelt", body: "Funny and heartfelt at the same time. Every Lagos family will recognise themselves." },
  { by: "kemi.frames", film: "kob", score: 5, days: 32, helpful: 302, headline: "The benchmark", body: "Still the benchmark for Nollywood crime drama. Sola Sobowale is unforgettable." },
  { by: "kemi.frames", film: "aniku", score: 4, days: 61, helpful: 57, headline: "Gorgeous folklore", body: "Gorgeous to look at, with a story rooted in Yoruba folklore." },
  { by: "amaka.watches", film: "jenifa", score: 4, days: 5, helpful: 33, headline: "Pure Christmas chaos", body: "Exactly what you want from Jenifa: loud, silly and full of heart. My aunties laughed the whole way through." },
  { by: "tunde.reels", film: "jagun", score: 5, days: 9, helpful: 72, headline: "Epic in every sense", body: "The fight choreography and costumes are on another level for a Yoruba epic. Femi Adebayo is commanding." },
];

/** Kemi's score-only ratings, which feed "Waiting for your review". */
const KEMI_RATED = [
  { film: "gingerrr", score: 4, days: 0.08 },
  { film: "jagun", score: 5, days: 6 },
  { film: "jenifa", score: 4, days: 10 },
];

async function main() {
  console.log("Seeding database …");
  const t = schema;

  // Children first so foreign keys never block the wipe.
  for (const table of [
    t.reviewReports,
    t.helpfulVotes,
    t.watchlist,
    t.follows,
    t.ratings,
    t.filmGenres,
    t.filmProviders,
    t.films,
    t.cinemas,
    t.sessions,
    t.users,
  ]) {
    await db.delete(table);
  }

  const passwordHash = await hashPassword(PASSWORD);

  const userIds = new Map<string, string>();
  for (const p of PEOPLE) {
    const [row] = await db
      .insert(t.users)
      .values({
        name: p.name,
        username: p.username,
        email: p.email,
        passwordHash,
        bio: p.bio ?? null,
        location: p.location ?? null,
        avatarColor: p.color,
        favoriteGenres: p.genres ?? [],
        role: p.role ?? "member",
        createdAt: new Date(Date.UTC(2024, 2, 4)),
      })
      .returning({ id: t.users.id });
    userIds.set(p.username, row!.id);
  }

  const crowd: string[] = [];
  const crowdRows = Array.from({ length: 60 }, (_, i) => ({
    name: `Film Fan ${i + 1}`,
    username: `fan${String(i + 1).padStart(2, "0")}`,
    email: `fan${i + 1}@marquee.test`,
    passwordHash,
    avatarColor: pick(AVATAR_COLORS),
  }));
  for (const row of await db.insert(t.users).values(crowdRows).returning({ id: t.users.id })) crowd.push(row.id);

  // Real films, posters and streaming data from TMDB when a key is configured.
  // The hand-written films above are passed as "curated" so they are matched
  // (and get real posters) rather than duplicated.
  const tmdbKey = process.env.TMDB_API_KEY;
  const imported = tmdbKey
    ? await importFromTmdb(db, {
        apiKey: tmdbKey,
        log: console.log,
        curated: FILMS.filter((f) => f.status !== "pending").map((f) => ({
          title: f.title,
          year: f.year,
          industry: f.industry ?? "Nollywood",
          badge: f.badge ?? null,
          boxOfficeRank: f.boxOffice ?? null,
        })),
      })
    : [];
  if (!tmdbKey) console.log("TMDB_API_KEY not set — seeding the built-in films only (no real posters).");

  const filmIds = new Map<string, string>();
  for (const f of FILMS) {
    const slug = slugify(`${f.title}-${f.year}`);
    const [match] = await db.select({ id: t.films.id, platform: t.films.platform }).from(t.films).where(eq(t.films.slug, slug));
    if (match) {
      // Imported from TMDB: keep its data, add the seed's community details.
      await db
        .update(t.films)
        .set({
          uploadedById: f.uploader ? userIds.get(f.uploader) : null,
          platform: match.platform ?? f.platform ?? null,
          createdAt: ago(120),
        })
        .where(eq(t.films.id, match.id));
      filmIds.set(f.key, match.id);
      continue;
    }
    const [row] = await db
      .insert(t.films)
      .values({
        slug,
        title: f.title,
        year: f.year,
        runtimeMinutes: f.runtime ?? null,
        synopsis: f.synopsis,
        director: f.director || null,
        cast: f.cast,
        industry: f.industry ?? "Nollywood",
        language: f.language ?? "English",
        platform: f.platform ?? null,
        badge: f.badge ?? null,
        boxOfficeRank: f.boxOffice ?? null,
        posterGradient: f.gradient,
        status: f.status ?? "published",
        uploadedById: f.uploader ? userIds.get(f.uploader) : null,
        publishedAt: f.status === "pending" ? null : ago(90),
        createdAt: f.status === "pending" ? ago(1) : ago(120),
      })
      .returning({ id: t.films.id });
    filmIds.set(f.key, row!.id);
    await db.insert(t.filmGenres).values(f.genres.map((genre) => ({ filmId: row!.id, genre })));
  }

  // Written reviews.
  const reviewIds: { id: string; helpful: number; by: string }[] = [];
  for (const r of REVIEWS) {
    const at = ago(r.days);
    const [row] = await db
      .insert(t.ratings)
      .values({
        userId: userIds.get(r.by)!,
        filmId: filmIds.get(r.film)!,
        score: r.score,
        headline: r.headline ?? null,
        body: r.body,
        spoiler: r.spoiler ?? false,
        createdAt: at,
        updatedAt: at,
      })
      .returning({ id: t.ratings.id });
    reviewIds.push({ id: row!.id, helpful: r.helpful, by: r.by });
  }

  for (const r of KEMI_RATED) {
    const at = ago(r.days);
    await db.insert(t.ratings).values({
      userId: userIds.get("kemi.frames")!,
      filmId: filmIds.get(r.film)!,
      score: r.score,
      createdAt: at,
      updatedAt: at,
    });
  }

  // Crowd ratings, spread over the last ~60 days with a bias towards recent activity.
  const crowdRatings: (typeof t.ratings.$inferInsert)[] = [];
  for (const f of FILMS) {
    if (!f.crowd) continue;
    const raters = [...crowd].sort(() => rand() - 0.5).slice(0, f.crowd);
    for (const userId of raters) {
      const at = ago(Math.pow(rand(), 2) * 60);
      crowdRatings.push({ userId, filmId: filmIds.get(f.key)!, score: scoreNear(f.target), createdAt: at, updatedAt: at });
    }
  }
  // Imported films get demo ratings centred on their real TMDB audience score
  // (TMDB is out of 10, Watch Nollywood out of 5), more raters for better-known films.
  const curatedIds = new Set(filmIds.values());
  for (const film of imported) {
    if (curatedIds.has(film.id)) continue;
    const target = film.tmdbRating ? Math.min(4.7, Math.max(2.6, film.tmdbRating / 2)) : 3.5;
    const count = Math.min(36, Math.max(4, Math.round(Math.log2(film.tmdbVotes + 1) * 4)));
    for (const userId of [...crowd].sort(() => rand() - 0.5).slice(0, count)) {
      const at = ago(Math.pow(rand(), 2) * 120);
      crowdRatings.push({ userId, filmId: film.id, score: scoreNear(target), createdAt: at, updatedAt: at });
    }
  }
  for (let i = 0; i < crowdRatings.length; i += 200) {
    await db.insert(t.ratings).values(crowdRatings.slice(i, i + 200));
  }

  await db.insert(t.cinemas).values(CINEMA_BRANCHES).onConflictDoNothing();

  // Helpful votes, capped by how many distinct voters we have.
  // The demo account starts with no votes so the Helpful button's "on" state is meaningful.
  const voters = [...crowd, ...[...userIds.entries()].filter(([u]) => u !== "kemi.frames").map(([, id]) => id)];
  const votes: (typeof t.helpfulVotes.$inferInsert)[] = [];
  for (const r of reviewIds) {
    const authorId = userIds.get(r.by);
    const n = Math.min(r.helpful, voters.length - 1);
    for (const userId of voters.filter((v) => v !== authorId).slice(0, n)) votes.push({ userId, ratingId: r.id });
  }
  for (let i = 0; i < votes.length; i += 300) await db.insert(t.helpfulVotes).values(votes.slice(i, i + 300));

  // Social graph and watchlist for the demo account.
  const kemi = userIds.get("kemi.frames")!;
  await db.insert(t.follows).values([
    { followerId: kemi, followingId: userIds.get("lagos.reels")!, createdAt: ago(21) },
    { followerId: kemi, followingId: userIds.get("tunde.reels")!, createdAt: ago(30) },
    { followerId: kemi, followingId: userIds.get("amaka.watches")!, createdAt: ago(40) },
    ...crowd.slice(0, 24).map((id) => ({ followerId: id, followingId: kemi, createdAt: ago(rand() * 90) })),
  ]);
  await db.insert(t.watchlist).values([
    { userId: kemi, filmId: filmIds.get("buka")!, createdAt: ago(3) },
  ]);

  const [{ n: filmCount }] = await db.select({ n: sql<number>`count(*)` }).from(t.films) as [{ n: number }];
  console.log(
    `Seeded ${PEOPLE.length + crowd.length} users, ${filmCount} films, ${REVIEWS.length + KEMI_RATED.length + crowdRatings.length} ratings, ${CINEMA_BRANCHES.length} cinemas.`,
  );
  console.log(`Demo login: kemi@marquee.test / ${PASSWORD}   ·   Admin: admin@marquee.test / ${PASSWORD}`);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
