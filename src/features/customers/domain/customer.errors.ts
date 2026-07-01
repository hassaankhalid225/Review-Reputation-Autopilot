/** Domain errors for the customers feature. */
import { AppError } from "@/core/errors/app-error";

export class InvalidPhoneError extends AppError {
  readonly code = "INVALID_PHONE" as const;
  readonly httpStatus = 422;
  constructor(message = "That phone number doesn't look right.") {
    super(message);
  }
}

export class DuplicateCustomerError extends AppError {
  readonly code = "DUPLICATE" as const;
  readonly httpStatus = 409;
  constructor(message = "A customer with this phone number already exists.") {
    super(message);
  }
}

export class ConsentRequiredError extends AppError {
  readonly code = "CONSENT_REQUIRED" as const;
  readonly httpStatus = 422;
  constructor(message = "You need the customer's consent before messaging them.") {
    super(message);
  }
}
