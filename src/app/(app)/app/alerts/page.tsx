import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { AlertsList } from "@/features/alerts/presentation/components/alerts-list";

export const metadata: Metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const businessId = await getActiveBusinessId();
  const { resolve } = await getServerContainer();
  const result = businessId ? await resolve(TOKENS.ListAlertsUseCase).execute(businessId) : null;
  const alerts = result?.isOk() ? result.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bad-review alerts"
        description="Instant alerts the moment a 1–2 star review lands."
      />
      {alerts.length > 0 ? (
        <AlertsList alerts={alerts} />
      ) : (
        <EmptyState
          icon={<ShieldCheck />}
          title="All clear — no bad reviews"
          description="When a 1 or 2 star review comes in, you'll get an instant alert and it'll show up here for fast damage control."
        />
      )}
    </div>
  );
}
