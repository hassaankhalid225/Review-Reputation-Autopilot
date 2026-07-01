"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";
import { createCheckoutAction, submitManualPaymentAction } from "../billing.actions";

type Plan = "starter" | "pro";

const TIERS: {
  id: Plan;
  name: string;
  price: string;
  usd: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "₨1,500",
    usd: "$29",
    features: ["1 location", "300 requests / mo", "Unlimited AI replies", "Bad-review alerts"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₨4,000",
    usd: "$79",
    features: ["Up to 5 locations", "1,500 requests / mo", "Unlimited AI replies", "Alerts + escalation", "Competitor view"],
    highlight: true,
  },
];

export function PlanCards({ currentPlan, paymentsEnabled }: { currentPlan: string; paymentsEnabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Plan | null>(null);
  const [, startTransition] = React.useTransition();

  function upgrade(plan: Plan) {
    setPending(plan);
    startTransition(async () => {
      if (paymentsEnabled) {
        const result = await createCheckoutAction({ plan });
        setPending(null);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        window.location.href = result.data.url;
      } else {
        // No card payments configured → record a manual upgrade request (local market).
        const result = await submitManualPaymentAction({ plan });
        setPending(null);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Upgrade requested — we'll confirm your payment shortly.");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {TIERS.map((t) => {
        const isCurrent = currentPlan === t.id;
        return (
          <Card
            key={t.id}
            className={cn(
              "flex flex-col p-6",
              t.highlight && "border-brand-300 ring-1 ring-brand-300 dark:border-brand-700 dark:ring-brand-700",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">{t.name}</h3>
              {isCurrent ? <Badge variant="success">Current</Badge> : t.highlight && <Badge variant="brand">Popular</Badge>}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-text-primary">{t.price}</span>
              <span className="text-sm text-text-tertiary">/mo · {t.usd}</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full"
              variant={t.highlight ? "primary" : "outline"}
              loading={pending === t.id}
              disabled={isCurrent || pending !== null}
              onClick={() => upgrade(t.id)}
            >
              {isCurrent ? "Your plan" : paymentsEnabled ? `Upgrade to ${t.name}` : `Request ${t.name}`}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
