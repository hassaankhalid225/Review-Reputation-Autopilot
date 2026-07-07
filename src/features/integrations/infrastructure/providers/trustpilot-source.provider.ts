/**
 * ADAPTER: TrustpilotSourceProvider — Trustpilot public API (app key). The owner
 * pastes their Trustpilot profile URL or domain; we resolve the business unit,
 * then pull its score summary + recent reviews.
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, NotFoundError, ProviderError, ValidationError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import {
  findTrustpilotUnit,
  getTrustpilotReviews,
  isTrustpilotConfigured,
  parseTrustpilotDomain,
} from "@/network/trustpilot/trustpilot";
import type { Platform } from "../../domain/platform";
import type {
  ConnectMethod,
  ConnectedSource,
  ProviderConnectInput,
  ReviewSourceProvider,
} from "../../domain/integrations.ports";

export class TrustpilotSourceProvider implements ReviewSourceProvider {
  readonly platform: Platform = "trustpilot";
  readonly method: ConnectMethod = "api";

  isConfigured(): boolean {
    return isTrustpilotConfigured();
  }

  async connect(input: ProviderConnectInput): Promise<Result<ConnectedSource, AppError>> {
    const raw = (input.query ?? input.reviewLink ?? "").trim();
    if (!raw) return err(new ValidationError("Paste your Trustpilot profile URL or domain."));
    try {
      const domain = parseTrustpilotDomain(raw);
      const unit = await findTrustpilotUnit(domain);
      if (!unit) return err(new NotFoundError("Couldn't find that business on Trustpilot."));
      const reviews = await getTrustpilotReviews(unit.id).catch(() => []);
      return ok({
        platform: "trustpilot",
        externalId: unit.id,
        displayName: unit.displayName,
        reviewLink: unit.reviewLink,
        profileUrl: unit.profileUrl,
        credentials: null,
        avgRating: unit.rating,
        reviewCount: unit.reviewCount,
        reviews: reviews.map((r) => ({
          externalId: r.externalId,
          rating: r.rating,
          text: r.text,
          authorName: r.authorName,
          createdAt: r.createdAt,
        })),
      });
    } catch (e) {
      logger.error("trustpilot.connect_failed", { error: String(e) });
      return err(new ProviderError("Couldn't reach Trustpilot. Please try again."));
    }
  }
}
