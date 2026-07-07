/**
 * DI registrations — binds ports to concrete adapters.
 * Imported once (side-effect) before any resolve() call.
 */
import { register } from "./container";
import { TOKENS } from "./tokens";
import { SupabaseAuditLogger } from "@/network/supabase/audit-logger";
import { SupabaseAuthRepository } from "@/features/auth/infrastructure/supabase-auth.repository";
import {
  RequestPasswordResetUseCase,
  ResendVerificationUseCase,
  SignInUseCase,
  SignInWithGoogleUseCase,
  SignOutUseCase,
  SignUpUseCase,
} from "@/features/auth/application/auth.usecases";
import { SupabaseBusinessRepository } from "@/features/businesses/infrastructure/supabase-business.repository";
import { CreateBusinessUseCase } from "@/features/businesses/application/create-business.usecase";
import { ListBusinessesUseCase } from "@/features/businesses/application/list-businesses.usecase";
import { UpdateBusinessUseCase } from "@/features/businesses/application/update-business.usecase";
import { SupabaseCustomerRepository } from "@/features/customers/infrastructure/supabase-customer.repository";
import { AddCustomerUseCase } from "@/features/customers/application/add-customer.usecase";
import { ListCustomersUseCase } from "@/features/customers/application/list-customers.usecase";
import { ImportCustomersUseCase } from "@/features/customers/application/import-customers.usecase";
import { DeleteCustomerUseCase } from "@/features/customers/application/delete-customer.usecase";
import { SupabaseReviewRepository } from "@/features/reviews/infrastructure/supabase-review.repository";
import { DraftOnlyReplyPoster } from "@/features/reviews/infrastructure/draft-only-reply-poster";
import { ListReviewsUseCase } from "@/features/reviews/application/list-reviews.usecase";
import { GetDashboardUseCase } from "@/features/reviews/application/get-dashboard.usecase";
import { ReplyToReviewUseCase } from "@/features/reviews/application/reply-to-review.usecase";
import { SupabaseReviewRequestRepository } from "@/features/review-requests/infrastructure/supabase-review-request.repository";
import { NullMessageSender } from "@/features/review-requests/infrastructure/null-message-sender";
import { SendRequestUseCase } from "@/features/review-requests/application/send-request.usecase";
import { ListRequestsUseCase } from "@/features/review-requests/application/list-requests.usecase";
import { ResolveLinkUseCase } from "@/features/review-requests/application/resolve-link.usecase";
import { WhatsAppSender } from "@/network/whatsapp/whatsapp-sender";
import { TwilioSmsSender } from "@/network/twilio/twilio-sender";
import { ResendEmailSender } from "@/network/email/resend-sender";
import { SupabaseAiDraftRepository } from "@/features/ai-replies/infrastructure/supabase-ai-draft.repository";
import { ClaudeReplyDrafter } from "@/features/ai-replies/infrastructure/claude-reply-drafter";
import { GenerateDraftUseCase } from "@/features/ai-replies/application/generate-draft.usecase";
import { SupabaseAlertRepository } from "@/features/alerts/infrastructure/supabase-alert.repository";
import {
  AcknowledgeAlertUseCase,
  CountUnackedAlertsUseCase,
  ListAlertsUseCase,
} from "@/features/alerts/application/alert.usecases";
import {
  SupabaseManualPaymentRepository,
  SupabaseSubscriptionRepository,
  SupabaseUsageRepository,
} from "@/features/billing/infrastructure/supabase-billing.repositories";
import { StripeGateway } from "@/network/stripe/stripe-gateway";
import {
  CreateCheckoutUseCase,
  GetBillingOverviewUseCase,
  HandleWebhookUseCase,
  SubmitManualPaymentUseCase,
} from "@/features/billing/application/billing.usecases";
import { GoogleAccountAdapter } from "@/features/google-locations/infrastructure/google-account.adapter";
import { SupabaseGoogleLocationRepository } from "@/features/google-locations/infrastructure/supabase-google-location.repository";
import { GoogleReplyPoster } from "@/features/google-locations/infrastructure/google-reply-poster";
import { ConnectGoogleUseCase } from "@/features/google-locations/application/connect-google.usecase";
import { isGoogleConfigured } from "@/network/google/oauth";
import { SupabaseReviewSourceRepository } from "@/features/integrations/infrastructure/supabase-review-source.repository";
import { SupabaseReviewIngestionRepository } from "@/features/integrations/infrastructure/supabase-review-ingestion.repository";
import { DefaultProviderRegistry } from "@/features/integrations/infrastructure/provider-registry";
import { ListSourcesUseCase } from "@/features/integrations/application/list-sources.usecase";
import { ConnectSourceUseCase } from "@/features/integrations/application/connect-source.usecase";
import { DisconnectSourceUseCase } from "@/features/integrations/application/disconnect-source.usecase";
import { CompleteOAuthUseCase } from "@/features/integrations/application/complete-oauth.usecase";
import { GetPlatformStatusesUseCase } from "@/features/integrations/application/platform-status.usecase";
import { SupabaseWidgetRepository } from "@/features/widget/infrastructure/supabase-widget.repository";
import { SupabaseWidgetSettingsRepository } from "@/features/widget/infrastructure/supabase-widget-settings.repository";
import { GetWidgetUseCase } from "@/features/widget/application/get-widget.usecase";
import { SaveWidgetSettingsUseCase } from "@/features/widget/application/save-widget-settings.usecase";

