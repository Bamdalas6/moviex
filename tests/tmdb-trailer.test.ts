import { describe, expect, it } from "vitest";
import { pickTrailer, type TmdbVideo } from "@/server/tmdb/client";

const video = (over: Partial<TmdbVideo>): TmdbVideo => ({
  key: "k",
  name: "Video",
  site: "YouTube",
  type: "Trailer",
  official: true,
  published_at: "2024-01-01T00:00:00.000Z",
  ...over,
});

describe("pickTrailer", () => {
  it("returns null when there is nothing playable", () => {
    expect(pickTrailer(undefined)).toBeNull();
    expect(pickTrailer([video({ site: "Vimeo" }), video({ type: "Behind the Scenes" }), video({ key: "" })])).toBeNull();
  });

  it("prefers trailers over teasers, clips and featurettes", () => {
    const picked = pickTrailer([
      video({ key: "clip", type: "Clip" }),
      video({ key: "teaser", type: "Teaser" }),
      video({ key: "trailer", type: "Trailer", official: false }),
    ]);
    expect(picked?.key).toBe("trailer");
  });

  it("prefers official videos, then the newest", () => {
    const picked = pickTrailer([
      video({ key: "fan", official: false, published_at: "2025-06-01T00:00:00.000Z" }),
      video({ key: "old", published_at: "2023-01-01T00:00:00.000Z" }),
      video({ key: "new", published_at: "2024-05-01T00:00:00.000Z" }),
    ]);
    expect(picked?.key).toBe("new");
  });
});
