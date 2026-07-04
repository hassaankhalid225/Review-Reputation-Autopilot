/** PORT + shapes for the public website review widget. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";

export type WidgetTheme = "auto" | "light" | "dark";
export type WidgetLayout = "grid" | "carousel" | "list";

export interface WidgetReview {
  author: string | null;
  rating: number;
  text: string | null;
  createdAt: string | null;
}

export interface WidgetConfig {
  enabled: boolean;
  minRating: number;
  theme: WidgetTheme;
  layout: WidgetLayout;
  accent: string;
  headline: string | null;
  maxReviews: number;
}

export interface WidgetData {
  businessName: string;
  config: WidgetConfig;
  avgRating: number;
  totalCount: number;
  reviews: WidgetReview[];
}

/** Reads public widget data for a business (service-scoped; intentionally public). */
export interface WidgetRepository {
  getData(businessId: string): Promise<Result<WidgetData | null, AppError>>;
}

/** Fields the owner can edit for their widget. */
export interface WidgetSettingsInput {
  enabled: boolean;
  minRating: number;
  theme: WidgetTheme;
  layout: WidgetLayout;
  accent: string;
  headline: string | null;
  maxReviews: number;
}

/** Reads/writes the owner's widget configuration (server-scoped, RLS-guarded). */
export interface WidgetSettingsRepository {
  get(businessId: string): Promise<Result<WidgetConfig | null, AppError>>;
  save(businessId: string, input: WidgetSettingsInput): Promise<Result<void, AppError>>;
}
