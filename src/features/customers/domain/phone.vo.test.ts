import { describe, it, expect } from "vitest";
import { PhoneNumber } from "./phone.vo";

describe("PhoneNumber", () => {
  it("normalizes a local PK number (leading 0) to E.164", () => {
    const r = PhoneNumber.create("0300 1234567");
    expect(r.isOk()).toBe(true);
    if (r.isOk()) expect(r.value.e164).toBe("+923001234567");
  });

  it("keeps an already-international number", () => {
    const r = PhoneNumber.create("+44 7700 900123");
    expect(r.isOk()).toBe(true);
    if (r.isOk()) expect(r.value.e164).toBe("+447700900123");
  });

  it("converts a 00 prefix to +", () => {
    const r = PhoneNumber.create("0092 300 1234567");
    expect(r.isOk()).toBe(true);
    if (r.isOk()) expect(r.value.e164).toBe("+923001234567");
  });

  it("prefixes a bare national number with the default country code", () => {
    const r = PhoneNumber.create("3001234567");
    expect(r.isOk()).toBe(true);
    if (r.isOk()) expect(r.value.e164).toBe("+923001234567");
  });

  it("respects a custom default country code", () => {
    const r = PhoneNumber.create("07700900123", "44");
    expect(r.isOk()).toBe(true);
    if (r.isOk()) expect(r.value.e164).toBe("+447700900123");
  });

  it("rejects empty input", () => {
    expect(PhoneNumber.create("   ").isErr()).toBe(true);
  });

  it("rejects too-short numbers", () => {
    expect(PhoneNumber.create("+1 23").isErr()).toBe(true);
  });

  it("strips spaces, dashes, and parens", () => {
    const r = PhoneNumber.create("(0300) 123-4567");
    expect(r.isOk()).toBe(true);
    if (r.isOk()) expect(r.value.e164).toBe("+923001234567");
  });
});
