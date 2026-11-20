/**
 * Password hashing with PBKDF2-SHA256 via the Web Crypto API, which runs
 * natively on Cloudflare Workers and in Node.js.
 *
 * Format: pbkdf2-sha256$<iterations>$<saltB64>$<hashB64>, so the cost can be
 * raised later without invalidating existing hashes (see `needsRehash`).
 *
 * Cost trade-off: the Cloudflare Workers Free plan allows ~10 ms of CPU per
 * request, which caps PBKDF2 far below OWASP's 600k-iteration guidance. Set
 * PASSWORD_ITERATIONS higher on a paid plan or a regular server; old hashes are
 * upgraded automatically at the next successful login.
 *
 * Legacy `scrypt$…` hashes (from earlier versions) still verify where node:crypto
 * provides scrypt, and are re-hashed on login.
 */

const DEFAULT_ITERATIONS = 20_000;
const KEY_BITS = 256;

export function passwordIterations() {
  const fromEnv = Number(process.env.PASSWORD_ITERATIONS);
  return Number.isInteger(fromEnv) && fromEnv >= 10_000 ? fromEnv : DEFAULT_ITERATIONS;
}

const encoder = new TextEncoder();
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, KEY_BITS);
  return new Uint8Array(bits);
}

/** Constant-time comparison of two equal-length byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function hashPassword(password: string, iterations = passwordIterations()): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, iterations);
  return ["pbkdf2-sha256", iterations, toB64(salt), toB64(hash)].join("$");
}

async function verifyLegacyScrypt(password: string, stored: string) {
  const [, n, r, p, saltB64, hashB64] = stored.split("$");
  if (!n || !r || !p || !saltB64 || !hashB64) return false;
  try {
    const { scrypt } = await import("node:crypto");
    const expected = fromB64(hashB64);
    const actual = await new Promise<Uint8Array>((resolve, reject) =>
      scrypt(
        password.normalize("NFKC"),
        fromB64(saltB64),
        expected.length,
        { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 },
        (err, key) => (err ? reject(err) : resolve(new Uint8Array(key))),
      ),
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false; // scrypt unavailable in this runtime
  }
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("scrypt$")) return verifyLegacyScrypt(password, stored);

  const [algo, iterations, saltB64, hashB64] = stored.split("$");
  if (algo !== "pbkdf2-sha256" || !iterations || !saltB64 || !hashB64) return false;
  const expected = fromB64(hashB64);
  const actual = await pbkdf2(password, fromB64(saltB64), Number(iterations));
  return timingSafeEqual(actual, expected);
}

/** True when a stored hash uses an older algorithm or a lower cost than configured now. */
export function needsRehash(stored: string) {
  const [algo, iterations] = stored.split("$");
  return algo !== "pbkdf2-sha256" || Number(iterations) < passwordIterations();
}

/** A real hash to compare against when the user doesn't exist, so timing doesn't leak account existence. */
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  dummyHash ??= hashPassword(toB64(crypto.getRandomValues(new Uint8Array(16))));
  return dummyHash;
}
