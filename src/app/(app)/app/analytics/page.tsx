import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Star } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Sparkline } from "@/shared/ui/patterns/sparkline";
import { DashboardStats } from "../_components/dashboard-stats";
import { PLATFORM_CATALOG } from "@/features/integrations/presentation/platform-catalog";
import { extractKeywords } from "@/features/reviews/application/keywords";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const businessId = await getActiveBusinessId();

  if (!businessId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Understand your reputation and where it's heading." />
        <EmptyState
          icon={<BarChart3 />}
          title="No data yet"
          description="Create a business and connect your review platforms to see insights here."
          action={
            <Button asChild>
              <Link href="/app/integrations">Connect platforms</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { resolve } = await getServerContainer();
  const [dashResult, reviewsResult, sourcesResult] = await Promise.all([
    resolve(TOKENS.GetDashboardUseCase).execute(businessId),
    resolve(TOKENS.ListReviewsUseCase).execute({ businessId, filter: "all", page: 1, pageSize: 100 }),
    resolve(TOKENS.ListSourcesUseCase).execute(businessId),
  ]);

  const dashboard = dashResult.isOk() ? dashResult.value : null;
  const reviews = reviewsResult.isOk() ? reviewsResult.value.items : [];
  const sources = sourcesResult.isOk() ? sourcesResult.value : [];

  // Rating distribution + sentiment split from the recent sample.
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const sampleMax = Math.max(1, ...distribution.map((d) => d.count));
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;

  const keywords = extractKeywords(reviews.map((r) => r.text).filter(Boolean) as string[], 14);

  const trend = dashboard?.metrics.ratingTrend ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Rating trends, sentiment, top themes and a breakdown by platform."
      />

      {dashboard && <DashboardStats metrics={dashboard.metrics} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rating trend</CardTitle>
            <CardDescription>Average rating over recent periods.</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length > 1 ? (
              <Sparkline data={trend} className="h-28 w-full" />
            ) : (
              <p className="py-8 text-center text-sm text-text-tertiary">
                Not enough history yet — the trend appears as reviews come in.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment</CardTitle>
            <CardDescription>Recent {reviews.length} reviews.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SentimentRow label="Positive" value={positive} total={reviews.length} tone="success" />
            <SentimentRow label="Neutral" value={neutral} total={reviews.length} tone="warning" />
            <SentimentRow label="Negative" value={negative} total={reviews.length} tone="danger" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rating distribution</CardTitle>
            <CardDescription>How recent reviews break down by stars.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="flex w-10 items-center gap-1 text-sm text-text-secondary">
                  {d.star} <Star className="size-3 fill-star text-star" />
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(d.count / sampleMax) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm tabular-nums text-text-tertiary">{d.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By platform</CardTitle>
            <CardDescription>Connected review sources and their stats.</CardDescription>
          </CardHeader>
          <CardContent>
            {sources.length > 0 ? (
              <ul className="space-y-3">
                {sources.map((s) => {
                  const meta = PLATFORM_CATALOG[s.platform];
                  const Icon = meta.icon;
                  return (
                    <li key={s.id} className="flex items-center gap-3">
                      <span
                        className="grid size-8 place-items-center rounded-md text-white [&_svg]:size-4"
                        style={{ backgroundColor: meta.accent }}
                      >
                        <Icon />
                      </span>
                      <span className="flex-1 text-sm font-medium text-text-primary">{meta.label}</span>
                      {s.avgRating != null && (
                        <span className="flex items-center gap-1 text-sm text-text-secondary">
                          {s.avgRating.toFixed(1)} <Star className="size-3 fill-star text-star" />
                        </span>
                      )}
                      <span className="text-xs text-text-tertiary">{s.reviewCount} reviews</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-3 text-sm text-text-tertiary">No platforms connected yet.</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/app/integrations">Connect platforms</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top themes</CardTitle>
          <CardDescription>What customers mention most in their reviews.</CardDescription>
        </CardHeader>
        <CardContent>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <Badge key={k.word} variant="neutral">
                  {k.word} <span className="text-text-tertiary">·{k.count}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">Themes appear once you have a few reviews with text.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SentimentRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "success" | "warning" | "danger";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const barClass =
    tone === "success" ? "bg-success-fg" : tone === "warning" ? "bg-warning-fg" : "bg-danger-fg";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="tabular-nums text-text-tertiary">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
