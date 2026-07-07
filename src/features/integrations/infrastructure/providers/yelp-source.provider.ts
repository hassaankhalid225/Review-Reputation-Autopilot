/**
 * ADAPTER: YelpSourceProvider — Yelp Fusion API (app key). The owner pastes their
 * Yelp business URL; we resolve the business and pull its rating + review
 * snippets (Yelp caps public review access at 3).
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, NotFoundError, ProviderError, ValidationError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import {
  getYelpBusiness,
  getYelpReviews,
  isYelpConfigured,
  parseYelpAlias,
  searchYelpBusiness,
} from "@/network/yelp/yelp";
import type { Platform } from "../../domain/platform";
import type {
  ConnectMethod,
  ConnectedSource,
  ProviderConnectInput,
  ReviewSourceProvider,
} from "../../domain/integrations.ports";

export class YelpSourceProvider implements ReviewSourceProvider {
  readonly platform: Platform = "yelp";
  readonly method: ConnectMethod = "api";

  isConfigured(): boolean {
    return isYelpConfigured();
  }

  async connect(input: ProviderConnectInput): Promise<Result<ConnectedSource, AppError>> {
    const raw = (input.query ?? input.reviewLink ?? "").trim();
    if (!raw) return err(new ValidationError("Paste your Yelp business URL, or search by name."));
    try {
      // A Yelp URL → resolve by alias; otherwise auto-search by name + location.
      const business = /yelp\.[a-z.]+\/biz\//i.test(raw)
        ? await getYelpBusiness(parseYelpAlias(raw))
        : await searchYelpBusiness(raw, input.location ?? "");
      if (!business) return err(new NotFoundError("Couldn't find that business on Yelp."));
      const reviews = await getYelpReviews(business.id).catch(() => []);
      return ok({
        platform: "yelp",
        externalId: business.id,
        displayName: business.name,
        reviewLink: business.url,
        profileUrl: business.url,
        credentials: null,
        avgRating: business.rating,
        reviewCount: business.reviewCount,
        reviews: reviews.map((r) => ({
          externalId: r.externalId,
          rating: r.rating,
          text: r.text,
          authorName: r.authorName,
          createdAt: r.createdAt,
        })),
      });
    } catch (e) {
      logger.error("yelp.connect_failed", { error: String(e) });
      return err(new ProviderError("Couldn't reach Yelp. Please try again."));
    }
  }
}
