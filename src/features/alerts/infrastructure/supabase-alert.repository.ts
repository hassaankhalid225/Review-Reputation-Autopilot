/** ADAPTER: SupabaseAlertRepository — RLS-scoped, with a review preview join. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import type { Database } from "@/network/supabase/types";
import { Alert } from "../domain/alert.entity";
import type { AlertRepository } from "../domain/alert.repository";

export class SupabaseAlertRepository implements AlertRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async list(businessId: string, onlyUnacked: boolean): Promise<Result<Alert[], AppError>> {
    let q = this.db
      .from("alerts")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (onlyUnacked) q = q.is("acknowledged_at", null);

    const { data, error } = await q;
    if (error) return err(new InternalError("Could not load alerts.", error));

    // Join review previews in a single follow-up query (Relationships are not
    // declared in the generated types, so we hydrate manually).
    const reviewIds = data.map((a) => a.review_id).filter((id): id is string => Boolean(id));
    const previews = new Map<string, { rating: number; text: string | null; author: string | null }>();
    if (reviewIds.length > 0) {
      const { data: reviews } = await this.db
        .from("reviews")
        .select("id, rating, text, author_name")
        .in("id", reviewIds);
      for (const r of reviews ?? []) {
        previews.set(r.id, { rating: r.rating, text: r.text, author: r.author_name });
      }
    }

    return ok(
      data.map((a) => {
        const p = a.review_id ? previews.get(a.review_id) : undefined;
        return Alert.fromProps({
          id: a.id,
          businessId: a.business_id,
          reviewId: a.review_id,
          type: a.type,
          channel: a.channel ?? "whatsapp",
          sentAt: a.sent_at,
          acknowledgedAt: a.acknowledged_at,
          createdAt: a.created_at,
          reviewRating: p?.rating ?? null,
          reviewText: p?.text ?? null,
          reviewAuthor: p?.author ?? null,
        });
      }),
    );
  }

  async countUnacknowledged(businessId: string): Promise<Result<number, AppError>> {
    const { count, error } = await this.db
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .is("acknowledged_at", null);
    if (error) return err(new InternalError("Could not count alerts.", error));
    return ok(count ?? 0);
  }

  async acknowledge(businessId: string, alertId: string, userId: string): Promise<Result<void, AppError>> {
    const { error } = await this.db
      .from("alerts")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: userId })
      .eq("business_id", businessId)
      .eq("id", alertId);
    if (error) return err(new InternalError("Could not acknowledge alert.", error));
    return ok(undefined);
  }
}
