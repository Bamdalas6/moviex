import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse 9");
    expect(hash.startsWith("pbkdf2-sha256$")).toBe(true);
    await expect(verifyPassword("correct horse 9", hash)).resolves.toBe(true);
    await expect(verifyPassword("correct horse 8", hash)).resolves.toBe(false);
  });

  it("salts every hash", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password-1"), hashPassword("same-password-1")]);
    expect(a).not.toBe(b);
  });

  it("rejects malformed stored hashes instead of throwing", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "bcrypt$1$2$3$x$y")).resolves.toBe(false);
  });

  it("still verifies legacy scrypt hashes and flags them for upgrade", async () => {
    const salt = Buffer.from("0123456789abcdef");
    const key = scryptSync("old-password-1", salt, 64, { N: 2 ** 14, r: 8, p: 1 });
    const legacy = ["scrypt", 2 ** 14, 8, 1, salt.toString("base64"), key.toString("base64")].join("$");

    await expect(verifyPassword("old-password-1", legacy)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password-1", legacy)).resolves.toBe(false);
    expect(needsRehash(legacy)).toBe(true);
  });

  it("flags hashes below the configured cost for upgrade", async () => {
    expect(needsRehash(await hashPassword("pw-123456", 10_000))).toBe(true);
    expect(needsRehash(await hashPassword("pw-123456"))).toBe(false);
  });
});
