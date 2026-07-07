/** Small shared helpers for the brand / AI settings forms. */

/** Browser-side id for a fresh editable row. */
export function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.round(performance.now())}-${Math.floor(Math.random() * 1e6)}`;
}

/** Build a minimal patch: only keys whose value differs from the saved state. */
export function diffObject<T extends object>(a: T, b: T): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  (Object.keys(a) as (keyof T)[]).forEach((k) => {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) patch[k as string] = b[k];
  });
  return patch;
}
