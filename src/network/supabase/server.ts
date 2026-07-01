/**
 * Server Supabase client — for Server Components, Server Actions, Route Handlers.
 * Reads the user session from cookies; all access constrained by RLS.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clientConfig } from "@/core/config/env";
import type { Database } from "./types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientConfig.NEXT_PUBLIC_SUPABASE_URL,
    clientConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Safe to ignore — session refresh happens in middleware.
          }
        },
      },
    },
  );
}
