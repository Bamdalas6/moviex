import { describe, expect, it } from "vitest";
import { discoverSearchSchema, reviewSchema, signupSchema, uploadFilmSchema } from "@/lib/validation";

const filmId = "4f8b2a9e-3c1d-4e5f-8a7b-9c0d1e2f3a4b";

describe("signupSchema", () => {
  const valid = {
    name: "Kemi Okafor",
    username: "Kemi.Frames",
    email: "KEMI@example.com ",
    password: "lagos2026!",
    genres: ["Comedy"],
    terms: "on",
  };

  it("normalises username and email", () => {
    const result = signupSchema.parse(valid);
    expect(result.username).toBe("kemi.frames");
    expect(result.email).toBe("kemi@example.com");
  });

  it("requires a non-letter character in the password", () => {
    expect(signupSchema.safeParse({ ...valid, password: "onlyletters" }).success).toBe(false);
  });

  it("requires accepting the terms", () => {
    expect(signupSchema.safeParse({ ...valid, terms: undefined }).success).toBe(false);
  });

  it("rejects usernames with spaces or symbols", () => {
    expect(signupSchema.safeParse({ ...valid, username: "kemi frames" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, username: "kemi@frames" }).success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts a score-only rating", () => {
    const r = reviewSchema.parse({ filmId, score: "4", spoiler: null });
    expect(r).toMatchObject({ score: 4, body: "", spoiler: false });
  });

  it("needs a star rating", () => {
    expect(reviewSchema.safeParse({ filmId, score: "0" }).success).toBe(false);
  });

  it("does not allow a headline without a body", () => {
    const result = reviewSchema.safeParse({ filmId, score: 5, headline: "Wow", body: "" });
    expect(result.success).toBe(false);
  });

  it("parses the spoiler switch", () => {
    expect(reviewSchema.parse({ filmId, score: 3, body: "ok", spoiler: "on" }).spoiler).toBe(true);
  });
});

describe("uploadFilmSchema", () => {
  const valid = {
    title: "Iyalode",
    year: "2026",
    runtime: "1h 50m",
    genres: ["Drama"],
    language: "Yoruba",
    allowReviews: "on",
    posterSpoiler: null,
    rights: "on",
  };

  it("converts runtime to minutes", () => {
    expect(uploadFilmSchema.parse(valid).runtime).toBe(110);
  });

  it("caps genres at three", () => {
    const result = uploadFilmSchema.safeParse({ ...valid, genres: ["Drama", "Comedy", "Crime", "Epic"] });
    expect(result.success).toBe(false);
  });

  it("asks for a year when it is left empty", () => {
    const result = uploadFilmSchema.safeParse({ ...valid, year: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter the release year");
  });

  it("rejects unparseable runtimes", () => {
    expect(uploadFilmSchema.safeParse({ ...valid, runtime: "long" }).success).toBe(false);
  });
});

describe("discoverSearchSchema", () => {
  it("drops unknown filter values instead of failing the page", () => {
    expect(discoverSearchSchema.parse({ genre: "Musical", language: "Klingon", q: "judah" })).toEqual({
      q: "judah",
      genre: undefined,
      industry: undefined,
      language: undefined,
    });
  });
});
