/**
 * AppError — stable, user-safe error hierarchy.
 *
 * Every error carries a machine-readable `code` (mapped to localized UI messages),
 * an HTTP status (for route handlers), and a user-safe `message`. Internal details
 * go in `cause` and are logged, never shown to users.
 *
 * See Docs/ARCHITECTURE.md §6.1.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "EMAIL_NOT_CONFIRMED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "DUPLICATE"
  | "INVALID_PHONE"
  | "CONSENT_REQUIRED"
  | "ANTI_SPAM_BLOCKED"
  | "INTERNAL_ERROR";

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly httpStatus: number;

  override readonly cause?: unknown;
  readonly meta?: Record<string, unknown>;

  constructor(message: string, cause?: unknown, meta?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
    this.meta = meta;
  }

  toJSON() {
    return { code: this.code, message: this.message, meta: this.meta };
  }
}

export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly httpStatus = 422;
}

export class UnauthenticatedError extends AppError {
  readonly code = "UNAUTHENTICATED" as const;
  readonly httpStatus = 401;
  constructor(message = "You need to sign in to continue.") {
    super(message);
  }
}

export class EmailNotConfirmedError extends AppError {
  readonly code = "EMAIL_NOT_CONFIRMED" as const;
  readonly httpStatus = 403;
  constructor(message = "Please verify your email before logging in. Check your inbox for the link.") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN" as const;
  readonly httpStatus = 403;
  constructor(message = "You don't have permission to do that.") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
  readonly httpStatus = 404;
}

export class ConflictError extends AppError {
  readonly code = "CONFLICT" as const;
  readonly httpStatus = 409;
}

export class DuplicateError extends AppError {
  readonly code = "DUPLICATE" as const;
  readonly httpStatus = 409;
}

export class QuotaExceededError extends AppError {
  readonly code = "QUOTA_EXCEEDED" as const;
  readonly httpStatus = 402;
}

export class RateLimitedError extends AppError {
  readonly code = "RATE_LIMITED" as const;
  readonly httpStatus = 429;
}

export class ProviderError extends AppError {
  readonly code = "PROVIDER_ERROR" as const;
  readonly httpStatus = 502;
}

export class InternalError extends AppError {
  readonly code = "INTERNAL_ERROR" as const;
  readonly httpStatus = 500;
  constructor(message = "Something went wrong on our end.", cause?: unknown) {
    super(message, cause);
  }
}

/** Normalize any thrown value into an AppError for safe presentation. */
export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  if (e instanceof Error) return new InternalError(e.message, e);
  return new InternalError("Unexpected error.", e);
}
