import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limiter";

describe("checkRateLimit", () => {
  it("allows up to the limit, then blocks within the window", () => {
    const key = "test:burst";
    const t = 1_000_000;
    expect(checkRateLimit(key, 3, 1000, t).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000, t).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000, t).allowed).toBe(true);
    const blocked = checkRateLimit(key, 3, 1000, t);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("allows again after the window slides forward", () => {
    const key = "test:slide";
    expect(checkRateLimit(key, 1, 1000, 5_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 1000, 5_500).allowed).toBe(false);
    expect(checkRateLimit(key, 1, 1000, 6_500).allowed).toBe(true);
  });

  it("isolates buckets by key", () => {
    expect(checkRateLimit("test:a", 1, 1000, 1).allowed).toBe(true);
    expect(checkRateLimit("test:b", 1, 1000, 1).allowed).toBe(true);
  });
});
