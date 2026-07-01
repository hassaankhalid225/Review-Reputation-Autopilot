import Link from "next/link";
import { Lock, Building2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

/**
 * Shown in the app shell when the user skipped onboarding and has no business yet.
 * The dashboard chrome stays visible but the workspace is gated until they add
 * their business details (see onboarding "Skip for now").
 */
export function CompleteSetupGate() {
  return (
    <div className="space-y-5">
      {/* Persistent nudge banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-fg/20 bg-warning-bg px-4 py-3">
        <p className="text-sm font-medium text-warning-fg">
          Finish setting up — add your business details to unlock your dashboard.
        </p>
        <Button asChild size="sm">
          <Link href="/onboarding">Add details</Link>
        </Button>
      </div>

      {/* Locked workspace placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-text-tertiary">
            <Lock className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              Your workspace is locked
            </h2>
            <p className="mx-auto max-w-sm text-sm text-text-secondary">
              You skipped this step, so there’s nothing to show yet. Add your business details to
              start collecting reviews and replies.
            </p>
          </div>
          <Button asChild>
            <Link href="/onboarding">
              <Building2 />
              Add business details
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
