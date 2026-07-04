/**
 * Public, embeddable review widget: /w/:businessId
 * Rendered inside an <iframe> on the owner's website. No session — reads via the
 * service container, scoped to a single (opt-in) business id.
 */
import { Star } from "lucide-react";
import { getServiceContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { cn } from "@/shared/lib/cn";
import type { WidgetReview } from "@/features/widget/domain/widget.ports";

export const dynamic = "force-dynamic";

function Stars({ rating, accent }: { rating: number; accent: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="size-4"
          style={{ color: i <= Math.round(rating) ? accent : "var(--color-border-strong, #d4d4d8)" }}
          fill={i <= Math.round(rating) ? accent : "none"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, accent }: { review: WidgetReview; accent: string }) {
  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <Stars rating={review.rating} accent={accent} />
      {review.text && (
        <blockquote className="text-sm leading-relaxed text-text-secondary line-clamp-5">
          “{review.text}”
        </blockquote>
      )}
      {review.author && (
        <figcaption className="mt-auto text-xs font-medium text-text-tertiary">— {review.author}</figcaption>
      )}
    </figure>
  );
}

export default async function WidgetPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  const { resolve } = getServiceContainer();
  const result = await resolve(TOKENS.GetWidgetUseCase).execute(businessId);
  const data = result.isOk() ? result.value : null;

  if (!data) {
    return (
      <div className="grid min-h-40 place-items-center p-6 text-sm text-text-tertiary">
        Reviews are not available.
      </div>
    );
  }

  const { config } = data;
  const layoutClass =
    config.layout === "list"
      ? "grid-cols-1"
      : config.layout === "carousel"
        ? "grid-flow-col auto-cols-[minmax(240px,1fr)] overflow-x-auto"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      data-theme={config.theme === "auto" ? undefined : config.theme}
      className="min-h-screen bg-surface-2 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {config.headline || `What customers say about ${data.businessName}`}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Stars rating={data.avgRating} accent={config.accent} />
              <span className="text-sm font-medium text-text-primary">{data.avgRating.toFixed(1)}</span>
              <span className="text-sm text-text-tertiary">({data.totalCount} reviews)</span>
            </div>
          </div>
        </header>

        {data.reviews.length > 0 ? (
          <div className={cn("grid gap-4", layoutClass)}>
            {data.reviews.map((review, i) => (
              <ReviewCard key={i} review={review} accent={config.accent} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-tertiary">
            New reviews will appear here soon.
          </p>
        )}

        <p className="text-center text-[11px] text-text-tertiary">
          Powered by Reputation Autopilot
        </p>
      </div>
    </div>
  );
}
