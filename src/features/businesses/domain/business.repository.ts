/**
 * PORT: BusinessRepository — contract the application layer depends on.
 * Implemented by infrastructure (SupabaseBusinessRepository). No framework imports.
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Business, BrandTone, SocialLinks, ReplyTemplate, BrandFact } from "./business.entity";

export interface UpdateBusinessPatch {
  name?: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string;
  currency?: string;
  brandTone?: BrandTone;
  languages?: string[];
  // Brand profile
  tagline?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  publicEmail?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  socials?: SocialLinks;
  aiSignature?: string | null;
  aiContext?: string | null;
  aiAvoid?: string | null;
  replyLanguage?: string;
  replyTemplates?: ReplyTemplate[];
  brandFacts?: BrandFact[];
  autopilotEnabled?: boolean;
  autopilotAutoPost?: boolean;
  autopilotMinRating?: number;
}

export interface BusinessRepository {
  /** Insert a new business; the DB trigger grants owner membership + trial. */
  create(business: Business): Promise<Result<Business, AppError>>;
  /** All businesses the caller can access (RLS-scoped to memberships). */
  listForCurrentUser(): Promise<Result<Business[], AppError>>;
  findById(id: string): Promise<Result<Business | null, AppError>>;
  update(id: string, patch: UpdateBusinessPatch): Promise<Result<Business, AppError>>;
}
