// Edge Function: poll-reviews — for each connected Google location, refresh the
// access token, pull reviews from the GBP v4 API, and upsert them. New 1–2 star
// reviews trigger the bad-review alert (DB trigger). Runs every ~15 minutes.
//
// Requires function secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY.
import { json, serviceClient } from "../_shared/clients.ts";

const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// --- AES-256-GCM decrypt, matching the app's encryptSecret format -----------
function decodeKey(raw: string): Uint8Array {
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const b = new Uint8Array(32);
    for (let i = 0; i < 32; i++) b[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    return b;
  }
  return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
}
async function decryptSecret(payload: string): Promise<string> {
  const keyRaw = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
  const key = await crypto.subtle.importKey("raw", decodeKey(keyRaw), { name: "AES-GCM" }, false, ["decrypt"]);
  const [ivB64, ctB64] = payload.split(".");
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? "token refresh failed");
  return data.access_token as string;
}

Deno.serve(async () => {
  const db = serviceClient();

  const { data: locations, error } = await db
    .from("google_locations")
    .select("id, business_id, google_account_id, google_location_id, refresh_token_encrypted")
    .eq("status", "connected");
  if (error) return json({ error: error.message }, 500);

  let ingested = 0;
  let errored = 0;

  for (const loc of locations ?? []) {
    try {
      const refreshToken = await decryptSecret(loc.refresh_token_encrypted);
      const accessToken = await refreshAccessToken(refreshToken);

      const res = await fetch(
        `https://mybusiness.googleapis.com/v4/${loc.google_account_id}/${loc.google_location_id}/reviews`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) {
        await db.from("google_locations").update({ status: "error" }).eq("id", loc.id);
        errored++;
        continue;
      }
      const data = await res.json();

      const rows = (data.reviews ?? []).map((r: Record<string, unknown>) => ({
        business_id: loc.business_id,
        location_id: loc.id,
        source: "google",
        google_review_id: r.reviewId,
        rating: STAR[r.starRating as string] ?? 0,
        text: (r.comment as string) ?? null,
        author_name: (r.reviewer as { displayName?: string })?.displayName ?? null,
        review_created_at: (r.createTime as string) ?? null,
      }));

      if (rows.length > 0) {
        // Ignore duplicates so the bad-review trigger only fires on genuinely new rows.
        const { data: upserted } = await db
          .from("reviews")
          .upsert(rows, { onConflict: "business_id,google_review_id", ignoreDuplicates: true })
          .select("id");
        ingested += upserted?.length ?? 0;
      }
      await db.from("google_locations").update({ last_synced_at: new Date().toISOString() }).eq("id", loc.id);
    } catch (_e) {
      errored++;
    }
  }

  return json({ locations: locations?.length ?? 0, ingested, errored });
});
