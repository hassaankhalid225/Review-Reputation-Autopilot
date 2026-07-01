/**
 * DI entrypoints.
 *
 * - getServerContainer: request-scoped, cookie-based Supabase client (RLS on).
 *   Use inside Server Actions, Server Components, and Route Handlers with a user.
 * - getServiceContainer: trusted contexts (public redirect, webhooks, cron) —
 *   service-role client (RLS off). NEVER expose to user-supplied authorization;
 *   the caller must scope access itself (e.g. lookup by unguessable token).
 */
import "server-only";
import { createContainer } from "./container";
import { ensureRegistered } from "./registry";
import { createSupabaseServerClient } from "@/network/supabase/server";
import { createSupabaseServiceClient } from "@/network/supabase/service";

export async function getServerContainer() {
  ensureRegistered();
  const db = await createSupabaseServerClient();
  return createContainer({ scope: "server", db });
}

export function getServiceContainer() {
  ensureRegistered();
  const db = createSupabaseServiceClient();
  return createContainer({ scope: "service", db });
}
