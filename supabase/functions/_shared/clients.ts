// Shared helpers for Supabase Edge Functions (Deno runtime).
// These run in trusted contexts with the service-role key (RLS bypassed),
// mirroring the app's service-scoped DI. Secrets come from function env.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Send a WhatsApp Cloud API text message. Returns the provider message id. */
export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp not configured");

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "text",
      text: { preview_url: true, body },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.messages?.[0]?.id) {
    throw new Error(data.error?.message ?? "WhatsApp send failed");
  }
  return data.messages[0].id as string;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
