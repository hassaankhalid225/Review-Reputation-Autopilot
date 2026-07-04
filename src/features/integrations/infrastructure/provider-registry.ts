/**
 * ADAPTER: DefaultProviderRegistry — resolves a ReviewSourceProvider per
 * platform. Every platform starts as link-based (paste your public review
 * link); as each platform's live API/OAuth adapter is built, bind it here in
 * place of the LinkSourceProvider without touching use cases.
 */
import type { Platform } from "@/network/supabase/types";
import { PLATFORMS } from "../domain/platform";
import type { ReviewSourceProvider, ReviewSourceProviderRegistry } from "../domain/integrations.ports";
import { LinkSourceProvider } from "./link-source.provider";

export class DefaultProviderRegistry implements ReviewSourceProviderRegistry {
  private readonly providers: Map<Platform, ReviewSourceProvider>;

  constructor(overrides: Partial<Record<Platform, ReviewSourceProvider>> = {}) {
    this.providers = new Map(
      PLATFORMS.map((p) => [p, overrides[p] ?? new LinkSourceProvider(p)] as const),
    );
  }

  get(platform: Platform): ReviewSourceProvider | null {
    return this.providers.get(platform) ?? null;
  }

  all(): ReviewSourceProvider[] {
    return [...this.providers.values()];
  }
}
