"use client";

/**
 * BrandProfileForm — the owner's brand identity & business details (Settings).
 * Pure brand content: business info, contact, social, logo & colour. AI voice,
 * templates and automation live on the AI Autopilot page instead.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Save, AtSign, Palette, Globe, Phone, MessageCircle, Mail, Store } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Field } from "@/shared/ui/label";
import { Card, CardContent } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { BUSINESS_CATEGORIES, CURRENCIES, TIMEZONES, SOCIAL_PLATFORMS } from "@/core/config/constants";
import type { BusinessView, SocialLinks } from "../../application/business.dto";
import { updateBusinessAction } from "../business.actions";
import { diffObject } from "./form-helpers";

type FormState = {
  name: string;
  category: string;
  tagline: string;
  description: string;
  city: string;
  country: string;
  address: string;
  timezone: string;
  currency: string;
  website: string;
  publicEmail: string;
  phone: string;
  whatsapp: string;
  socials: SocialLinks;
  logoUrl: string;
  brandColor: string;
};

function toForm(b: BusinessView): FormState {
  return {
    name: b.name,
    category: b.category ?? "",
    tagline: b.tagline ?? "",
    description: b.description ?? "",
    city: b.city ?? "",
    country: b.country ?? "",
    address: b.address ?? "",
    timezone: b.timezone,
    currency: b.currency,
    website: b.website ?? "",
    publicEmail: b.publicEmail ?? "",
    phone: b.phone ?? "",
    whatsapp: b.whatsapp ?? "",
    socials: { ...b.socials },
    logoUrl: b.logoUrl ?? "",
    brandColor: b.brandColor ?? "#4f46e5",
  };
}

export function BrandProfileForm({
  businessId,
  business,
}: {
  businessId: string;
  business: BusinessView;
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState<FormState>(() => toForm(business));
  const [form, setForm] = React.useState<FormState>(saved);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setSocial(key: keyof SocialLinks, value: string) {
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }));
  }

  const patch = React.useMemo(() => diffObject(saved, form), [saved, form]);
  const dirty = Object.keys(patch).length > 0;

  function save() {
    if (!dirty) return;
    startTransition(async () => {
      const result = await updateBusinessAction({ businessId, ...patch });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSaved(form);
      toast.success("Brand saved");
      router.refresh();
    });
  }

  const initial = (form.name || "B").trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Live brand preview */}
      <Card className="overflow-hidden">
        <div className="h-14" style={{ background: form.brandColor }} />
        <CardContent className="flex items-center gap-4 pt-0">
          <div
            className="-mt-8 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-surface-2 text-xl font-bold text-text-primary shadow-sm"
            style={{ color: form.brandColor }}
          >
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 pt-1">
            <p className="truncate text-base font-semibold text-text-primary">
              {form.name || "Your business"}
            </p>
            <p className="truncate text-sm text-text-tertiary">
              {form.tagline || form.category || "Add a tagline to describe your brand"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">
            <Building2 /> Business
          </TabsTrigger>
          <TabsTrigger value="contact">
            <AtSign /> Contact &amp; social
          </TabsTrigger>
          <TabsTrigger value="identity">
            <Palette /> Brand identity
          </TabsTrigger>
        </TabsList>

        {/* ── BUSINESS ─────────────────────────────────────────────── */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={form.category || undefined} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Tagline" hint="A short line customers remember you by.">
            <Input
              value={form.tagline}
              maxLength={120}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Freshly roasted coffee, every morning."
            />
          </Field>

          <Field
            label="About your business"
            hint="Also used by AI to write on-brand replies. Mention what makes you special."
          >
            <Textarea
              value={form.description}
              maxLength={1200}
              rows={4}
              onChange={(e) => set("description", e.target.value)}
              placeholder="We're a family-run café in Lahore serving specialty coffee and fresh pastries since 2018…"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
            </Field>
          </div>

          <Field label="Address">
            <Input
              value={form.address}
              leadingIcon={<Store />}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Shop 12, Main Boulevard, Gulberg"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Timezone">
              <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </TabsContent>

        {/* ── CONTACT & SOCIAL ─────────────────────────────────────── */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website">
              <Input
                value={form.website}
                leadingIcon={<Globe />}
                onChange={(e) => set("website", e.target.value)}
                placeholder="yourbrand.com"
              />
            </Field>
            <Field label="Public email">
              <Input
                value={form.publicEmail}
                type="email"
                leadingIcon={<Mail />}
                onChange={(e) => set("publicEmail", e.target.value)}
                placeholder="hello@yourbrand.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                leadingIcon={<Phone />}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+92 300 1234567"
              />
            </Field>
            <Field label="WhatsApp" hint="Where review-request replies land.">
              <Input
                value={form.whatsapp}
                leadingIcon={<MessageCircle />}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+92 300 1234567"
              />
            </Field>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-text-primary">Social profiles</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_PLATFORMS.map((s) => (
                <Field key={s.key} label={s.label}>
                  <Input
                    value={form.socials[s.key] ?? ""}
                    onChange={(e) => setSocial(s.key, e.target.value)}
                    placeholder={s.placeholder}
                  />
                </Field>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── BRAND IDENTITY ───────────────────────────────────────── */}
        <TabsContent value="identity" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo URL" hint="Shown on your review page and widget.">
              <Input
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://…/logo.png"
              />
            </Field>
            <Field label="Brand colour">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => set("brandColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                  aria-label="Brand colour"
                />
                <Input
                  value={form.brandColor}
                  onChange={(e) => set("brandColor", e.target.value)}
                  className="max-w-[140px]"
                />
              </div>
            </Field>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 rounded-t-xl border-t border-border bg-surface/80 px-1 py-3 backdrop-blur">
        <p className="text-sm text-text-tertiary">
          {dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <Button leadingIcon={<Save />} loading={pending} disabled={!dirty} onClick={save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
