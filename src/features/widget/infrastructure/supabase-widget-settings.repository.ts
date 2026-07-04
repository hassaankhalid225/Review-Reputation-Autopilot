/** ADAPTER: SupabaseWidgetSettingsRepository (server-scoped, RLS-guarded). */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import type { Database } from "@/network/supabase/types";
import type {
  WidgetConfig,
  WidgetSettingsInput,
  WidgetSettingsRepository,
} from "../domain/widget.ports";

export class SupabaseWidgetSettingsRepository implements WidgetSettingsRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async get(businessId: string): Promise<Result<WidgetConfig | null, AppError>> {
    const { data, error } = await this.db
      .from("widget_settings")
      .select("enabled, min_rating, theme, layout, accent, headline, max_reviews")
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) return err(new InternalError("Could not load widget settings.", error));
    if (!data) return ok(null);
    return ok({
      enabled: data.enabled ?? true,
      minRating: data.min_rating ?? 4,
      theme: data.theme ?? "auto",
      layout: data.layout ?? "grid",
      accent: data.accent ?? "#4f46e5",
      headline: data.headline ?? null,
      maxReviews: data.max_reviews ?? 6,
    });
  }

  async save(businessId: string, input: WidgetSettingsInput): Promise<Result<void, AppError>> {
    const { error } = await this.db.from("widget_settings").upsert(
      {
        business_id: businessId,
        enabled: input.enabled,
        min_rating: input.minRating,
        theme: input.theme,
        layout: input.layout,
        accent: input.accent,
        headline: input.headline,
        max_reviews: input.maxReviews,
      },
      { onConflict: "business_id" },
    );
    if (error) return err(new InternalError("Could not save widget settings.", error));
    return ok(undefined);
  }
}
