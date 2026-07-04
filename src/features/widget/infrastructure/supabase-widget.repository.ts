/**
 * ADAPTER: SupabaseWidgetRepository. Reads the public-facing widget payload —
 * business name, opt-in settings, rating summary and the top positive reviews.
 * Resolved in the SERVICE scope (the widget is embedded on the owner's site, so
 * it must read without a user session); access is scoped to a single business id.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import type { Database } from "@/network/supabase/types";
import type { WidgetConfig, WidgetData, WidgetRepository } from "../domain/widget.ports";

const DEFAULT_CONFIG: WidgetConfig = {
  enabled: true,
  minRating: 4,
  theme: "auto",
  layout: "grid",
  accent: "#4f46e5",
  headline: null,
  maxReviews: 6,
};

export class SupabaseWidgetRepository implements WidgetRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async getData(businessId: string): Promise<Result<WidgetData | null, AppError>> {
    const { data: business, error: bizError } = await this.db
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .maybeSingle();
    if (bizError) return err(new InternalError("Could not load business.", bizError));
    if (!business) return ok(null);

    const { data: settings, error: settingsError } = await this.db
      .from("widget_settings")
      .select("enabled, min_rating, theme, layout, accent, headline, max_reviews")
      .eq("business_id", businessId)
      .maybeSingle();
    if (settingsError) return err(new InternalError("Could not load widget settings.", settingsError));

    const config: WidgetConfig = settings
      ? {
          enabled: settings.enabled ?? DEFAULT_CONFIG.enabled,
          minRating: settings.min_rating ?? DEFAULT_CONFIG.minRating,
          theme: settings.theme ?? DEFAULT_CONFIG.theme,
          layout: settings.layout ?? DEFAULT_CONFIG.layout,
          accent: settings.accent ?? DEFAULT_CONFIG.accent,
          headline: settings.headline ?? DEFAULT_CONFIG.headline,
          maxReviews: settings.max_reviews ?? DEFAULT_CONFIG.maxReviews,
        }
      : DEFAULT_CONFIG;

    // Rating summary across all reviews (capped sample keeps it cheap).
    const { data: ratingRows, error: ratingError } = await this.db
      .from("reviews")
      .select("rating")
      .eq("business_id", businessId)
      .limit(1000);
    if (ratingError) return err(new InternalError("Could not load rating summary.", ratingError));
    const totalCount = ratingRows?.length ?? 0;
    const avgRating =
      totalCount > 0 ? ratingRows!.reduce((sum, r) => sum + r.rating, 0) / totalCount : 0;

    // Top positive reviews with text, newest first.
    const { data: reviewRows, error: reviewError } = await this.db
      .from("reviews")
      .select("author_name, rating, text, review_created_at")
      .eq("business_id", businessId)
      .gte("rating", config.minRating)
      .not("text", "is", null)
      .order("review_created_at", { ascending: false })
      .limit(config.maxReviews);
    if (reviewError) return err(new InternalError("Could not load widget reviews.", reviewError));

    return ok({
      businessName: business.name,
      config,
      avgRating: Math.round(avgRating * 10) / 10,
      totalCount,
      reviews: (reviewRows ?? []).map((r) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        createdAt: r.review_created_at,
      })),
    });
  }
}
