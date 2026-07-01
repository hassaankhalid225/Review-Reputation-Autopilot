/**
 * Browser Supabase client — for Client Components.
 * Uses the public anon key; all access is constrained by RLS.
 */
import { createBrowserClient } from "@supabase/ssr";
import { clientConfig } from "@/core/config/env";
import type { Database } from "./types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    clientConfig.NEXT_PUBLIC_SUPABASE_URL,
    clientConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
