"use server";

/**
 * Server Actions for auth — the presentation→application bridge.
 * Validate input (zod) at the boundary, resolve the use case via DI, return a
 * serializable ActionResult. No business logic lives here.
 */
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { clientConfig } from "@/core/config/env";
import { actionErr, actionOk, toActionResult, type ActionResult } from "@/core/result/action-result";
import { RateLimitedError, ValidationError } from "@/core/errors/app-error";
import { checkRateLimit } from "@/core/rate-limit/rate-limiter";

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Please enter your password."),
});

const resetSchema = z.object({ email: z.string().email("Please enter a valid email.") });

export async function signUpAction(input: unknown): Promise<ActionResult<{ needsVerification: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  if (!checkRateLimit(`signup:${parsed.data.email}`, 5, 300_000, Date.now()).allowed) {
    return actionErr(new RateLimitedError("Too many sign-up attempts. Please wait a few minutes."));
  }
  const { resolve } = await getServerContainer();
  const emailRedirectTo = `${clientConfig.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`;
  const result = await resolve(TOKENS.SignUpUseCase).execute({ ...parsed.data, emailRedirectTo });
  return result.match({
    ok: (user) => actionOk({ needsVerification: !user.emailVerified }),
    err: (e) => actionErr(e),
  });
}

export async function resendVerificationAction(input: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  const { resolve } = await getServerContainer();
  const redirectTo = `${clientConfig.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`;
  const result = await resolve(TOKENS.ResendVerificationUseCase).execute(parsed.data.email, redirectTo);
  return toActionResult(result);
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  // Throttle credential attempts per email (brute-force protection).
  if (!checkRateLimit(`signin:${parsed.data.email}`, 8, 60_000, Date.now()).allowed) {
    return actionErr(new RateLimitedError("Too many attempts. Please wait a minute and try again."));
  }
  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.SignInUseCase).execute(parsed.data);
  if (result.isErr()) return actionErr(result.error);
  revalidatePath("/", "layout");
  return actionOk(undefined);
}

export async function signInWithGoogleAction(): Promise<ActionResult<{ url: string }>> {
  const { resolve } = await getServerContainer();
  const redirectTo = `${clientConfig.NEXT_PUBLIC_APP_URL}/auth/callback`;
  const result = await resolve(TOKENS.SignInWithGoogleUseCase).execute(redirectTo);
  return toActionResult(result, (url) => ({ url }));
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  const { resolve } = await getServerContainer();
  const redirectTo = `${clientConfig.NEXT_PUBLIC_APP_URL}/reset-password/confirm`;
  const result = await resolve(TOKENS.RequestPasswordResetUseCase).execute(parsed.data.email, redirectTo);
  return toActionResult(result);
}

export async function signOutAction(): Promise<void> {
  const { resolve } = await getServerContainer();
  await resolve(TOKENS.SignOutUseCase).execute();
  revalidatePath("/", "layout");
  redirect("/login");
}
