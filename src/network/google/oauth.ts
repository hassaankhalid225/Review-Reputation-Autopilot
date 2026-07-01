/**
 * Google OAuth 2.0 client for the Business Profile API (raw HTTP).
 * Builds the consent URL, exchanges the auth code, and refreshes access tokens.
 */
import "server-only";
import { getServerConfig } from "@/core/config/env";
import { clientConfig } from "@/core/config/env";
import { httpJson } from "@/network/http/fetch";

/** Manage Google Business Profile (accounts, locations, reviews). */
export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/business.manage";

function redirectUri(): string {
  return getServerConfig().GOOGLE_REDIRECT_URI ?? `${clientConfig.NEXT_PUBLIC_APP_URL}/api/google/callback`;
}

export function isGoogleConfigured(): boolean {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getServerConfig();
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/** Build the consent URL. `state` carries CSRF + the target business id. */
export function buildConsentUrl(state: string): string {
  const { GOOGLE_CLIENT_ID } = getServerConfig();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getServerConfig();
  const data = await httpJson<{ access_token: string; refresh_token?: string; expires_in: number }>(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID ?? "",
        client_secret: GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
      }).toString(),
    },
  );
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresIn: data.expires_in };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getServerConfig();
  const data = await httpJson<{ access_token: string }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID ?? "",
      client_secret: GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }).toString(),
  });
  return data.access_token;
}
