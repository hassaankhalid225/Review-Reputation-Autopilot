"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { BRAND_TONES } from "@/core/config/constants";
import type { BrandTone } from "../../domain/business.entity";
import { updateBusinessAction } from "../business.actions";

export function BrandVoiceForm({
  businessId,
  current,
}: {
  businessId: string;
  current: BrandTone;
}) {
  const router = useRouter();
  const [tone, setTone] = React.useState<BrandTone>(current);
  const [pending, startTransition] = React.useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateBusinessAction({ businessId, brandTone: tone });
      if (!result.ok) toast.error(result.message);
      else {
        toast.success("Brand voice saved");
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {BRAND_TONES.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20"
          >
            <input
              type="radio"
              name="tone"
              value={t.id}
              checked={tone === t.id}
              onChange={() => setTone(t.id as BrandTone)}
              className="sr-only"
            />
            <span className="text-sm font-medium text-text-primary">{t.label}</span>
            <span className="text-xs text-text-tertiary">{t.hint}</span>
          </label>
        ))}
      </div>
      <div className="mt-5">
        <Button loading={pending} disabled={tone === current && !pending} onClick={save}>
          Save changes
        </Button>
      </div>
    </>
  );
}
