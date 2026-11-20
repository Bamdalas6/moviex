import { z } from "zod";
import {
  GENRES,
  INDUSTRIES,
  LANGUAGES,
  MAX_GENRES_PER_FILM,
  REVIEW_BODY_MAX,
  REVIEW_HEADLINE_MAX,
} from "./constants";
import { parseRuntime } from "./utils";

/** Checkbox/toggle values arrive from FormData as "on" | "true" | null. */
const formBoolean = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.null(), z.undefined()])
  .transform((v) => v === "on" || v === "true");

const trimmed = (max: number) => z.string().trim().max(max);

/** Normalise first, then validate — otherwise "you@x.com " (trailing space from autofill) fails. */
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email").max(254));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  name: trimmed(60).min(2, "Enter your name"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "At least 3 characters")
    .max(24, "At most 24 characters")
    .regex(/^[a-z0-9._]+$/, "Use letters, numbers, dots or underscores"),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128)
    .regex(/[^A-Za-z]/, "Include a number or symbol"),
  genres: z.array(z.enum(GENRES)).max(GENRES.length).default([]),
  terms: z.literal("on", { error: "Please accept the terms to continue" }),
});

export const reviewSchema = z
  .object({
    filmId: z.uuid(),
    score: z.coerce.number().int().min(1, "Pick a star rating").max(5),
    headline: trimmed(REVIEW_HEADLINE_MAX).optional().default(""),
    body: trimmed(REVIEW_BODY_MAX).optional().default(""),
    spoiler: formBoolean,
  })
  .refine((v) => !v.headline || v.body, {
    path: ["body"],
    message: "Add a few words to go with your headline",
  });

export const quickRatingSchema = z.object({
  filmId: z.uuid(),
  score: z.coerce.number().int().min(1).max(5),
});

export const uploadFilmSchema = z.object({
  title: trimmed(120).min(1, "Enter the film's title"),
  // Empty input must read as "missing", not coerce to 0 ("too early").
  year: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce
      .number({ error: "Enter the release year" })
      .int("Enter a whole year, like 2024")
      .min(1950, "Year looks too early")
      .max(new Date().getFullYear() + 2, "Year looks too far ahead"),
  ),
  runtime: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const minutes = parseRuntime(v);
      if (minutes === null || minutes < 1 || minutes > 600) {
        ctx.addIssue({ code: "custom", message: "Use a format like 1h 50m" });
        return z.NEVER;
      }
      return minutes;
    }),
  genres: z
    .array(z.enum(GENRES))
    .min(1, "Pick at least one genre")
    .max(MAX_GENRES_PER_FILM, `Pick up to ${MAX_GENRES_PER_FILM} genres`),
  language: z.enum(LANGUAGES, { error: "Pick a language" }),
  industry: z.enum(INDUSTRIES).default("Nollywood"),
  director: trimmed(80).optional().default(""),
  synopsis: trimmed(600).optional().default(""),
  allowReviews: formBoolean,
  posterSpoiler: formBoolean,
  rights: z.literal("on", { error: "Confirm you have the rights to share this artwork" }),
});

export const profileSchema = z.object({
  name: trimmed(60).min(2, "Enter your name"),
  bio: trimmed(200).optional().default(""),
  location: trimmed(60).optional().default(""),
  genres: z.array(z.enum(GENRES)).max(GENRES.length).default([]),
});

export const discoverSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  genre: z.enum(GENRES).optional().catch(undefined),
  industry: z.enum(INDUSTRIES).optional().catch(undefined),
  language: z.enum(LANGUAGES).optional().catch(undefined),
});

export const reviewFeedSchema = z.object({
  feed: z.enum(["for-you", "following", "top", "latest"]).catch("for-you"),
  stars: z.enum(["all", "5", "4", "3-"]).catch("all"),
});

export const profileTabSchema = z.enum(["uploads", "reviews", "watchlist", "activity"]).catch("uploads");

/** Field-level errors in the shape forms render. */
export type FieldErrors = Partial<Record<string, string[]>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
