"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { WidgetConfig } from "../../domain/widget.ports";
import { saveWidgetSettingsAction } from "../widget.actions";

const DEFAULTS: WidgetConfig = {
  enabled: true,
  minRating: 4,
  theme: "auto",
  layout: "grid",
  accent: "#4f46e5",
  headline: null,
  maxReviews: 6,
};

export function WidgetSettingsForm({ initial }: { initial: WidgetConfig | null }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [config, setConfig] = React.useState<WidgetConfig>(initial ?? DEFAULTS);

  function set<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveWidgetSettingsAction({
        enabled: config.enabled,
        minRating: config.minRating,
        theme: config.theme,
        layout: config.layout,
        accent: config.accent,
        headline: config.headline?.trim() || null,
        maxReviews: config.maxReviews,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Widget settings saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-text-primary">Widget enabled</span>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
          className="size-4 rounded border-border accent-[var(--color-primary)]"
        />
      </label>

      <Field label="Headline" hint="Shown above the reviews. Leave blank for a smart default.">
        <Input
          value={config.headline ?? ""}
          onChange={(e) => set("headline", e.target.value || null)}
          placeholder="What our customers say"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum rating to show">
          <Select value={String(config.minRating)} onValueChange={(v) => set("minRating", Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 4, 3].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}★ and above
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Layout">
          <Select value={config.layout} onValueChange={(v) => set("layout", v as WidgetConfig["layout"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Theme">
          <Select value={config.theme} onValueChange={(v) => set("theme", v as WidgetConfig["theme"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Max reviews">
          <Select value={String(config.maxReviews)} onValueChange={(v) => set("maxReviews", Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 6, 9, 12].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Accent colour">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.accent}
            onChange={(e) => set("accent", e.target.value)}
            className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={config.accent}
            onChange={(e) => set("accent", e.target.value)}
            className="max-w-[140px]"
          />
        </div>
      </Field>

      <Button leadingIcon={<Save />} loading={pending} onClick={save}>
        Save widget settings
      </Button>
    </div>
  );
}
