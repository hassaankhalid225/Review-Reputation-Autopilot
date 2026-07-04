/** Typed DI tokens — the registry binds these to concrete adapters. */
import { token } from "./container";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { AuthRepository } from "@/features/auth/domain/auth.repository";
import type {
  RequestPasswordResetUseCase,
  ResendVerificationUseCase,
  SignInUseCase,
  SignInWithGoogleUseCase,
  SignOutUseCase,
  SignUpUseCase,
} from "@/features/auth/application/auth.usecases";
import type { BusinessRepository } from "@/features/businesses/domain/business.repository";
import type { CreateBusinessUseCase } from "@/features/businesses/application/create-business.usecase";
import type { ListBusinessesUseCase } from "@/features/businesses/application/list-businesses.usecase";
import type { UpdateBusinessUseCase } from "@/features/businesses/application/update-business.usecase";
import type { CustomerRepository } from "@/features/customers/domain/customer.repository";
import type { AddCustomerUseCase } from "@/features/customers/application/add-customer.usecase";
import type { ListCustomersUseCase } from "@/features/customers/application/list-customers.usecase";
import type { ImportCustomersUseCase } from "@/features/customers/application/import-customers.usecase";
import type { DeleteCustomerUseCase } from "@/features/customers/application/delete-customer.usecase";
import type { ReviewRepository } from "@/features/reviews/domain/review.repository";
import type { ReplyPoster } from "@/features/reviews/application/reply-to-review.usecase";
import type { ListReviewsUseCase } from "@/features/reviews/application/list-reviews.usecase";
import type { GetDashboardUseCase } from "@/features/reviews/application/get-dashboard.usecase";
import type { ReplyToReviewUseCase } from "@/features/reviews/application/reply-to-review.usecase";
import type { ReviewRequestRepository } from "@/features/review-requests/domain/review-request.repository";
import type { MessageSender } from "@/features/review-requests/domain/message-sender";
import type { SendRequestUseCase } from "@/features/review-requests/application/send-request.usecase";
import type { ListRequestsUseCase } from "@/features/review-requests/application/list-requests.usecase";
import type { ResolveLinkUseCase } from "@/features/review-requests/application/resolve-link.usecase";
import type { ReplyDrafter } from "@/features/ai-replies/domain/reply-drafter";
import type { AiDraftRepository } from "@/features/ai-replies/domain/ai-draft.repository";
import type { GenerateDraftUseCase } from "@/features/ai-replies/application/generate-draft.usecase";
import type { AlertRepository } from "@/features/alerts/domain/alert.repository";
import type {
  AcknowledgeAlertUseCase,
  CountUnackedAlertsUseCase,
  ListAlertsUseCase,
} from "@/features/alerts/application/alert.usecases";
import type {
  ManualPaymentRepository,
  PaymentGateway,
  SubscriptionRepository,
  UsageRepository,
} from "@/features/billing/domain/billing.ports";
import type {
  CreateCheckoutUseCase,
  GetBillingOverviewUseCase,
  HandleWebhookUseCase,
  SubmitManualPaymentUseCase,
} from "@/features/billing/application/billing.usecases";
import type { GoogleAccountPort, GoogleLocationRepository } from "@/features/google-locations/domain/google.ports";
import type { ConnectGoogleUseCase } from "@/features/google-locations/application/connect-google.usecase";
import type {
  ReviewSourceProviderRegistry,
  ReviewSourceRepository,
} from "@/features/integrations/domain/integrations.ports";
import type { ListSourcesUseCase } from "@/features/integrations/application/list-sources.usecase";
import type { ConnectSourceUseCase } from "@/features/integrations/application/connect-source.usecase";
import type { DisconnectSourceUseCase } from "@/features/integrations/application/disconnect-source.usecase";
import type { WidgetRepository, WidgetSettingsRepository } from "@/features/widget/domain/widget.ports";
import type { GetWidgetUseCase } from "@/features/widget/application/get-widget.usecase";
import type { SaveWidgetSettingsUseCase } from "@/features/widget/application/save-widget-settings.usecase";

