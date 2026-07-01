"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Reply, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Avatar } from "@/shared/ui/avatar";
import { RatingStars } from "@/shared/ui/rating-stars";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { formatRelativeTime } from "@/shared/lib/format";
import type { ReviewView } from "../../application/review.dto";
import { replyToReviewAction } from "../review.actions";
import { generateDraftAction } from "@/features/ai-replies/presentation/ai-reply.actions";

function ReviewCard({ review }: { review: ReviewView }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(review.replyText ?? "");
  const [pending, startTransition] = React.useTransition();
  const [drafting, startDrafting] = React.useTransition();

  function generate() {
    startDrafting(async () => {
      const result = await generateDraftAction(review.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setText(result.data.replyText ?? "");
      setOpen(true);
      toast.success("AI draft ready — review and post");
      router.refresh();
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await replyToReviewAction({ reviewId: review.id, replyText: text });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.data.replyStatus === "posted" ? "Reply posted" : "Reply saved as draft");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-3">
          <Avatar name={review.authorName} className="size-10" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-text-primary">{review.authorName}</span>
              <span className="shrink-0 text-xs text-text-tertiary">
                {review.createdAt ? formatRelativeTime(review.createdAt) : ""}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <RatingStars value={review.rating} size="sm" />
              {review.replyStatus === "posted" ? (
                <Badge variant="success">
                  <CheckCircle2 className="size-3" /> Replied
                </Badge>
              ) : review.replyStatus === "drafted" ? (
                <Badge variant="brand">Draft saved</Badge>
              ) : review.isNegative ? (
                <Badge variant="danger">Needs attention</Badge>
              ) : (
                <Badge variant="brand">
                  <Sparkles className="size-3" /> Needs reply
                </Badge>
              )}
            </div>
            {review.text && <p className="mt-2 text-sm text-text-secondary">{review.text}</p>}
          </div>
        </div>

        {review.replyText && !open && (
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Your reply: </span>
            {review.replyText}
          </div>
        )}

        {open ? (
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Write a warm, on-brand reply…"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" loading={pending} disabled={text.trim().length < 2} onClick={submit}>
                Save reply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Sparkles />}
              loading={drafting}
              onClick={generate}
            >
              Draft with AI
            </Button>
            <Button variant="outline" size="sm" leadingIcon={<Reply />} onClick={() => setOpen(true)}>
              {review.replyText ? "Edit reply" : "Reply"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewsList({ reviews }: { reviews: ReviewView[] }) {
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}
