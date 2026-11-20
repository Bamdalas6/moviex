import { describe, expect, it } from "vitest";
import { socialLinks, youtubeUrlFor } from "@/lib/socials";
import { normalizeChannelUrl, youtubeChannelUrl } from "@/server/youtube-oembed";

describe("socialLinks", () => {
  it("builds public profile URLs in a stable order", () => {
    const links = socialLinks({ instagram: "funkejenifaakindele", x: "@funkeakindele", imdbId: "nm2481000", youtube: "UCjcFNZE51DmSrGYBqixs0Ug" });
    expect(links.map((l) => l.network)).toEqual(["youtube", "instagram", "x", "imdb"]);
    expect(links[0]!.url).toBe("https://www.youtube.com/channel/UCjcFNZE51DmSrGYBqixs0Ug");
    expect(links[1]!.url).toBe("https://www.instagram.com/funkejenifaakindele/");
    expect(links[2]).toMatchObject({ url: "https://x.com/funkeakindele", detail: "@funkeakindele" });
  });

  it("drops values that aren't usable handles or safe URLs", () => {
    const links = socialLinks({
      facebook: "Kunle Afolayan",
      instagram: "a/b",
      website: "javascript:alert(1)",
      imdbId: "tt123",
      wikipediaUrl: "https://evil.example/wiki",
    });
    expect(links).toEqual([]);
  });

  it("labels websites by host", () => {
    expect(socialLinks({ website: "http://www.omotola.tv/" })[0]).toMatchObject({ network: "website", detail: "omotola.tv" });
  });
});

describe("YouTube URLs", () => {
  it("accepts channel ids, handles and youtube.com URLs only", () => {
    expect(youtubeUrlFor("@RuthKadiri247")).toBe("https://www.youtube.com/@RuthKadiri247");
    expect(youtubeUrlFor("https://evil.example/@x")).toBeNull();
    expect(youtubeChannelUrl("UCjcFNZE51DmSrGYBqixs0Ug")).toBe("https://www.youtube.com/channel/UCjcFNZE51DmSrGYBqixs0Ug");
    expect(youtubeChannelUrl("@MauriceSamTV")).toBe("https://www.youtube.com/@mauricesamtv");
  });

  it("normalises channel URLs so the same channel matches across sources", () => {
    expect(normalizeChannelUrl("http://youtube.com/@ApataTVPlus/")).toBe("https://www.youtube.com/@apatatvplus");
    expect(normalizeChannelUrl("https://www.youtube.com/channel/UC83tx3zGcvQ_rXzsZigTnEA")).toBe(
      "https://www.youtube.com/channel/UC83tx3zGcvQ_rXzsZigTnEA",
    );
    expect(normalizeChannelUrl("https://example.com/@x")).toBeNull();
    expect(normalizeChannelUrl("not a url")).toBeNull();
  });
});
