"use client";

/**
 * AutopilotPanel — the control surface for the AI reply system. Lets the owner
 * flip Autopilot on/off and run it on demand across reviews awaiting a reply.
 * Full configuration lives in Settings; this is the "handle it" cockpit.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Zap } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { updateBusinessAction } from "@/features/businesses/presentation/business.actions";
import { runAutopilotAction } from "../autopilot.actions";

export function AutopilotPanel({
  businessId,
  enabled,
  autoPost,
  minRating,
  aiConfigured,
  pendingCount,
}: {
  businessId: string;
  enabled: boolean;
  autoPost: boolean;
  minRating: number;
  aiConfigured: boolean;
  pendingCount: number;
}) {
  const router = useRouter();
  const [on, setOn] = React.useState(enabled);
  const [savingToggle, startToggle] = React.useTransition();
  const [running, startRun] = React.useTransition();

  function toggle(next: boolean) {
    setOn(next); // optimistic
    startToggle(async () => {
      const result = await updateBusinessAction({ businessId, autopilotEnabled: next });
      if (!result.ok) {
        setOn(!next);
        toast.error(result.message);
        return;
      }
      toast.success(next ? "Autopilot turned on" : "Autopilot turned off");
      router.refresh();
    });
  }

  function run() {
    startRun(async () => {
      const result = await runAutopilotAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const { total, drafted, posted } = result.data;
      if (total === 0) {
        toast.success("You're all caught up — no reviews need a reply.");
      } else {
        toast.success(
          `Autopilot handled ${drafted} review${drafted === 1 ? "" : "s"}` +
            (posted ? ` — ${posted} posted automatically.` : " — drafts ready to review."),
        );
      }
      router.refresh();
    });
  }

  const mode = autoPost ? `Auto-posts ${minRating}★+ reviews` : "Drafts replies for your approval";

  return (
    <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={
              "grid size-12 shrink-0 place-items-center rounded-xl " +
              (on ? "bg-primary/10 text-primary" : "bg-surface-2 text-text-tertiary")
            }
          >
            <Zap className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-text-primary">AI Autopilot</h2>
              <Badge variant={on ? "success" : "neutral"}>{on ? "Active" : "Off"}</Badge>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {on
                ? mode
                : "Turn on to let AI reply to your reviews in your brand voice."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:pt-1">
          <span className="text-sm text-text-tertiary">{on ? "On" : "Off"}</span>
          <Switch checked={on} onCheckedChange={toggle} disabled={savingToggle || !aiConfigured} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          {pendingCount > 0 ? (
            <>
              <span className="font-semibold text-text-primary">{pendingCount}</span> review
              {pendingCount === 1 ? "" : "s"} waiting for a reply.
            </>
          ) : (
            "No reviews are waiting for a reply right now."
          )}
        </p>
        <Button
          leadingIcon={<Play />}
          loading={running}
          disabled={!aiConfigured || pendingCount === 0}
          onClick={run}
        >
          Run Autopilot now
        </Button>
      </div>
    </div>
  );
}
