import { describe, it, expect } from "vitest";
import { Rating } from "./rating.vo";

describe("Rating", () => {
  it("accepts 1 through 5", () => {
    for (const n of [1, 2, 3, 4, 5]) {
      expect(Rating.create(n).isOk()).toBe(true);
    }
  });

  it("rejects out-of-range and non-integers", () => {
    for (const n of [0, 6, -1, 3.5, NaN]) {
      expect(Rating.create(n).isErr()).toBe(true);
    }
  });

  it("flags 1- and 2-star as negative", () => {
    expect((Rating.create(1) as { value: Rating }).value.isNegative()).toBe(true);
    expect((Rating.create(2) as { value: Rating }).value.isNegative()).toBe(true);
    expect((Rating.create(3) as { value: Rating }).value.isNegative()).toBe(false);
  });
});
