/**
 * Value object: PhoneNumber — normalizes to E.164 and validates shape.
 *
 * Messaging providers (WhatsApp/Twilio) require E.164. We default a national
 * number (leading 0 or bare) to a configurable country code (PK / +92 by
 * default, matching the product's primary market — SRS §3.2). Pure; no I/O.
 */
import { Result, ok, err } from "@/core/result/result";
import { InvalidPhoneError } from "./customer.errors";

const E164_RE = /^\+[1-9]\d{7,14}$/;

export class PhoneNumber {
  private constructor(public readonly e164: string) {}

  /** @param raw user input @param defaultCountryCode digits only, e.g. "92" */
  static create(raw: string, defaultCountryCode = "92"): Result<PhoneNumber, InvalidPhoneError> {
    const cleaned = raw.replace(/[\s\-().]/g, "");
    if (!cleaned) return err(new InvalidPhoneError("Phone number is required."));

    let e164: string;
    if (cleaned.startsWith("+")) {
      e164 = cleaned;
    } else if (cleaned.startsWith("00")) {
      e164 = "+" + cleaned.slice(2);
    } else if (cleaned.startsWith("0")) {
      e164 = "+" + defaultCountryCode + cleaned.slice(1);
    } else {
      // Bare national or already-with-country digits.
      e164 = "+" + (cleaned.startsWith(defaultCountryCode) ? cleaned : defaultCountryCode + cleaned);
    }

    if (!E164_RE.test(e164)) {
      return err(new InvalidPhoneError("Please enter a valid phone number."));
    }
    return ok(new PhoneNumber(e164));
  }

  toString(): string {
    return this.e164;
  }
}
