// Edge Function: send-message — drains queued review_requests and sends them
// over WhatsApp. Scheduled every minute (see supabase/migrations/0006_cron.sql).
//
// Invoke locally:  supabase functions serve send-message
// Deploy:          supabase functions deploy send-message
import { json, sendWhatsApp, serviceClient } from "../_shared/clients.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:3000";
const BATCH = 25;

Deno.serve(async () => {
  const db = serviceClient();

  const { data: queued, error } = await db
    .from("review_requests")
    .select("id, business_id, customer_id, short_token, location_id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  let failed = 0;

  for (const r of queued ?? []) {
    const [{ data: customer }, { data: business }] = await Promise.all([
      db.from("customers").select("phone").eq("id", r.customer_id).maybeSingle(),
      db.from("businesses").select("name").eq("id", r.business_id).maybeSingle(),
    ]);
    if (!customer?.phone) {
      await db.from("review_requests").update({ status: "failed", error: "no phone" }).eq("id", r.id);
      failed++;
      continue;
    }

    const link = `${APP_URL}/r/${r.short_token}`;
    const body = `Hi! Thanks for choosing ${business?.name ?? "us"}. We'd love a quick Google review — it takes 30 seconds: ${link}`;

    try {
      const providerId = await sendWhatsApp(customer.phone, body);
      await db
        .from("review_requests")
        .update({ status: "sent", provider_message_id: providerId, sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    } catch (e) {
      await db.from("review_requests").update({ status: "failed", error: String(e) }).eq("id", r.id);
      failed++;
    }
  }

  return json({ processed: queued?.length ?? 0, sent, failed });
});
