import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Avatar } from "@/shared/ui/avatar";
import { RatingStars } from "@/shared/ui/rating-stars";
import { Badge } from "@/shared/ui/badge";
import { formatRelativeTime } from "@/shared/lib/format";

export interface ReviewPreview {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  replied: boolean;
}

export function RecentReviews({ reviews }: { reviews: ReviewPreview[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent reviews</CardTitle>
        <Link href="/app/reviews" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {reviews.map((r) => (
          <div key={r.id} className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-surface-2">
            <Avatar name={r.author} className="size-9" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-text-primary">{r.author}</span>
                <span className="shrink-0 text-xs text-text-tertiary">{formatRelativeTime(r.createdAt)}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <RatingStars value={r.rating} size="sm" />
                {r.replied ? (
                  <Badge variant="success">Replied</Badge>
                ) : (
                  <Badge variant="brand">
                    <Sparkles className="size-3" /> Draft ready
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">{r.text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
