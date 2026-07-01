/**
 * Service-role Supabase client — bypasses RLS.
 *
 * USE ONLY in trusted server/edge contexts (webhooks, cron jobs, admin tasks).
 * NEVER import this into a Client Component. The service key never ships to the browser.
 */
import { createClient } from "@supabase/supabase-js";
import { clientConfig } from "@/core/config/env";
import { getServerConfig } from "@/core/config/env";
import type { Database } from "./types";

export function createSupabaseServiceClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerConfig();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the service client.");
  }
  return createClient<Database>(clientConfig.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
