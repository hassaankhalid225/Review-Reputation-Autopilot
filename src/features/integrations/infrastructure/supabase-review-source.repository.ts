/**
 * ADAPTER: SupabaseReviewSourceRepository. Persists connected review sources,
 * encrypting any provider credentials (OAuth tokens / api keys) at rest with
 * AES-GCM. The credentials column is also revoked from clients via RLS.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import { encryptSecret } from "@/core/crypto/encryption";
import type { Database, Platform } from "@/network/supabase/types";
import type { ConnectedSource, ReviewSourceRepository } from "../domain/integrations.ports";
import type { ReviewSource } from "../domain/review-source.entity";
import { toReviewSource } from "./review-source.mapper";

const COLUMNS =
  "id, business_id, platform, external_id, display_name, review_link, profile_url, avg_rating, review_count, status, last_synced_at, created_at, updated_at";

export class SupabaseReviewSourceRepository implements ReviewSourceRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async list(businessId: string): Promise<Result<ReviewSource[], AppError>> {
    const { data, error } = await this.db
      .from("review_sources")
      .select(COLUMNS)
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });
    if (error) return err(new InternalError("Could not load review sources.", error));
    return ok((data ?? []).map(toReviewSource));
  }

  async get(businessId: string, platform: Platform): Promise<Result<ReviewSource | null, AppError>> {
    const { data, error } = await this.db
      .from("review_sources")
      .select(COLUMNS)
      .eq("business_id", businessId)
      .eq("platform", platform)
      .maybeSingle();
    if (error) return err(new InternalError("Could not load review source.", error));
    return ok(data ? toReviewSource(data) : null);
  }

  async save(businessId: string, conn: ConnectedSource): Promise<Result<void, AppError>> {
    const credentials_encrypted = conn.credentials
      ? await encryptSecret(JSON.stringify(conn.credentials))
      : null;
    const { error } = await this.db.from("review_sources").upsert(
      {
        business_id: businessId,
        platform: conn.platform,
        external_id: conn.externalId,
        display_name: conn.displayName,
        review_link: conn.reviewLink,
        profile_url: conn.profileUrl,
        credentials_encrypted,
        status: "connected",
      },
      { onConflict: "business_id,platform" },
    );
    if (error) return err(new InternalError("Could not save review source.", error));
    return ok(undefined);
  }

  async remove(businessId: string, platform: Platform): Promise<Result<void, AppError>> {
    const { error } = await this.db
      .from("review_sources")
      .delete()
      .eq("business_id", businessId)
      .eq("platform", platform);
    if (error) return err(new InternalError("Could not disconnect review source.", error));
    return ok(undefined);
  }
}
