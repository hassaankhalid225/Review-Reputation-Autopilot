"use server";

/**
 * Server Action: run AI Autopilot across the reviews that still need a reply.
 *
 * For each pending review it drafts an on-brand reply. When the owner has turned
 * on auto-posting, replies to reviews at/above their minimum rating are also
 * posted automatically; everything else is left as a draft for them to approve.
 */
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { actionErr, actionOk, type ActionResult } from "@/core/result/action-result";
import {
  ProviderError,
  RateLimitedError,
  UnauthenticatedError,
  ValidationError,
} from "@/core/errors/app-error";
import { checkRateLimit } from "@/core/rate-limit/rate-limiter";
import { isClaudeConfigured } from "@/network/claude/client";

/** How many reviews a single Autopilot run will process. */
const BATCH_LIMIT = 15;

export interface AutopilotRunResult {
  total: number;
  drafted: number;
  posted: number;
  failed: number;
}

export async function runAutopilotAction(): Promise<ActionResult<AutopilotRunResult>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const { active } = await getTenantContext();
  if (!active) return actionErr(new ValidationError("Create a business first."));
  if (!isClaudeConfigured()) {
    return actionErr(new ProviderError("AI replies aren't configured yet. Add an Anthropic API key."));
  }

  // Autopilot is billable — cap to 3 runs per minute per business.
  const limit = checkRateLimit(`autopilot:${active.id}`, 3, 60_000, Date.now());
  if (!limit.allowed) {
    return actionErr(new RateLimitedError("Autopilot just ran. Please wait a moment."));
  }

  const { resolve } = await getServerContainer();

  const list = await resolve(TOKENS.ListReviewsUseCase).execute({
    businessId: active.id,
    filter: "needs_reply",
    page: 1,
    pageSize: BATCH_LIMIT,
  });
  if (list.isErr()) return actionErr(list.error);

  const pending = list.value.items;
  const brand = {
    description: active.description,
    aiContext: active.aiContext,
    aiAvoid: active.aiAvoid,
    signature: active.aiSignature,
    language: active.replyLanguage,
    facts: active.brandFacts.map((f) => ({ label: f.label, value: f.value })),
    templates: active.replyTemplates.map((t) => ({
      title: t.title,
      trigger: t.trigger,
      body: t.body,
    })),
  };

  const result: AutopilotRunResult = { total: pending.length, drafted: 0, posted: 0, failed: 0 };

  for (const review of pending) {
    const drafted = await resolve(TOKENS.GenerateDraftUseCase).execute(
      user.id,
      active.id,
      review.id,
      active.name,
      active.brandTone,
      brand,
    );
    if (drafted.isErr()) {
      result.failed += 1;
      continue;
    }
    result.drafted += 1;

    const shouldPost =
      active.autopilotAutoPost && review.rating >= active.autopilotMinRating && drafted.value.replyText;
    if (shouldPost) {
      const posted = await resolve(TOKENS.ReplyToReviewUseCase).execute(
        user.id,
        active.id,
        review.id,
        drafted.value.replyText as string,
      );
      if (posted.isOk()) result.posted += 1;
      else result.failed += 1;
    }
  }

  revalidatePath("/app/reviews");
  revalidatePath("/app/autopilot");
  return actionOk(result);
}
