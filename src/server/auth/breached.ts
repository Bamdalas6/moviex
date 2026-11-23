import "server-only";

/**
 * Rejects passwords that have appeared in known data breaches, using Have I Been
 * Pwned's k-anonymity range API: only the first 5 hex characters of the
 * password's SHA-1 leave the server, never the password or its full hash.
 * Padding is requested so the response size doesn't hint at the match either.
 *
 * Fails open: if the service is slow or down, sign-up carries on.
 */

const RANGE_URL = "https://api.pwnedpasswords.com/range/";

export async function sha1Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** True when `suffix` is listed in a range response with a count above zero (padding rows have 0). */
export function rangeContains(body: string, suffix: string) {
  return body.split("\n").some((line) => {
    const [hash, count] = line.trim().split(":");
    return hash === suffix && Number(count) > 0;
  });
}

export async function isBreachedPassword(password: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const hash = await sha1Hex(password);
    const res = await fetch(RANGE_URL + hash.slice(0, 5), {
      headers: { "Add-Padding": "true", "User-Agent": "watch-nollywood-signup" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    return rangeContains(await res.text(), hash.slice(5));
  } catch {
    return false;
  }
}
