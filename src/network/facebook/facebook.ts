/**
 * Facebook (Meta) Graph API client — OAuth login + Page reviews/recommendations.
 * Mirrors the Google adapter: consent URL → code exchange → discover the Page →
 * pull ratings. Requires a Meta app with `pages_show_list` +
 * `pages_read_engagement` (and App Review to go live).
 */
import "server-only";
import { getServerConfig, clientConfig } from "@/core/config/env";
import { httpJson } from "@/network/http/fetch";

const GRAPH = "https://graph.facebook.com/v21.0";
const SCOPE = "pages_show_list,pages_read_engagement,pages_read_user_content";

export function isFacebookConfigured(): boolean {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = getServerConfig();
  return Boolean(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET);
}

export function facebookRedirectUri(): string {
  return `${clientConfig.NEXT_PUBLIC_APP_URL}/api/integrations/facebook/callback`;
}

export function buildFacebookConsentUrl(state: string): string {
  const { FACEBOOK_APP_ID } = getServerConfig();
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID ?? "",
    redirect_uri: facebookRedirectUri(),
    state,
    response_type: "code",
    scope: SCOPE,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeFacebookCode(code: string): Promise<string> {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = getServerConfig();
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID ?? "",
    client_secret: FACEBOOK_APP_SECRET ?? "",
    redirect_uri: facebookRedirectUri(),
    code,
  });
  const data = await httpJson<{ access_token: string }>(
    `${GRAPH}/oauth/access_token?${params.toString()}`,
  );
  return data.access_token;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  link: string | null;
}

/** The first Page the connected user administers. */
export async function discoverPrimaryPage(userAccessToken: string): Promise<FacebookPage | null> {
  const data = await httpJson<{
    data?: { id: string; name: string; access_token: string; link?: string }[];
  }>(`${GRAPH}/me/accounts?fields=id,name,access_token,link&access_token=${encodeURIComponent(userAccessToken)}`);
  const page = data.data?.[0];
  if (!page) return null;
  return {
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
    link: page.link ?? `https://www.facebook.com/${page.id}`,
  };
}

export interface FacebookRatingsResult {
  reviews: {
    externalId: string;
    rating: number;
    text: string | null;
    authorName: string | null;
    createdAt: string | null;
  }[];
  avgRating: number | null;
  reviewCount: number;
}

/** Pull a Page's ratings/recommendations (rating 1..5; recommendation → 5/1). */
export async function fetchFacebookRatings(
  pageId: string,
  pageAccessToken: string,
): Promise<FacebookRatingsResult> {
  const fields = "reviewer{name},rating,review_text,created_time,recommendation_type,open_graph_story";
  const data = await httpJson<{
    data?: {
      created_time?: string;
      rating?: number;
      review_text?: string;
      recommendation_type?: string;
      reviewer?: { name?: string };
      open_graph_story?: { id?: string };
    }[];
  }>(
    `${GRAPH}/${pageId}/ratings?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(pageAccessToken)}`,
  );

  const rows = data.data ?? [];
  const reviews = rows.map((r, i) => {
    const rating = r.rating ?? (r.recommendation_type === "positive" ? 5 : r.recommendation_type === "negative" ? 1 : 0);
    return {
      externalId: r.open_graph_story?.id ?? `${pageId}-${r.created_time ?? i}`,
      rating,
      text: r.review_text ?? null,
      authorName: r.reviewer?.name ?? null,
      createdAt: r.created_time ?? null,
    };
  });
  const rated = reviews.filter((r) => r.rating > 0);
  const avgRating = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null;
  return { reviews, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null, reviewCount: reviews.length };
}
