import { describe, expect, it } from "vitest";
import { industryFor, mapGenres } from "@/server/tmdb/import";

const film = (origin: string[], production: string[], lang = "en") => ({
  original_language: lang,
  origin_country: origin,
  production_countries: production.map((iso_3166_1) => ({ iso_3166_1, name: iso_3166_1 })),
});

describe("industryFor", () => {
  it("classifies Nigerian films, with Hausa-language ones as Kannywood", () => {
    expect(industryFor(film(["NG"], ["NG"]))).toBe("Nollywood");
    expect(industryFor(film([], [], "yo"))).toBe("Nollywood");
    expect(industryFor(film(["NG"], [], "ha"))).toBe("Kannywood");
  });

  it("recognises other African industries", () => {
    expect(industryFor(film(["GH"], []))).toBe("Ghana");
    expect(industryFor(film([], ["KE"]))).toBe("Kenya");
    expect(industryFor(film(["ZA"], [], "zu"))).toBe("South Africa");
    expect(industryFor(film(["SN"], [], "fr"))).toBe("Francophone");
  });

  it("keeps Nigerian co-productions but not big international ones with a Nigerian part", () => {
    // TMDB often lists the US as origin for Nollywood films; the production country is what counts.
    expect(industryFor(film(["US"], ["NG"]))).toBe("Nollywood");
    expect(industryFor(film(["US"], ["DE", "NG", "ZA", "US"]))).toBe("Nollywood"); // e.g. Vagabond Queen of Lagos
    // ABCs of Death 2: an 11-country anthology with one Nigerian segment.
    expect(industryFor(film(["CA", "NZ", "US"], ["BR", "CA", "CU", "FR", "JP", "LT", "NZ", "NG", "PH", "ES", "US"]))).not.toBe("Nollywood");
    expect(industryFor(film(["US"], ["IT", "GB", "US", "DE", "NG"]))).not.toBe("Nollywood");
  });

  it("rejects non-African films (e.g. Hollywood titles on the Nigerian now-showing list)", () => {
    expect(industryFor(film(["US"], ["US"]))).toBeNull();
    expect(industryFor(film(["FR"], ["FR"], "fr"))).toBeNull();
  });
});

describe("mapGenres", () => {
  it("maps TMDB genres onto Marquee's, de-duplicated and capped at three", () => {
    expect(mapGenres(["History", "War", "Drama"])).toEqual(["Epic", "Drama"]);
    expect(mapGenres(["Adventure", "Action", "Comedy", "Crime", "Thriller"])).toEqual(["Action", "Comedy", "Crime"]);
    expect(mapGenres(["TV Movie"])).toEqual([]);
  });
});
