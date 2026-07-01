/**
 * URL-safe short token generator (crypto-backed). Used for review-request
 * short links (`/r/<token>`). Collision-resistant at the lengths we use; the DB
 * has a UNIQUE constraint as the final guard.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghijkmnpqrstuvwxyz"; // no ambiguous I,L,O

export function shortToken(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/** RFC4122 v4 UUID for idempotency keys etc. */
export function uuid(): string {
  return crypto.randomUUID();
}
