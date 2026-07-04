/**
 * ADAPTER: LinkSourceProvider — the "paste your public review link" connect
 * method used by platforms without an ingest API wired yet (Yelp, TripAdvisor,
 * Trustpilot, and Facebook/Instagram until their OAuth apps are approved).
 *
 * It validates + normalizes the URL so requests, the widget and QR posters can
 * point customers straight at the business's listing. When a platform's live
 * API keys are added, swap this for a real OAuth/api adapter — the port is the
 * same, so nothing upstream changes.
 */
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ValidationError } from "@/core/errors/app-error";
import type { Platform } from "@/network/supabase/types";
import type {
  ConnectedSource,
  ProviderConnectInput,
  ReviewSourceProvider,
} from "../domain/integrations.ports";

/** Hostname fragments we expect for each platform's public links. */
const EXPECTED_HOSTS: Record<Platform, string[]> = {
  google: ["google.", "g.page", "goo.gl", "maps.app.goo.gl"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  instagram: ["instagram.com", "instagr.am"],
  yelp: ["yelp.com", "yelp.to"],
  tripadvisor: ["tripadvisor."],
  trustpilot: ["trustpilot.com"],
};

export class LinkSourceProvider implements ReviewSourceProvider {
  constructor(readonly platform: Platform) {}

  /** Link providers have no ingest API — reviews are collected via the link. */
  isConfigured(): boolean {
    return false;
  }

  async connect(input: ProviderConnectInput): Promise<Result<ConnectedSource, AppError>> {
    const raw = (input.reviewLink ?? input.profileUrl ?? "").trim();
    if (!raw) {
      return err(new ValidationError("Paste your public review link to connect this platform."));
    }

    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return err(new ValidationError("That doesn't look like a valid URL. Include https://"));
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return err(new ValidationError("The link must start with http:// or https://"));
    }

    const host = url.hostname.toLowerCase();
    const expected = EXPECTED_HOSTS[this.platform];
    if (!expected.some((h) => host.includes(h))) {
      return err(
        new ValidationError(`That link doesn't look like a ${this.platform} URL (expected ${expected[0]}).`),
      );
    }

    const link = url.toString();
    return ok({
      platform: this.platform,
      externalId: input.externalId ?? null,
      displayName: input.displayName?.trim() || null,
      reviewLink: link,
      profileUrl: input.profileUrl?.trim() || link,
      credentials: null,
    });
  }
}
