import { describe, expect, it } from "vitest";
import { avatarFromHtml, commonsThumb, nameKey, photoFromIndex } from "@/server/tmdb/media";

describe("faces", () => {
  it("reads a channel's picture from its page and sizes it for avatars", () => {
    const html = '<head><meta property="og:image" content="https://yt3.googleusercontent.com/abc-DEF=s900-c-k-c0x00ffffff-no-rj"></head>';
    expect(avatarFromHtml(html)).toBe("https://yt3.googleusercontent.com/abc-DEF=s240-c-k-c0x00ffffff-no-rj");
    expect(avatarFromHtml('<meta property="og:image" content="https://evil.example/x.jpg">')).toBeNull();
  });

  it("turns a Commons file into a standard-size thumbnail URL", () => {
    // md5("Funke_Akindele.jpg") starts with "8c" → /8/8c/
    const url = commonsThumb("http://commons.wikimedia.org/wiki/Special:FilePath/Funke%20Akindele.jpg");
    expect(url).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/Funke_Akindele\.jpg\/330px-Funke_Akindele\.jpg$/);
    expect(commonsThumb("http://commons.wikimedia.org/wiki/Special:FilePath/Map.svg")).toBeNull();
  });

  it("matches names regardless of accents, case and hyphens", () => {
    expect(nameKey("Ọmọ́tọ́lá Jalade-Ekeinde")).toBe(nameKey("omotola jalade ekeinde"));
    const index = { byTmdb: new Map([[42, "a.jpg"]]), byName: new Map([[nameKey("Kunle Idowu"), "b.jpg"]]) };
    expect(photoFromIndex(index, 42, "Someone Else")).toBe("a.jpg");
    expect(photoFromIndex(index, 7, "KUNLE IDOWU")).toBe("b.jpg");
    expect(photoFromIndex(index, 7, "Nobody")).toBeNull();
  });
});
