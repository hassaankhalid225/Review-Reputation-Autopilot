/**
 * Environment configuration — parsed once through a Zod schema at startup.
 *
 * No other module reads `process.env` directly (see Docs/ARCHITECTURE.md §6.3).
 * Split into client-safe (NEXT_PUBLIC_*) and server-only schemas so secrets never
 * leak into the client bundle.
 */
import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  /** 32-byte hex/base64 key for encrypting stored OAuth refresh tokens. */
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

/**
 * During local scaffolding the env may be absent; we parse leniently so the app
 * still boots, and surface a clear console warning. In production, missing
 * required client vars should fail the build via CI env checks.
 */
function parseClient() {
  const parsed = clientSchema.safeParse(clientEnv);
  if (!parsed.success) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Invalid client environment: " + parsed.error.issues.map((i) => i.path.join(".")).join(", "),
      );
    }
    // Dev fallback — placeholders so UI renders before Supabase is wired.
    return {
      NEXT_PUBLIC_SUPABASE_URL: clientEnv.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon-placeholder",
      NEXT_PUBLIC_APP_URL: clientEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    };
  }
  return parsed.data;
}

export const clientConfig = parseClient();

/** Server-only config. Call inside server/edge code only. */
export function getServerConfig() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM: process.env.TWILIO_FROM,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  });
}

export type ClientConfig = z.infer<typeof clientSchema>;
export type ServerConfig = z.infer<typeof serverSchema>;
