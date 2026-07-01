/**
 * PORT: AuthRepository — the contract the application layer depends on.
 * Implemented by infrastructure (SupabaseAuthRepository). No framework imports.
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { User } from "./user.entity";

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  /** Where the confirmation-email link should land (the /auth/callback URL). */
  emailRedirectTo?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthRepository {
  signUp(credentials: SignUpCredentials): Promise<Result<User, AppError>>;
  signInWithPassword(credentials: SignInCredentials): Promise<Result<User, AppError>>;
  /** Returns the OAuth redirect URL to send the browser to. */
  getOAuthUrl(provider: "google", redirectTo: string): Promise<Result<string, AppError>>;
  signOut(): Promise<Result<void, AppError>>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(email: string, redirectTo: string): Promise<Result<void, AppError>>;
  resendVerificationEmail(email: string, redirectTo: string): Promise<Result<void, AppError>>;
}
