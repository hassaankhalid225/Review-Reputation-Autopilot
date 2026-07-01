// Edge Function: send-alert — notifies owners of unsent bad-review alerts over
// WhatsApp. The alert rows are created by the on_review_ingested DB trigger;
// this function delivers the notification and stamps sent_at. Runs every minute.
import { json, sendWhatsApp, serviceClient } from "../_shared/clients.ts";

const BATCH = 25;

Deno.serve(async () => {
  const db = serviceClient();

  const { data: pending, error } = await db
    .from("alerts")
    .select("id, business_id, review_id")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;

  for (const a of pending ?? []) {
    // Resolve the owner's phone via the business owner's profile.
    const { data: business } = await db
      .from("businesses")
      .select("name, owner_id")
      .eq("id", a.business_id)
      .maybeSingle();
    const { data: profile } = business?.owner_id
      ? await db.from("profiles").select("phone").eq("id", business.owner_id).maybeSingle()
      : { data: null };
    const { data: review } = a.review_id
      ? await db.from("reviews").select("rating, author_name").eq("id", a.review_id).maybeSingle()
      : { data: null };

    if (profile?.phone) {
      try {
        await sendWhatsApp(
          profile.phone,
          `⚠️ New ${review?.rating ?? ""}-star review for ${business?.name ?? "your business"}${
            review?.author_name ? ` from ${review.author_name}` : ""
          }. Open Reputation Autopilot to respond fast.`,
        );
        sent++;
      } catch (_e) {
        // Keep sent_at null so the next run retries.
        continue;
      }
    }

    await db.from("alerts").update({ sent_at: new Date().toISOString() }).eq("id", a.id);
  }

  return json({ processed: pending?.length ?? 0, sent });
});
