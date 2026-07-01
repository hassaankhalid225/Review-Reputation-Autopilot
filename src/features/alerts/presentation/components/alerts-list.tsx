"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { RatingStars } from "@/shared/ui/rating-stars";
import { Badge } from "@/shared/ui/badge";
import { formatRelativeTime } from "@/shared/lib/format";
import type { AlertView } from "../../application/alert.dto";
import { acknowledgeAlertAction } from "../alert.actions";

export function AlertsList({ alerts }: { alerts: AlertView[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  function ack(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await acknowledgeAlertAction(id);
      setPendingId(null);
      if (!result.ok) toast.error(result.message);
      else {
        toast.success("Alert acknowledged");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <Card key={a.id} className={a.acknowledged ? "opacity-60" : "border-danger/40"}>
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-danger-bg text-danger">
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{a.reviewAuthor ?? "A customer"}</span>
                  {a.reviewRating != null && <RatingStars value={a.reviewRating} size="sm" />}
                  {a.acknowledged && <Badge variant="success">Handled</Badge>}
                </div>
                {a.reviewText && <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{a.reviewText}</p>}
                <p className="mt-1 text-xs text-text-tertiary">
                  {a.createdAt ? formatRelativeTime(a.createdAt) : ""}
                </p>
              </div>
            </div>
            {!a.acknowledged && (
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<Check />}
                loading={pendingId === a.id}
                onClick={() => ack(a.id)}
              >
                Mark handled
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
