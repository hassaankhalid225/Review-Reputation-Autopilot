/**
 * ADAPTER: SupabaseBusinessRepository — implements BusinessRepository.
 * All access is RLS-scoped to the caller's memberships (defense in depth on top
 * of the use-case authorization).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ConflictError, InternalError, NotFoundError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import type { Database } from "@/network/supabase/types";
import { Business } from "../domain/business.entity";
import type { BusinessRepository, UpdateBusinessPatch } from "../domain/business.repository";
import { mapBusinessRow } from "./business.mapper";

export class SupabaseBusinessRepository implements BusinessRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(business: Business): Promise<Result<Business, AppError>> {
    const props = business.toJSON();

    // DIAGNOSTIC: is THIS client authenticated, and does auth.uid() match owner_id?
    const { data: au } = await this.db.auth.getUser();
    logger.info("business.create_attempt", {
      ownerId: props.ownerId,
      authUid: au?.user?.id ?? null,
      match: au?.user?.id === props.ownerId,
    });

    const { data, error } = await this.db
      .from("businesses")
      .insert({
        owner_id: props.ownerId,
        name: props.name,
        category: props.category,
        country: props.country,
        city: props.city,
        timezone: props.timezone,
        currency: props.currency,
        brand_tone: props.brandTone,
        languages: props.languages,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("business.create_failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      if (error.code === "23505") return err(new ConflictError("That business already exists."));
      return err(new InternalError("Could not create business.", error));
    }
    return ok(mapBusinessRow(data));
  }

  async listForCurrentUser(): Promise<Result<Business[], AppError>> {
    const { data, error } = await this.db
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return err(new InternalError("Could not load businesses.", error));
    return ok(data.map(mapBusinessRow));
  }

  async findById(id: string): Promise<Result<Business | null, AppError>> {
    const { data, error } = await this.db.from("businesses").select("*").eq("id", id).maybeSingle();
    if (error) return err(new InternalError("Could not load business.", error));
    return ok(data ? mapBusinessRow(data) : null);
  }

  async update(id: string, patch: UpdateBusinessPatch): Promise<Result<Business, AppError>> {
    const { data, error } = await this.db
      .from("businesses")
      .update({
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.city !== undefined ? { city: patch.city } : {}),
        ...(patch.country !== undefined ? { country: patch.country } : {}),
        ...(patch.brandTone !== undefined ? { brand_tone: patch.brandTone } : {}),
        ...(patch.languages !== undefined ? { languages: patch.languages } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return err(new InternalError("Could not update business.", error));
    if (!data) return err(new NotFoundError("Business not found."));
    return ok(mapBusinessRow(data));
  }
}
