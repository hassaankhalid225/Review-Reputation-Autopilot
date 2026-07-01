/**
 * Application layer: auth use cases.
 * Each use case is one user intention; depends only on the AuthRepository PORT.
 */
import { Result, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import { Email } from "../domain/email.vo";
import type { User } from "../domain/user.entity";
import type {
  AuthRepository,
  SignInCredentials,
  SignUpCredentials,
} from "../domain/auth.repository";
import { ValidationError } from "@/core/errors/app-error";

export class SignUpUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: SignUpCredentials): Promise<Result<User, AppError>> {
    const email = Email.create(input.email);
    if (email.isErr()) return err(email.error);
    if (input.password.length < 8) {
      return err(new ValidationError("Password must be at least 8 characters."));
    }
    return this.repo.signUp({ ...input, email: email.value.value });
  }
}

export class SignInUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: SignInCredentials): Promise<Result<User, AppError>> {
    const email = Email.create(input.email);
    if (email.isErr()) return err(email.error);
    return this.repo.signInWithPassword({ ...input, email: email.value.value });
  }
}

export class SignInWithGoogleUseCase {
  constructor(private readonly repo: AuthRepository) {}

  execute(redirectTo: string): Promise<Result<string, AppError>> {
    return this.repo.getOAuthUrl("google", redirectTo);
  }
}

export class SignOutUseCase {
  constructor(private readonly repo: AuthRepository) {}

  execute(): Promise<Result<void, AppError>> {
    return this.repo.signOut();
  }
}

export class RequestPasswordResetUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(emailRaw: string, redirectTo: string): Promise<Result<void, AppError>> {
    const email = Email.create(emailRaw);
    if (email.isErr()) return err(email.error);
    return this.repo.requestPasswordReset(email.value.value, redirectTo);
  }
}

export class ResendVerificationUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(emailRaw: string, redirectTo: string): Promise<Result<void, AppError>> {
    const email = Email.create(emailRaw);
    if (email.isErr()) return err(email.error);
    return this.repo.resendVerificationEmail(email.value.value, redirectTo);
  }
}
