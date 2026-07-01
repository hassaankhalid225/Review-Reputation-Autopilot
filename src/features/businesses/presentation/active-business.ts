/**
 * Active-business (tenant) context resolution for the authenticated shell.
 *
 * Source of truth for "which business am I acting on": a signed-by-Supabase
 * session already authenticates the user; the active business is a UI selection
 * persisted in a cookie and always validated against the user's memberships
 * (so a tampered cookie can never widen access — RLS would deny anyway).
 */
import "server-only";
import { cookies } from "next/headers";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import type { BusinessView } from "../application/business.dto";

export const ACTIVE_BUSINESS_COOKIE = "active_business_id";

export interface TenantContext {
  businesses: BusinessView[];
  active: BusinessView | null;
}

/** Resolve the caller's businesses and the currently-active one. */
export async function getTenantContext(): Promise<TenantContext> {
  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.ListBusinessesUseCase).execute();
  const businesses = result.isOk() ? result.value : [];

  if (businesses.length === 0) return { businesses, active: null };

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const active = businesses.find((b) => b.id === preferred) ?? businesses[0] ?? null;
  return { businesses, active };
}

/** The active business id, or null if the user has none yet. */
export async function getActiveBusinessId(): Promise<string | null> {
  const { active } = await getTenantContext();
  return active?.id ?? null;
}
