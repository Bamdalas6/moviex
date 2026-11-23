import { describe, expect, it } from "vitest";
import { genderFromHeadline } from "@/server/tmdb/people";

describe("genderFromHeadline", () => {
  it("reads Wikidata descriptions", () => {
    expect(genderFromHeadline("Nigerian actress, film producer and director")).toBe(1);
    expect(genderFromHeadline("Nigerian actor")).toBe(2);
    expect(genderFromHeadline("Nigerian actor and businessman")).toBe(2);
  });

  it("stays unknown when the description doesn't say", () => {
    expect(genderFromHeadline("Nigerian film director")).toBe(0);
    expect(genderFromHeadline(null)).toBe(0);
    expect(genderFromHeadline("character actors' guild")).toBe(0);
  });
});
