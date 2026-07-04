import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Code2, QrCode, Star } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { clientConfig } from "@/core/config/env";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { WidgetSettingsForm } from "@/features/widget/presentation/components/widget-settings-form";
import { WidgetEmbed, ShareTools } from "./_components/grow-tools";
import type { WidgetConfig } from "@/features/widget/domain/widget.ports";
import type { ReviewSourceView } from "@/features/integrations/application/source.dto";

export const metadata: Metadata = { title: "Grow" };

export default async function GrowPage() {
  const { active } = await getTenantContext();

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader title="Grow" description="Turn your reviews into new customers." />
        <EmptyState
          icon={<TrendingUp />}
          title="Create a business first"
          description="Once you have a business set up, you can embed reviews on your site and print QR posters."
          action={
            <Button asChild>
              <Link href="/onboarding">Get started</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const businessId = active.id;
  const { resolve } = await getServerContainer();
  const [sourcesResult, settingsResult] = await Promise.all([
    resolve(TOKENS.ListSourcesUseCase).execute(businessId),
    resolve(TOKENS.WidgetSettingsRepository).get(businessId),
  ]);

  const sources: ReviewSourceView[] = sourcesResult.isOk() ? sourcesResult.value : [];
  const config: WidgetConfig | null = settingsResult.isOk() ? settingsResult.value : null;

  // Prefer Google's review link, else the first connected source with a link.
  const reviewLink =
    sources.find((s) => s.platform === "google" && s.reviewLink)?.reviewLink ??
    sources.find((s) => s.reviewLink)?.reviewLink ??
    null;

  const widgetUrl = `${clientConfig.NEXT_PUBLIC_APP_URL}/w/${businessId}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grow"
        description="Put your reviews to work — embed them on your website, and collect more with QR posters and social sharing."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="size-4 text-brand-600" /> QR posters &amp; social sharing
            </CardTitle>
            <CardDescription>Get more reviews from customers who already love you.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareTools reviewLink={reviewLink} businessName={active.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="size-4 text-brand-600" /> Website widget
            </CardTitle>
            <CardDescription>Show off your best reviews on your own site.</CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetEmbed widgetUrl={widgetUrl} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="size-4 text-brand-600" /> Widget appearance
          </CardTitle>
          <CardDescription>Control which reviews show and how the widget looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <WidgetSettingsForm initial={config} />
        </CardContent>
      </Card>
    </div>
  );
}
