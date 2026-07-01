/** Value object: Rating — an integer 1..5 (SRS §5.2.7). */
import { Result, ok, err } from "@/core/result/result";
import { ValidationError } from "@/core/errors/app-error";

export class Rating {
  private constructor(public readonly value: number) {}

  static create(raw: number): Result<Rating, ValidationError> {
    if (!Number.isInteger(raw) || raw < 1 || raw > 5) {
      return err(new ValidationError("Rating must be a whole number from 1 to 5."));
    }
    return ok(new Rating(raw));
  }

  /** A 1- or 2-star review is "bad" and triggers an owner alert (FR-ALERT-1). */
  isNegative(): boolean {
    return this.value <= 2;
  }
}
