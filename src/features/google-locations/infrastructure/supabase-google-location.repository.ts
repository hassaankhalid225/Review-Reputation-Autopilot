/**
 * ADAPTER: SupabaseGoogleLocationRepository. Encrypts the OAuth refresh token
 * with AES-GCM before persisting (the column is also revoked from clients via
 * RLS). Decrypts on read for trusted API calls.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import { encryptSecret, decryptSecret } from "@/core/crypto/encryption";
import type { Database } from "@/network/supabase/types";
import type {
  ConnectedLocation,
  GoogleConnection,
  GoogleLocationRepository,
} from "../domain/google.ports";

export class SupabaseGoogleLocationRepository implements GoogleLocationRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async saveConnection(businessId: string, conn: ConnectedLocation): Promise<Result<void, AppError>> {
    const encrypted = await encryptSecret(conn.refreshToken);
    const { error } = await this.db.from("google_locations").upsert(
      {
        business_id: businessId,
        google_account_id: conn.accountName,
        google_location_id: conn.locationId,
        display_name: conn.displayName,
        review_link: conn.reviewLink,
        refresh_token_encrypted: encrypted,
        status: "connected",
      },
      { onConflict: "business_id,google_location_id" },
    );
    if (error) return err(new InternalError("Could not save Google connection.", error));
    return ok(undefined);
  }

  async hasConnection(businessId: string): Promise<Result<boolean, AppError>> {
    const { count, error } = await this.db
      .from("google_locations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "connected");
    if (error) return err(new InternalError("Could not check Google connection.", error));
    return ok((count ?? 0) > 0);
  }

  async getConnection(businessId: string): Promise<Result<GoogleConnection | null, AppError>> {
    const { data, error } = await this.db
      .from("google_locations")
      .select("id, google_account_id, google_location_id, refresh_token_encrypted")
      .eq("business_id", businessId)
      .eq("status", "connected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return err(new InternalError("Could not load Google connection.", error));
    if (!data) return ok(null);

    try {
      const refreshToken = await decryptSecret(data.refresh_token_encrypted);
      return ok({
        locationId: data.id,
        googleAccountId: data.google_account_id,
        googleLocationId: data.google_location_id,
        refreshToken,
      });
    } catch (e) {
      return err(new InternalError("Could not decrypt Google token.", e));
    }
  }
}
