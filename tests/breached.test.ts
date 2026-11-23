import { afterEach, describe, expect, it, vi } from "vitest";
import { isBreachedPassword, rangeContains, sha1Hex } from "@/server/auth/breached";

afterEach(() => vi.unstubAllGlobals());

describe("breached-password check", () => {
  it("hashes with upper-case SHA-1", async () => {
    await expect(sha1Hex("password")).resolves.toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });

  it("matches only listed suffixes with a real count (padding rows are 0)", () => {
    const body = "1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004\r\nAAAA:0\r\n";
    expect(rangeContains(body, "1E4C9B93F3F0682250B6CF8331B7EE68FD8")).toBe(true);
    expect(rangeContains(body, "AAAA")).toBe(false);
    expect(rangeContains(body, "BBBB")).toBe(false);
  });

  it("sends only the 5-character prefix and flags a listed password", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () => new Response("1E4C9B93F3F0682250B6CF8331B7EE68FD8:3\r\n"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(isBreachedPassword("password")).resolves.toBe(true);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.pwnedpasswords.com/range/5BAA6");
  });

  it("lets sign-up continue when the service fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    await expect(isBreachedPassword("password")).resolves.toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    await expect(isBreachedPassword("password")).resolves.toBe(false);
  });
});
