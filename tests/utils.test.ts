import { describe, expect, it } from "vitest";
import { formatCompact, formatRuntime, initials, parseRuntime, slugify, timeAgo } from "@/lib/utils";
import { detectImageType } from "@/server/storage";

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("A Tribe Called Judah 2023")).toBe("a-tribe-called-judah-2023");
    expect(slugify("  Àníkúlápó!  ")).toBe("anikulapo");
  });
});

describe("runtime", () => {
  it.each([
    ["1h 50m", 110],
    ["2h", 120],
    ["95", 95],
    ["45m", 45],
    ["", null],
    ["soon", null],
  ])("parses %j", (input, expected) => {
    expect(parseRuntime(input)).toBe(expected);
  });

  it("formats minutes", () => {
    expect(formatRuntime(143)).toBe("2h 23m");
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("formatting", () => {
  it("initials", () => {
    expect(initials("Kemi Okafor")).toBe("KO");
    expect(initials("cher")).toBe("C");
  });

  it("compact numbers", () => {
    expect(formatCompact(214)).toBe("214");
    expect(formatCompact(1200)).toBe("1.2k");
  });

  it("relative time", () => {
    const now = new Date("2026-11-20T12:00:00Z");
    expect(timeAgo(new Date("2026-11-20T10:00:00Z"), now)).toBe("2 hours ago");
    expect(timeAgo(new Date("2026-11-19T12:00:00Z"), now)).toBe("yesterday");
    expect(timeAgo(now, now)).toBe("just now");
  });
});

describe("detectImageType", () => {
  it("identifies images by magic bytes, not by extension", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(detectImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 ", "binary"))?.mime).toBe("image/webp");
    expect(detectImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});
