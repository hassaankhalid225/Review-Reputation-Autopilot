import type { Metadata } from "next";
import Link from "next/link";
import { Send } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Sparkline } from "@/shared/ui/patterns/sparkline";
import { ActivationChecklist } from "./_components/activation-checklist";
import { DashboardStats } from "./_components/dashboard-stats";
import { RecentReviews, type ReviewPreview } from "./_components/recent-reviews";

export const metadata: Metadata = { title: "Dashboard" };

const EMPTY_METRICS = {
  avgRating: 0,
  totalReviews: 0,
  responseRate: 0,
  newThisWeek: 0,
  deltas: { rating: 0, reviews: 0, response: 0, week: 0 },
  ratingTrend: [] as number[],
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  const { active } = await getTenantContext();
  const firstName = user?.displayName.split(" ")[0] ?? "there";

  const { resolve } = await getServerContainer();
  const result = active ? await resolve(TOKENS.GetDashboardUseCase).execute(active.id) : null;
  const dashboard = result?.isOk() ? result.value : null;
  const metrics = dashboard?.metrics ?? EMPTY_METRICS;

  const recent: ReviewPreview[] = (dashboard?.recent ?? []).map((r) => ({
    id: r.id,
    author: r.authorName,
    rating: r.rating,
    text: r.text ?? "",
    createdAt: r.createdAt ?? new Date().toISOString(),
    replied: r.replyStatus === "posted",
  }));

  const steps = [
    { label: "Connect your Google Business Profile", done: false, href: "/onboarding" },
    { label: "Add your first customer", done: false, href: "/app/customers" },
    { label: "Send your first review request", done: false, href: "/app/requests" },
    { label: "Post your first AI reply", done: metrics.responseRate > 0, href: "/app/reviews" },
  ];

  const trend = metrics.ratingTrend.length > 1 ? metrics.ratingTrend : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        description="Here's how your reputation is doing today."
        actions={
          <Button asChild leadingIcon={<Send />}>
            <Link href="/app/requests">Send review request</Link>
          </Button>
        }
      />

      <ActivationChecklist steps={steps} />

      <DashboardStats metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rating trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trend ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums text-text-primary">
                      {metrics.avgRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-text-tertiary">across {metrics.totalReviews} reviews</p>
                  </div>
                </div>
                <Sparkline data={trend} className="mt-4 h-28 w-full" />
              </>
            ) : (
              <div className="grid h-28 place-items-center text-sm text-text-tertiary">
                Your rating trend appears once reviews start coming in.
              </div>
            )}
          </CardContent>
        </Card>

        {recent.length > 0 ? (
          <RecentReviews reviews={recent} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-text-tertiary">
                No reviews yet. Connect Google and send your first request to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
