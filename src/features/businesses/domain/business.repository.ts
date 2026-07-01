/**
 * PORT: BusinessRepository — contract the application layer depends on.
 * Implemented by infrastructure (SupabaseBusinessRepository). No framework imports.
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Business, BrandTone } from "./business.entity";

export interface UpdateBusinessPatch {
  name?: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  brandTone?: BrandTone;
  languages?: string[];
}

export interface BusinessRepository {
  /** Insert a new business; the DB trigger grants owner membership + trial. */
  create(business: Business): Promise<Result<Business, AppError>>;
  /** All businesses the caller can access (RLS-scoped to memberships). */
  listForCurrentUser(): Promise<Result<Business[], AppError>>;
  findById(id: string): Promise<Result<Business | null, AppError>>;
  update(id: string, patch: UpdateBusinessPatch): Promise<Result<Business, AppError>>;
}
