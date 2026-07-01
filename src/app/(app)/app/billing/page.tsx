import type { Metadata } from "next";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { PlanCards } from "@/features/billing/presentation/components/plan-cards";

export const metadata: Metadata = { title: "Billing" };

const PLAN_LABEL: Record<string, string> = { trial: "Free trial", starter: "Starter", pro: "Pro" };

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="tabular-nums text-text-tertiary">
          {used} {unlimited ? "" : `/ ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default async function BillingPage() {
  const businessId = await getActiveBusinessId();
  const { resolve } = await getServerContainer();
  // Server Component — renders once per request, so Date.now() is deterministic here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const result = businessId
    ? await resolve(TOKENS.GetBillingOverviewUseCase).execute(businessId, now)
    : null;
  const o = result?.isOk() ? result.value : null;

  const trialPct =
    o && o.trialTotalDays > 0
      ? Math.max(0, Math.round(((o.trialTotalDays - o.trialDaysLeft) / o.trialTotalDays) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & plan" description="Manage your subscription, usage, and payment method." />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{PLAN_LABEL[o?.plan ?? "trial"]}</CardTitle>
            <CardDescription>
              {o?.status === "trialing"
                ? `${o.trialDaysLeft} of ${o.trialTotalDays} trial days remaining`
                : `Status: ${o?.status ?? "—"}`}
            </CardDescription>
          </div>
          <Badge variant={o?.status === "active" ? "success" : "brand"}>{o?.status ?? "trial"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {o?.status === "trialing" && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-primary" style={{ width: `${trialPct}%` }} />
            </div>
          )}
          {o && (
            <div className="grid gap-3 sm:grid-cols-2">
              <UsageBar label="Requests this month" used={o.usage.requestsSent} limit={o.limits.requestsPerMonth} />
              <UsageBar label="AI replies this month" used={o.usage.aiReplies} limit={o.limits.aiRepliesPerMonth} />
            </div>
          )}
        </CardContent>
      </Card>

      <PlanCards currentPlan={o?.plan ?? "trial"} paymentsEnabled={o?.paymentsEnabled ?? false} />
    </div>
  );
}
