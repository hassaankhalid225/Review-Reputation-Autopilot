/**
 * ADAPTER: SupabaseAuthRepository — implements the AuthRepository port
 * against Supabase Auth. Maps Supabase users/errors into domain types.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import {
  AppError,
  ConflictError,
  EmailNotConfirmedError,
  RateLimitedError,
  UnauthenticatedError,
  ValidationError,
  toAppError,
} from "@/core/errors/app-error";
import type { Database } from "@/network/supabase/types";
import { User } from "../domain/user.entity";
import type {
  AuthRepository,
  SignInCredentials,
  SignUpCredentials,
} from "../domain/auth.repository";
import { mapSupabaseUser } from "./auth.mapper";

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async signUp(c: SignUpCredentials): Promise<Result<User, AppError>> {
    const { data, error } = await this.db.auth.signUp({
      email: c.email,
      password: c.password,
      options: {
        data: { full_name: c.fullName ?? null },
        emailRedirectTo: c.emailRedirectTo,
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return err(new ConflictError("An account with this email already exists."));
      }
      return err(new ValidationError(error.message));
    }
    if (!data.user) return err(new AppErrorUnknown());
    return ok(mapSupabaseUser(data.user));
  }

  async signInWithPassword(c: SignInCredentials): Promise<Result<User, AppError>> {
    const { data, error } = await this.db.auth.signInWithPassword({
      email: c.email,
      password: c.password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed") || msg.includes("not verified")) {
        return err(new EmailNotConfirmedError());
      }
      if (error.status === 429 || msg.includes("rate limit")) {
        return err(new RateLimitedError("Too many attempts. Please wait a moment and try again."));
      }
      return err(new UnauthenticatedError("Incorrect email or password."));
    }
    return ok(mapSupabaseUser(data.user));
  }

  async resendVerificationEmail(email: string, redirectTo: string): Promise<Result<void, AppError>> {
    const { error } = await this.db.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return err(toAppError(error));
    return ok(undefined);
  }

  async getOAuthUrl(provider: "google", redirectTo: string): Promise<Result<string, AppError>> {
    const { data, error } = await this.db.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return err(toAppError(error ?? "OAuth init failed"));
    return ok(data.url);
  }

  async signOut(): Promise<Result<void, AppError>> {
    const { error } = await this.db.auth.signOut();
    if (error) return err(toAppError(error));
    return ok(undefined);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.db.auth.getUser();
    return data.user ? mapSupabaseUser(data.user) : null;
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<Result<void, AppError>> {
    const { error } = await this.db.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return err(toAppError(error));
    return ok(undefined);
  }
}

/** Internal fallback when Supabase returns no user without an error. */
class AppErrorUnknown extends AppError {
  readonly code = "INTERNAL_ERROR" as const;
  readonly httpStatus = 500;
  constructor() {
    super("Could not complete sign up. Please try again.");
  }
}
