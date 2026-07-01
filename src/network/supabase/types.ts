/**
 * Database types — the source of truth for typed Supabase access.
 *
 * Hand-authored to mirror `supabase/migrations/*.sql` exactly. In CI/production
 * regenerate from the live schema with:
 *   supabase gen types typescript --local > src/network/supabase/types.ts
 * The shape below matches the generator output (public schema, Tables/Views/…)
 * so swapping to generated types is a drop-in replacement.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MembershipRole = "owner" | "staff";
export type BrandTone = "friendly" | "formal" | "short";
export type LocationStatus = "connected" | "revoked" | "error";
export type CustomerSource = "manual" | "csv" | "pos";
export type RequestChannel = "whatsapp" | "sms";
export type RequestStatus = "queued" | "sent" | "delivered" | "clicked" | "reviewed" | "failed";
export type ReplyStatus = "none" | "drafted" | "posted" | "failed";
export type DraftStatus = "draft" | "edited" | "posted";
export type PlanTier = "trial" | "starter" | "pro";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "manual_pending";
export type PaymentProvider = "stripe" | "manual";
export type ManualPaymentStatus = "pending" | "approved" | "rejected";

interface Table<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          locale: string | null;
          created_at: string | null;
        },
        {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
        },
        {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
        }
      >;
      businesses: Table<
        {
          id: string;
          owner_id: string;
          name: string;
          category: string | null;
          country: string | null;
          city: string | null;
          timezone: string | null;
          currency: string | null;
          brand_tone: BrandTone | null;
          languages: string[] | null;
          quiet_hours: string | null;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          id?: string;
          owner_id: string;
          name: string;
          category?: string | null;
          country?: string | null;
          city?: string | null;
          timezone?: string | null;
          currency?: string | null;
          brand_tone?: BrandTone | null;
          languages?: string[] | null;
          quiet_hours?: string | null;
        },
        {
          name?: string;
          category?: string | null;
          country?: string | null;
          city?: string | null;
          timezone?: string | null;
          currency?: string | null;
          brand_tone?: BrandTone | null;
          languages?: string[] | null;
          quiet_hours?: string | null;
        }
      >;
      memberships: Table<
        {
          id: string;
          business_id: string;
          user_id: string;
          role: MembershipRole;
          created_at: string | null;
        },
        { id?: string; business_id: string; user_id: string; role: MembershipRole },
        { role?: MembershipRole }
      >;
      google_locations: Table<
        {
          id: string;
          business_id: string;
          google_account_id: string;
          google_location_id: string;
          display_name: string | null;
          review_link: string | null;
          refresh_token_encrypted: string;
          last_synced_at: string | null;
          status: LocationStatus | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          google_account_id: string;
          google_location_id: string;
          display_name?: string | null;
          review_link?: string | null;
          refresh_token_encrypted: string;
          last_synced_at?: string | null;
          status?: LocationStatus | null;
        },
        {
          display_name?: string | null;
          review_link?: string | null;
          refresh_token_encrypted?: string;
          last_synced_at?: string | null;
          status?: LocationStatus | null;
        }
      >;
      customers: Table<
        {
          id: string;
          business_id: string;
          name: string | null;
          phone: string;
          tags: string[] | null;
          consent: boolean | null;
          source: CustomerSource | null;
          last_request_at: string | null;
          deleted_at: string | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          name?: string | null;
          phone: string;
          tags?: string[] | null;
          consent?: boolean | null;
          source?: CustomerSource | null;
          last_request_at?: string | null;
          deleted_at?: string | null;
        },
        {
          name?: string | null;
          phone?: string;
          tags?: string[] | null;
          consent?: boolean | null;
          source?: CustomerSource | null;
          last_request_at?: string | null;
          deleted_at?: string | null;
        }
      >;
      review_requests: Table<
        {
          id: string;
          business_id: string;
          customer_id: string;
          location_id: string | null;
          channel: RequestChannel;
          status: RequestStatus;
          template_name: string | null;
          short_token: string | null;
          provider_message_id: string | null;
          idempotency_key: string | null;
          error: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          clicked_at: string | null;
          reviewed_at: string | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          customer_id: string;
          location_id?: string | null;
          channel: RequestChannel;
          status?: RequestStatus;
          template_name?: string | null;
          short_token?: string | null;
          provider_message_id?: string | null;
          idempotency_key?: string | null;
          error?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          clicked_at?: string | null;
          reviewed_at?: string | null;
        },
        {
          status?: RequestStatus;
          short_token?: string | null;
          provider_message_id?: string | null;
          error?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          clicked_at?: string | null;
          reviewed_at?: string | null;
        }
      >;
      reviews: Table<
        {
          id: string;
          business_id: string;
          location_id: string | null;
          source: string | null;
          google_review_id: string;
          rating: number;
          text: string | null;
          author_name: string | null;
          reply_text: string | null;
          reply_status: ReplyStatus | null;
          review_created_at: string | null;
          ingested_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          location_id?: string | null;
          source?: string | null;
          google_review_id: string;
          rating: number;
          text?: string | null;
          author_name?: string | null;
          reply_text?: string | null;
          reply_status?: ReplyStatus | null;
          review_created_at?: string | null;
        },
        {
          rating?: number;
          text?: string | null;
          author_name?: string | null;
          reply_text?: string | null;
          reply_status?: ReplyStatus | null;
        }
      >;
      ai_drafts: Table<
        {
          id: string;
          business_id: string;
          review_id: string;
          model: string | null;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          draft_text: string | null;
          status: DraftStatus | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          review_id: string;
          model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          draft_text?: string | null;
          status?: DraftStatus | null;
        },
        { draft_text?: string | null; status?: DraftStatus | null }
      >;
      alerts: Table<
        {
          id: string;
          business_id: string;
          review_id: string | null;
          type: string;
          channel: string | null;
          sent_at: string | null;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          review_id?: string | null;
          type?: string;
          channel?: string | null;
          sent_at?: string | null;
        },
        { acknowledged_at?: string | null; acknowledged_by?: string | null }
      >;
      subscriptions: Table<
        {
          id: string;
          business_id: string;
          plan: PlanTier;
          status: SubscriptionStatus;
          provider: PaymentProvider | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          current_period_end: string | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          plan?: PlanTier;
          status?: SubscriptionStatus;
          provider?: PaymentProvider | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
        },
        {
          plan?: PlanTier;
          status?: SubscriptionStatus;
          provider?: PaymentProvider | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
        }
      >;
      usage_counters: Table<
        {
          business_id: string;
          period_month: string;
          requests_sent: number | null;
          ai_replies: number | null;
        },
        {
          business_id: string;
          period_month: string;
          requests_sent?: number | null;
          ai_replies?: number | null;
        },
        { requests_sent?: number | null; ai_replies?: number | null }
      >;
      manual_payments: Table<
        {
          id: string;
          business_id: string;
          plan: string;
          amount: number;
          currency: string;
          proof_path: string | null;
          status: ManualPaymentStatus | null;
          reviewed_by: string | null;
          created_at: string | null;
        },
        {
          id?: string;
          business_id: string;
          plan: string;
          amount: number;
          currency: string;
          proof_path?: string | null;
          status?: ManualPaymentStatus | null;
        },
        { status?: ManualPaymentStatus | null; reviewed_by?: string | null }
      >;
      audit_log: Table<
        {
          id: number;
          business_id: string | null;
          actor_id: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string | null;
        },
        {
          business_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
        },
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      auth_business_ids: { Args: Record<string, never>; Returns: string[] };
      auth_owned_business_ids: { Args: Record<string, never>; Returns: string[] };
      dashboard_metrics: { Args: { p_business: string }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience row-type accessors: `Tables<"customers">`. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
