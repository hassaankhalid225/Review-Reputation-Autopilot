/** Maps a `review_requests` DB row ⇄ the ReviewRequest domain entity. */
import type { Tables } from "@/network/supabase/types";
import { ReviewRequest, type RequestChannel, type RequestStatus } from "../domain/review-request.entity";

export function mapRequestRow(row: Tables<"review_requests">): ReviewRequest {
  return ReviewRequest.fromProps({
    id: row.id,
    businessId: row.business_id,
    customerId: row.customer_id,
    locationId: row.location_id,
    channel: row.channel as RequestChannel,
    status: row.status as RequestStatus,
    shortToken: row.short_token,
    providerMessageId: row.provider_message_id,
    error: row.error,
    sentAt: row.sent_at,
    clickedAt: row.clicked_at,
    createdAt: row.created_at,
  });
}