let registered = false;

/** Idempotently register all bindings. Call inside the DI factory. */
export function ensureRegistered(): void {
  if (registered) return;
  registered = true;

  // ── cross-cutting ─────────────────────────────────────────────────────────
  register(TOKENS.AuditLogger, () => new SupabaseAuditLogger());

  // ── auth ────────────────────────────────────────────────────────────────
  register(TOKENS.AuthRepository, (ctx) => new SupabaseAuthRepository(ctx.db));
  register(TOKENS.SignUpUseCase, (ctx, resolve) => new SignUpUseCase(resolve(TOKENS.AuthRepository)));
  register(TOKENS.SignInUseCase, (ctx, resolve) => new SignInUseCase(resolve(TOKENS.AuthRepository)));
  register(
    TOKENS.SignInWithGoogleUseCase,
    (ctx, resolve) => new SignInWithGoogleUseCase(resolve(TOKENS.AuthRepository)),
  );
  register(TOKENS.SignOutUseCase, (ctx, resolve) => new SignOutUseCase(resolve(TOKENS.AuthRepository)));
  register(
    TOKENS.RequestPasswordResetUseCase,
    (ctx, resolve) => new RequestPasswordResetUseCase(resolve(TOKENS.AuthRepository)),
  );
  register(
    TOKENS.ResendVerificationUseCase,
    (ctx, resolve) => new ResendVerificationUseCase(resolve(TOKENS.AuthRepository)),
  );

  // ── businesses ────────────────────────────────────────────────────────────
  register(TOKENS.BusinessRepository, (ctx) => new SupabaseBusinessRepository(ctx.db));
  register(
    TOKENS.CreateBusinessUseCase,
    (ctx, resolve) =>
      new CreateBusinessUseCase(resolve(TOKENS.BusinessRepository), resolve(TOKENS.AuditLogger)),
  );
  register(
    TOKENS.ListBusinessesUseCase,
    (ctx, resolve) => new ListBusinessesUseCase(resolve(TOKENS.BusinessRepository)),
  );
  register(
    TOKENS.UpdateBusinessUseCase,
    (ctx, resolve) =>
      new UpdateBusinessUseCase(resolve(TOKENS.BusinessRepository), resolve(TOKENS.AuditLogger)),
  );

  // ── customers ─────────────────────────────────────────────────────────────
  register(TOKENS.CustomerRepository, (ctx) => new SupabaseCustomerRepository(ctx.db));
  register(
    TOKENS.AddCustomerUseCase,
    (ctx, resolve) =>
      new AddCustomerUseCase(resolve(TOKENS.CustomerRepository), resolve(TOKENS.AuditLogger)),
  );
  register(
    TOKENS.ListCustomersUseCase,
    (ctx, resolve) => new ListCustomersUseCase(resolve(TOKENS.CustomerRepository)),
  );
  register(
    TOKENS.ImportCustomersUseCase,
    (ctx, resolve) =>
      new ImportCustomersUseCase(resolve(TOKENS.CustomerRepository), resolve(TOKENS.AuditLogger)),
  );
  register(
    TOKENS.DeleteCustomerUseCase,
    (ctx, resolve) =>
      new DeleteCustomerUseCase(resolve(TOKENS.CustomerRepository), resolve(TOKENS.AuditLogger)),
  );

  // ── reviews ───────────────────────────────────────────────────────────────
  register(TOKENS.ReviewRepository, (ctx) => new SupabaseReviewRepository(ctx.db));
  // Post to Google when OAuth is configured; otherwise keep replies as drafts.
  register(TOKENS.ReplyPoster, (ctx, resolve) =>
    isGoogleConfigured()
      ? new GoogleReplyPoster(resolve(TOKENS.GoogleLocationRepository))
      : new DraftOnlyReplyPoster(),
  );
  register(
    TOKENS.ListReviewsUseCase,
    (ctx, resolve) => new ListReviewsUseCase(resolve(TOKENS.ReviewRepository)),
  );
  register(
    TOKENS.GetDashboardUseCase,
    (ctx, resolve) => new GetDashboardUseCase(resolve(TOKENS.ReviewRepository)),
  );
  register(
    TOKENS.ReplyToReviewUseCase,
    (ctx, resolve) =>
      new ReplyToReviewUseCase(
        resolve(TOKENS.ReviewRepository),
        resolve(TOKENS.ReplyPoster),
        resolve(TOKENS.AuditLogger),
      ),
  );

  // ── review-requests ───────────────────────────────────────────────────────
  register(TOKENS.ReviewRequestRepository, (ctx) => new SupabaseReviewRequestRepository(ctx.db));
  // Pick the first configured channel: WhatsApp (primary) → Twilio SMS → none.
  register(TOKENS.MessageSender, () => {
    const whatsapp = new WhatsAppSender();
    if (whatsapp.isConfigured()) return whatsapp;
    const twilio = new TwilioSmsSender();
    if (twilio.isConfigured()) return twilio;
    return new NullMessageSender();
  });
  // Email channel (Resend). Falls back to the null sender until configured.
  register(TOKENS.EmailSender, () => {
    const email = new ResendEmailSender();
    return email.isConfigured() ? email : new NullMessageSender();
  });
  register(
    TOKENS.SendRequestUseCase,
    (ctx, resolve) =>
      new SendRequestUseCase(
        resolve(TOKENS.ReviewRequestRepository),
        resolve(TOKENS.CustomerRepository),
        resolve(TOKENS.MessageSender),
        resolve(TOKENS.AuditLogger),
      ),
  );
  register(
    TOKENS.ListRequestsUseCase,
    (ctx, resolve) => new ListRequestsUseCase(resolve(TOKENS.ReviewRequestRepository)),
  );
  register(
    TOKENS.ResolveLinkUseCase,
    (ctx, resolve) => new ResolveLinkUseCase(resolve(TOKENS.ReviewRequestRepository)),
  );

  // ── ai-replies ────────────────────────────────────────────────────────────
  register(TOKENS.AiDraftRepository, (ctx) => new SupabaseAiDraftRepository(ctx.db));
  register(TOKENS.ReplyDrafter, () => new ClaudeReplyDrafter());
  register(
    TOKENS.GenerateDraftUseCase,
    (ctx, resolve) =>
      new GenerateDraftUseCase(
        resolve(TOKENS.ReviewRepository),
        resolve(TOKENS.ReplyDrafter),
        resolve(TOKENS.AiDraftRepository),
        resolve(TOKENS.AuditLogger),
      ),
  );

  // ── alerts ────────────────────────────────────────────────────────────────
  register(TOKENS.AlertRepository, (ctx) => new SupabaseAlertRepository(ctx.db));
  register(TOKENS.ListAlertsUseCase, (ctx, resolve) => new ListAlertsUseCase(resolve(TOKENS.AlertRepository)));
  register(
    TOKENS.CountUnackedAlertsUseCase,
    (ctx, resolve) => new CountUnackedAlertsUseCase(resolve(TOKENS.AlertRepository)),
  );
  register(
    TOKENS.AcknowledgeAlertUseCase,
    (ctx, resolve) =>
      new AcknowledgeAlertUseCase(resolve(TOKENS.AlertRepository), resolve(TOKENS.AuditLogger)),
  );

  // ── billing ───────────────────────────────────────────────────────────────
  register(TOKENS.SubscriptionRepository, (ctx) => new SupabaseSubscriptionRepository(ctx.db));
  register(TOKENS.UsageRepository, (ctx) => new SupabaseUsageRepository(ctx.db));
  register(TOKENS.ManualPaymentRepository, (ctx) => new SupabaseManualPaymentRepository(ctx.db));
  register(TOKENS.PaymentGateway, () => new StripeGateway());
  register(
    TOKENS.GetBillingOverviewUseCase,
    (ctx, resolve) =>
      new GetBillingOverviewUseCase(
        resolve(TOKENS.SubscriptionRepository),
        resolve(TOKENS.UsageRepository),
        resolve(TOKENS.PaymentGateway),
      ),
  );
  register(
    TOKENS.CreateCheckoutUseCase,
    (ctx, resolve) => new CreateCheckoutUseCase(resolve(TOKENS.PaymentGateway)),
  );
  register(
    TOKENS.SubmitManualPaymentUseCase,
    (ctx, resolve) =>
      new SubmitManualPaymentUseCase(resolve(TOKENS.ManualPaymentRepository), resolve(TOKENS.AuditLogger)),
  );
  register(
    TOKENS.HandleWebhookUseCase,
    (ctx, resolve) =>
      new HandleWebhookUseCase(resolve(TOKENS.PaymentGateway), resolve(TOKENS.SubscriptionRepository)),
  );

  // ── google-locations ──────────────────────────────────────────────────────
  register(TOKENS.GoogleAccountPort, () => new GoogleAccountAdapter());
  register(TOKENS.GoogleLocationRepository, (ctx) => new SupabaseGoogleLocationRepository(ctx.db));
  register(
    TOKENS.ConnectGoogleUseCase,
    (ctx, resolve) =>
      new ConnectGoogleUseCase(
        resolve(TOKENS.GoogleAccountPort),
        resolve(TOKENS.GoogleLocationRepository),
        resolve(TOKENS.AuditLogger),
      ),
  );

  // ── integrations (multi-platform review sources) ──────────────────────────
  register(TOKENS.ReviewSourceRepository, (ctx) => new SupabaseReviewSourceRepository(ctx.db));
  register(TOKENS.ReviewIngestionRepository, (ctx) => new SupabaseReviewIngestionRepository(ctx.db));
  // Binds the real per-platform provider (Facebook OAuth; Yelp/TripAdvisor/
  // Trustpilot API) when its credentials are configured, else a link fallback.
  register(TOKENS.ReviewSourceProviderRegistry, () => new DefaultProviderRegistry());
  register(
    TOKENS.ListSourcesUseCase,
    (ctx, resolve) => new ListSourcesUseCase(resolve(TOKENS.ReviewSourceRepository)),
  );
  register(
    TOKENS.GetPlatformStatusesUseCase,
    (ctx, resolve) => new GetPlatformStatusesUseCase(resolve(TOKENS.ReviewSourceProviderRegistry)),
  );
  register(
    TOKENS.ConnectSourceUseCase,
    (ctx, resolve) =>
      new ConnectSourceUseCase(
        resolve(TOKENS.ReviewSourceProviderRegistry),
        resolve(TOKENS.ReviewSourceRepository),
        resolve(TOKENS.ReviewIngestionRepository),
        resolve(TOKENS.AuditLogger),
      ),
  );
  register(
    TOKENS.CompleteOAuthUseCase,
    (ctx, resolve) =>
      new CompleteOAuthUseCase(
        resolve(TOKENS.ReviewSourceProviderRegistry),
        resolve(TOKENS.ConnectSourceUseCase),
      ),
  );
  register(
    TOKENS.DisconnectSourceUseCase,
    (ctx, resolve) =>
      new DisconnectSourceUseCase(resolve(TOKENS.ReviewSourceRepository), resolve(TOKENS.AuditLogger)),
  );

  // ── widget (public website review widget) ─────────────────────────────────
  register(TOKENS.WidgetRepository, (ctx) => new SupabaseWidgetRepository(ctx.db));
  register(TOKENS.GetWidgetUseCase, (ctx, resolve) => new GetWidgetUseCase(resolve(TOKENS.WidgetRepository)));
  register(TOKENS.WidgetSettingsRepository, (ctx) => new SupabaseWidgetSettingsRepository(ctx.db));
  register(
    TOKENS.SaveWidgetSettingsUseCase,
    (ctx, resolve) =>
      new SaveWidgetSettingsUseCase(resolve(TOKENS.WidgetSettingsRepository), resolve(TOKENS.AuditLogger)),
  );
}
