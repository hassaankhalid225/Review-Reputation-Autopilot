/**
 * Google Business Profile API client (raw HTTP).
 * - Account/location discovery via the v1 management + business-information APIs.
 * - Reviews + replies via the v4 API (note: review access requires Google to
 *   allowlist your project; the code path is correct and ready once approved).
 */
import "server-only";
import { httpJson } from "@/network/http/fetch";
import { refreshAccessToken } from "./oauth";

export interface DiscoveredLocation {
  accountName: string; // e.g. "accounts/123"
  locationId: string; // e.g. "locations/456"
  displayName: string | null;
  reviewLink: string | null;
}

export interface NormalizedReview {
  googleReviewId: string;
  rating: number; // 1..5
  text: string | null;
  authorName: string | null;
  createdAt: string | null;
}

const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Find the first account + location for a freshly-connected user. */
export async function discoverPrimaryLocation(accessToken: string): Promise<DiscoveredLocation | null> {
  const accounts = await httpJson<{ accounts?: { name: string }[] }>(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: authHeader(accessToken) },
  );
  const accountName = accounts.accounts?.[0]?.name;
  if (!accountName) return null;

  const locations = await httpJson<{
    locations?: { name: string; title?: string; metadata?: { placeId?: string } }[];
  }>(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,metadata&pageSize=1`,
    { headers: authHeader(accessToken) },
  );
  const loc = locations.locations?.[0];
  if (!loc) return { accountName, locationId: "", displayName: null, reviewLink: null };

  const placeId = loc.metadata?.placeId;
  return {
    accountName,
    locationId: loc.name,
    displayName: loc.title ?? null,
    reviewLink: placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null,
  };
}

/** Pull reviews for a location (v4). Caller supplies the stored refresh token. */
export async function fetchReviews(
  refreshToken: string,
  accountName: string,
  locationName: string,
): Promise<NormalizedReview[]> {
  const accessToken = await refreshAccessToken(refreshToken);
  const data = await httpJson<{
    reviews?: {
      reviewId: string;
      starRating: string;
      comment?: string;
      createTime?: string;
      reviewer?: { displayName?: string };
    }[];
  }>(`https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews`, {
    headers: authHeader(accessToken),
  });

  return (data.reviews ?? []).map((r) => ({
    googleReviewId: r.reviewId,
    rating: STAR[r.starRating] ?? 0,
    text: r.comment ?? null,
    authorName: r.reviewer?.displayName ?? null,
    createdAt: r.createTime ?? null,
  }));
}

/** Post (or update) a reply to a single review (v4). */
export async function postReply(
  refreshToken: string,
  accountName: string,
  locationName: string,
  googleReviewId: string,
  comment: string,
): Promise<void> {
  const accessToken = await refreshAccessToken(refreshToken);
  await httpJson(
    `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews/${googleReviewId}/reply`,
    {
      method: "PUT",
      headers: { ...authHeader(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    },
  );
}
