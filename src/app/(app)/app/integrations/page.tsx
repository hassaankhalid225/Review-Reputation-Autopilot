import type { Metadata } from "next";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { IntegrationsManager } from "@/features/integrations/presentation/components/integrations-manager";
import type { ReviewSourceView } from "@/features/integrations/application/source.dto";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const businessId = await getActiveBusinessId();

  let sources: ReviewSourceView[] = [];
  if (businessId) {
    const { resolve } = await getServerContainer();
    const result = await resolve(TOKENS.ListSourcesUseCase).execute(businessId);
    if (result.isOk()) sources = result.value;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect every place customers review you. Reviews from all of them land in one feed — and you can drive new ones with requests, your website widget and QR posters."
      />
      <IntegrationsManager sources={sources} />
    </div>
  );
}
