import type { Metadata } from "next";
import Link from "next/link";
import { Star, Send } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { Button } from "@/shared/ui/button";
import { ReviewsList } from "@/features/reviews/presentation/components/reviews-list";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter = "all", page } = await searchParams;
  const businessId = await getActiveBusinessId();

  const { resolve } = await getServerContainer();
  const result = businessId
    ? await resolve(TOKENS.ListReviewsUseCase).execute({
        businessId,
        filter: filter === "needs_reply" || filter === "negative" ? filter : "all",
        page: Number(page) || 1,
        pageSize: 20,
      })
    : null;

  const data = result?.isOk() ? result.value : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Every Google review, with an AI-drafted reply ready to post."
      />

      {data && data.total > 0 ? (
        <ReviewsList reviews={data.items} />
      ) : (
        <EmptyState
          icon={<Star />}
          title="No reviews yet"
          description="Connect your Google Business Profile and start sending requests — new reviews will appear here within minutes."
          action={
            <Button asChild leadingIcon={<Send />}>
              <Link href="/app/requests">Send your first request</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