export const TOKENS = {
  // cross-cutting
  AuditLogger: token<AuditLogger>("AuditLogger"),

  // auth
  AuthRepository: token<AuthRepository>("AuthRepository"),
  SignUpUseCase: token<SignUpUseCase>("SignUpUseCase"),
  SignInUseCase: token<SignInUseCase>("SignInUseCase"),
  SignInWithGoogleUseCase: token<SignInWithGoogleUseCase>("SignInWithGoogleUseCase"),
  SignOutUseCase: token<SignOutUseCase>("SignOutUseCase"),
  RequestPasswordResetUseCase: token<RequestPasswordResetUseCase>("RequestPasswordResetUseCase"),
  ResendVerificationUseCase: token<ResendVerificationUseCase>("ResendVerificationUseCase"),

  // businesses
  BusinessRepository: token<BusinessRepository>("BusinessRepository"),
  CreateBusinessUseCase: token<CreateBusinessUseCase>("CreateBusinessUseCase"),
  ListBusinessesUseCase: token<ListBusinessesUseCase>("ListBusinessesUseCase"),
  UpdateBusinessUseCase: token<UpdateBusinessUseCase>("UpdateBusinessUseCase"),

  // customers
  CustomerRepository: token<CustomerRepository>("CustomerRepository"),
  AddCustomerUseCase: token<AddCustomerUseCase>("AddCustomerUseCase"),
  ListCustomersUseCase: token<ListCustomersUseCase>("ListCustomersUseCase"),
  ImportCustomersUseCase: token<ImportCustomersUseCase>("ImportCustomersUseCase"),
  DeleteCustomerUseCase: token<DeleteCustomerUseCase>("DeleteCustomerUseCase"),

  // reviews
  ReviewRepository: token<ReviewRepository>("ReviewRepository"),
  ReplyPoster: token<ReplyPoster>("ReplyPoster"),
  ListReviewsUseCase: token<ListReviewsUseCase>("ListReviewsUseCase"),
  GetDashboardUseCase: token<GetDashboardUseCase>("GetDashboardUseCase"),
  ReplyToReviewUseCase: token<ReplyToReviewUseCase>("ReplyToReviewUseCase"),

  // review-requests
  ReviewRequestRepository: token<ReviewRequestRepository>("ReviewRequestRepository"),
  MessageSender: token<MessageSender>("MessageSender"),
  EmailSender: token<MessageSender>("EmailSender"),
  SendRequestUseCase: token<SendRequestUseCase>("SendRequestUseCase"),
  ListRequestsUseCase: token<ListRequestsUseCase>("ListRequestsUseCase"),
  ResolveLinkUseCase: token<ResolveLinkUseCase>("ResolveLinkUseCase"),

  // ai-replies
  ReplyDrafter: token<ReplyDrafter>("ReplyDrafter"),
  AiDraftRepository: token<AiDraftRepository>("AiDraftRepository"),
  GenerateDraftUseCase: token<GenerateDraftUseCase>("GenerateDraftUseCase"),

  // alerts
  AlertRepository: token<AlertRepository>("AlertRepository"),
  ListAlertsUseCase: token<ListAlertsUseCase>("ListAlertsUseCase"),
  CountUnackedAlertsUseCase: token<CountUnackedAlertsUseCase>("CountUnackedAlertsUseCase"),
  AcknowledgeAlertUseCase: token<AcknowledgeAlertUseCase>("AcknowledgeAlertUseCase"),

  // billing
  SubscriptionRepository: token<SubscriptionRepository>("SubscriptionRepository"),
  UsageRepository: token<UsageRepository>("UsageRepository"),
  ManualPaymentRepository: token<ManualPaymentRepository>("ManualPaymentRepository"),
  PaymentGateway: token<PaymentGateway>("PaymentGateway"),
  GetBillingOverviewUseCase: token<GetBillingOverviewUseCase>("GetBillingOverviewUseCase"),
  CreateCheckoutUseCase: token<CreateCheckoutUseCase>("CreateCheckoutUseCase"),
  SubmitManualPaymentUseCase: token<SubmitManualPaymentUseCase>("SubmitManualPaymentUseCase"),
  HandleWebhookUseCase: token<HandleWebhookUseCase>("HandleWebhookUseCase"),

  // google-locations
  GoogleAccountPort: token<GoogleAccountPort>("GoogleAccountPort"),
  GoogleLocationRepository: token<GoogleLocationRepository>("GoogleLocationRepository"),
  ConnectGoogleUseCase: token<ConnectGoogleUseCase>("ConnectGoogleUseCase"),

  // integrations (multi-platform review sources)
  ReviewSourceRepository: token<ReviewSourceRepository>("ReviewSourceRepository"),
  ReviewSourceProviderRegistry: token<ReviewSourceProviderRegistry>("ReviewSourceProviderRegistry"),
  ListSourcesUseCase: token<ListSourcesUseCase>("ListSourcesUseCase"),
  ConnectSourceUseCase: token<ConnectSourceUseCase>("ConnectSourceUseCase"),
  DisconnectSourceUseCase: token<DisconnectSourceUseCase>("DisconnectSourceUseCase"),

  // widget (public website review widget)
  WidgetRepository: token<WidgetRepository>("WidgetRepository"),
  GetWidgetUseCase: token<GetWidgetUseCase>("GetWidgetUseCase"),
  WidgetSettingsRepository: token<WidgetSettingsRepository>("WidgetSettingsRepository"),
  SaveWidgetSettingsUseCase: token<SaveWidgetSettingsUseCase>("SaveWidgetSettingsUseCase"),
} as const;
