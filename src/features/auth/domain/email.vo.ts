/**
 * Value object: Email. Validates shape and normalizes (lowercase, trimmed).
 */
import { Result, ok, err } from "@/core/result/result";
import { ValidationError } from "@/core/errors/app-error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email, ValidationError> {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      return err(new ValidationError("Please enter a valid email address."));
    }
    return ok(new Email(normalized));
  }

  toString(): string {
    return this.value;
  }
}
