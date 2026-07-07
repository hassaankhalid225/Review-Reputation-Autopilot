import type { Metadata } from "next";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { IntegrationsManager } from "@/features/integrations/presentation/components/integrations-manager";
import type { ReviewSourceView } from "@/features/integrations/application/source.dto";
import type { PlatformStatus } from "@/features/integrations/application/platform-status.usecase";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const { connect } = await searchParams;
  const businessId = await getActiveBusinessId();

  const { resolve } = await getServerContainer();
  // Statuses depend only on env credentials (not the DB) — always available.
  const statuses: PlatformStatus[] = resolve(TOKENS.GetPlatformStatusesUseCase).execute();

  let sources: ReviewSourceView[] = [];
  if (businessId) {
    const sourcesResult = await resolve(TOKENS.ListSourcesUseCase).execute(businessId);
    if (sourcesResult.isOk()) sources = sourcesResult.value;
  }

  const banner = connectBanner(connect);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect every place customers review you. Reviews from all of them land in one feed — and you can drive new ones with requests, your website widget and QR posters."
      />
      {banner && (
        <div
          className={
            banner.ok
              ? "rounded-lg border border-success-fg/20 bg-success-bg px-4 py-3 text-sm text-success-fg"
              : "rounded-lg border border-danger-fg/20 bg-danger-bg px-4 py-3 text-sm text-danger-fg"
          }
        >
          {banner.message}
        </div>
      )}
      <IntegrationsManager sources={sources} statuses={statuses} />
    </div>
  );
}

function connectBanner(connect?: string): { ok: boolean; message: string } | null {
  if (!connect) return null;
  if (connect.startsWith("connected")) {
    const platform = connect.split("_")[1];
    return { ok: true, message: `${platform ? platform[0]!.toUpperCase() + platform.slice(1) : "Platform"} connected — your reviews are syncing in.` };
  }
  if (connect === "denied") return { ok: false, message: "You cancelled the connection. No changes made." };
  return { ok: false, message: "We couldn't complete that connection. Please try again." };
}
