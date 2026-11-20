import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Data model
 * ----------
 * A "rating" is the single row a user owns per film. It always carries a score;
 * when it also carries a body it is shown as a review. This keeps "rated but
 * not yet reviewed" (the Reviews tab's "Waiting for your review") a plain query
 * instead of a second table that could drift out of sync.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    bio: text("bio"),
    location: text("location"),
    avatarColor: text("avatar_color").notNull().default("#FFB020"),
    role: text("role", { enum: ["member", "admin"] }).notNull().default("member"),
    favoriteGenres: text("favorite_genres", { mode: "json" }).$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username), uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the cookie token — the raw token never touches the database. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const films = sqliteTable(
  "films",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    year: integer("year").notNull(),
    runtimeMinutes: integer("runtime_minutes"),
    synopsis: text("synopsis").notNull().default(""),
    director: text("director"),
    cast: text("cast", { mode: "json" }).$type<string[]>().notNull().default([]),
    industry: text("industry").notNull().default("Nollywood"),
    language: text("language").notNull().default("English"),
    platform: text("platform"),
    badge: text("badge"),
    boxOfficeRank: integer("box_office_rank"),
    posterKey: text("poster_key"),
    /** The Movie Database: id plus image paths (served from image.tmdb.org). */
    tmdbId: integer("tmdb_id"),
    tmdbPosterPath: text("tmdb_poster_path"),
    tmdbBackdropPath: text("tmdb_backdrop_path"),
    tmdbRating: real("tmdb_rating"),
    tmdbVotes: integer("tmdb_votes"),
    releaseDate: text("release_date"),
    /** On TMDB's "now playing" list for Nigeria at the last import. */
    nowPlaying: integer("now_playing", { mode: "boolean" }).notNull().default(false),
    /** TMDB/JustWatch page listing every way to watch this film. */
    watchLink: text("watch_link"),
    /** Official YouTube trailer (video id) from TMDB's video list. */
    trailerKey: text("trailer_key"),
    trailerName: text("trailer_name"),
    posterGradient: text("poster_gradient").notNull(),
    posterSpoiler: integer("poster_spoiler", { mode: "boolean" }).notNull().default(false),
    allowReviews: integer("allow_reviews", { mode: "boolean" }).notNull().default(true),
    status: text("status", { enum: ["pending", "published", "rejected"] }).notNull().default("pending"),
    uploadedById: text("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("films_slug_idx").on(t.slug),
    uniqueIndex("films_tmdb_idx").on(t.tmdbId),
    index("films_status_idx").on(t.status),
    index("films_uploader_idx").on(t.uploadedById),
  ],
);

export const filmGenres = sqliteTable(
  "film_genres",
  {
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    genre: text("genre").notNull(),
  },
  (t) => [primaryKey({ columns: [t.filmId, t.genre] }), index("film_genres_genre_idx").on(t.genre)],
);

/** Streaming/rental availability in Nigeria, from TMDB's watch-provider data (JustWatch). */
export const filmProviders = sqliteTable(
  "film_providers",
  {
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    providerId: integer("provider_id").notNull(),
    kind: text("kind", { enum: ["stream", "rent", "buy"] }).notNull(),
    name: text("name").notNull(),
    logoPath: text("logo_path"),
    priority: integer("priority").notNull().default(100),
  },
  (t) => [primaryKey({ columns: [t.filmId, t.providerId, t.kind] })],
);

/** Cinema branches (chain + location). Showtimes live on each chain's own site. */
export const cinemas = sqliteTable(
  "cinemas",
  {
    id: id(),
    chain: text("chain").notNull(),
    branch: text("branch").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull().default("Nigeria"),
    website: text("website"),
  },
  (t) => [uniqueIndex("cinemas_chain_branch_idx").on(t.chain, t.branch)],
);

export const ratings = sqliteTable(
  "ratings",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    headline: text("headline"),
    body: text("body"),
    spoiler: integer("spoiler", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    uniqueIndex("ratings_user_film_idx").on(t.userId, t.filmId),
    index("ratings_film_idx").on(t.filmId),
    index("ratings_created_idx").on(t.createdAt),
  ],
);

export const helpfulVotes = sqliteTable(
  "helpful_votes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.ratingId] }), index("helpful_rating_idx").on(t.ratingId)],
);

export const reviewReports = sqliteTable(
  "review_reports",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
    reason: text("reason").notNull().default("inappropriate"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.ratingId] })],
);

export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] }), index("follows_following_idx").on(t.followingId)],
);

export const watchlist = sqliteTable(
  "watchlist",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.filmId] })],
);

// ---------------------------------------------------------------------------
// Relations (used by the relational query API)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  uploads: many(films),
}));

export const filmsRelations = relations(films, ({ one, many }) => ({
  uploader: one(users, { fields: [films.uploadedById], references: [users.id] }),
  genres: many(filmGenres),
  ratings: many(ratings),
}));

export const filmGenresRelations = relations(filmGenres, ({ one }) => ({
  film: one(films, { fields: [filmGenres.filmId], references: [films.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one, many }) => ({
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
  film: one(films, { fields: [ratings.filmId], references: [films.id] }),
  helpfulVotes: many(helpfulVotes),
}));

export const helpfulVotesRelations = relations(helpfulVotes, ({ one }) => ({
  rating: one(ratings, { fields: [helpfulVotes.ratingId], references: [ratings.id] }),
}));

export type User = typeof users.$inferSelect;
export type Film = typeof films.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
