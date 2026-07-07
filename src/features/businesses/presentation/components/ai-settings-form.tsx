"use client";

/**
 * AiSettingsForm — everything Autopilot uses to write replies (AI Autopilot page).
 * Reply voice, owner templates, brand facts, and auto-post rules. Pure brand
 * identity (logo, contact, socials) lives in Settings instead.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Save, MessagesSquare, Plus, Trash2, Info, Zap } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Field } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Switch } from "@/shared/ui/switch";
import { BRAND_TONES, LANGUAGES } from "@/core/config/constants";
import type {
  BusinessView,
  ReplyTemplate,
  BrandFact,
  ReplyTemplateTrigger,
} from "../../application/business.dto";
import type { BrandTone } from "../../domain/business.entity";
import { updateBusinessAction } from "../business.actions";
import { newId, diffObject } from "./form-helpers";

const TRIGGER_LABELS: Record<ReplyTemplateTrigger, string> = {
  any: "Any review",
  positive: "Positive (4–5★)",
  mixed: "Mixed (3★)",
  negative: "Negative (1–2★)",
};

type FormState = {
  brandTone: BrandTone;
  replyLanguage: string;
  aiSignature: string;
  languages: string[];
  aiContext: string;
  aiAvoid: string;
  replyTemplates: ReplyTemplate[];
  brandFacts: BrandFact[];
  autopilotAutoPost: boolean;
  autopilotMinRating: number;
};

function toForm(b: BusinessView): FormState {
  return {
    brandTone: b.brandTone,
    replyLanguage: b.replyLanguage,
    aiSignature: b.aiSignature ?? "",
    languages: b.languages.length ? b.languages : ["en"],
    aiContext: b.aiContext ?? "",
    aiAvoid: b.aiAvoid ?? "",
    replyTemplates: b.replyTemplates.map((t) => ({ ...t })),
    brandFacts: b.brandFacts.map((f) => ({ ...f })),
    autopilotAutoPost: b.autopilotAutoPost,
    autopilotMinRating: b.autopilotMinRating,
  };
}

export function AiSettingsForm({
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
  function toggleLanguage(code: string) {
    setForm((f) => {
      const has = f.languages.includes(code);
      const next = has ? f.languages.filter((c) => c !== code) : [...f.languages, code];
      return { ...f, languages: next.length ? next : ["en"] };
    });
  }

  // ── Reply templates ───────────────────────────────────────────────────
  function addTemplate() {
    setForm((f) => ({
      ...f,
      replyTemplates: [...f.replyTemplates, { id: newId(), title: "", trigger: "any", body: "" }],
    }));
  }
  function updateTemplate(id: string, patch: Partial<ReplyTemplate>) {
    setForm((f) => ({
      ...f,
      replyTemplates: f.replyTemplates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }
  function removeTemplate(id: string) {
    setForm((f) => ({ ...f, replyTemplates: f.replyTemplates.filter((t) => t.id !== id) }));
  }

  // ── Brand facts ───────────────────────────────────────────────────────
  function addFact() {
    setForm((f) => ({
      ...f,
      brandFacts: [...f.brandFacts, { id: newId(), label: "", value: "" }],
    }));
  }
  function updateFact(id: string, patch: Partial<BrandFact>) {
    setForm((f) => ({
      ...f,
      brandFacts: f.brandFacts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }
  function removeFact(id: string) {
    setForm((f) => ({ ...f, brandFacts: f.brandFacts.filter((x) => x.id !== id) }));
  }

  const patch = React.useMemo(() => diffObject(saved, form), [saved, form]);
  const dirty = Object.keys(patch).length > 0;

  function save() {
    if (!dirty) return;
    const cleaned: FormState = {
      ...form,
      replyTemplates: form.replyTemplates.filter((t) => t.title.trim() || t.body.trim()),
      brandFacts: form.brandFacts.filter((x) => x.label.trim() || x.value.trim()),
    };
    const cleanPatch = diffObject(saved, cleaned);
    if (Object.keys(cleanPatch).length === 0) {
      setForm(cleaned);
      setSaved(cleaned);
      return;
    }
    startTransition(async () => {
      const result = await updateBusinessAction({ businessId, ...cleanPatch });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setForm(cleaned);
      setSaved(cleaned);
      toast.success("AI settings saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="voice">
        <TabsList>
          <TabsTrigger value="voice">
            <Sparkles /> Reply voice
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MessagesSquare /> Replies &amp; facts
          </TabsTrigger>
          <TabsTrigger value="autopilot">
            <Zap /> Auto-post
          </TabsTrigger>
        </TabsList>

        {/* ── REPLY VOICE ──────────────────────────────────────────── */}
        <TabsContent value="voice" className="space-y-5">
          <Field label="Reply tone" hint="How AI drafts your review replies.">
            <div className="grid gap-3 sm:grid-cols-3">
              {BRAND_TONES.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20"
                >
                  <input
                    type="radio"
                    name="brandTone"
                    value={t.id}
                    checked={form.brandTone === t.id}
                    onChange={() => set("brandTone", t.id as BrandTone)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-text-primary">{t.label}</span>
                  <span className="text-xs text-text-tertiary">{t.hint}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reply language" hint="Language AI writes replies in.">
              <Select value={form.replyLanguage} onValueChange={(v) => set("replyLanguage", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reply signature" hint="Sign-off appended to replies.">
              <Input
                value={form.aiSignature}
                maxLength={120}
                onChange={(e) => set("aiSignature", e.target.value)}
                placeholder="— The team at Brew & Co."
              />
            </Field>
          </div>

          <Field label="Languages you serve">
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const active = form.languages.includes(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLanguage(l.code)}
                    aria-pressed={active}
                    className={
                      "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                      (active
                        ? "border-primary bg-brand-50 text-primary dark:bg-brand-900/20"
                        : "border-border text-text-tertiary hover:border-border-strong")
                    }
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="What should AI mention?"
            hint="Key strengths, offers, or values to weave into replies (optional)."
          >
            <Textarea
              value={form.aiContext}
              maxLength={1500}
              rows={3}
              onChange={(e) => set("aiContext", e.target.value)}
              placeholder="Free home delivery over ₨2,000 · loyalty card · halal-certified kitchen"
            />
          </Field>

          <Field label="Words &amp; topics to avoid" hint="AI will steer clear of these.">
            <Input
              value={form.aiAvoid}
              maxLength={400}
              onChange={(e) => set("aiAvoid", e.target.value)}
              placeholder="discounts, refunds, competitor names"
            />
          </Field>
        </TabsContent>

        {/* ── REPLIES & FACTS ──────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-8">
          {/* Reply templates */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Your reply templates</h3>
                <p className="text-[13px] text-text-tertiary">
                  Write replies in your own words. AI matches your style, and you can post them as-is.
                </p>
              </div>
              <Button variant="secondary" size="sm" leadingIcon={<Plus />} onClick={addTemplate}>
                Add template
              </Button>
            </div>

            {form.replyTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-text-tertiary">
                No templates yet. Add one to teach the AI your voice — or to reuse a go-to reply.
              </div>
            ) : (
              <div className="space-y-3">
                {form.replyTemplates.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={t.title}
                        maxLength={60}
                        onChange={(e) => updateTemplate(t.id, { title: e.target.value })}
                        placeholder="Template name (e.g. 5-star thank you)"
                        className="sm:flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Select
                          value={t.trigger}
                          onValueChange={(v) =>
                            updateTemplate(t.id, { trigger: v as ReplyTemplateTrigger })
                          }
                        >
                          <SelectTrigger className="w-[170px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(TRIGGER_LABELS) as ReplyTemplateTrigger[]).map((k) => (
                              <SelectItem key={k} value={k}>
                                {TRIGGER_LABELS[k]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove template"
                          onClick={() => removeTemplate(t.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={t.body}
                      maxLength={800}
                      rows={3}
                      onChange={(e) => updateTemplate(t.id, { body: e.target.value })}
                      placeholder="Thank you so much, {name}! We're thrilled you enjoyed your visit and can't wait to welcome you back."
                      className="mt-3"
                    />
                  </div>
                ))}
                <p className="flex items-center gap-1.5 text-[13px] text-text-tertiary">
                  <Info className="size-3.5" /> Tip: add {"{name}"} as a placeholder for the reviewer
                  name — the AI fills it in.
                </p>
              </div>
            )}
          </section>

          {/* Brand facts */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Brand facts</h3>
                <p className="text-[13px] text-text-tertiary">
                  Add anything about your business — hours, offers, policies. AI can reference these.
                </p>
              </div>
              <Button variant="secondary" size="sm" leadingIcon={<Plus />} onClick={addFact}>
                Add fact
              </Button>
            </div>

            {form.brandFacts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-text-tertiary">
                No facts yet. Add things like “Delivery — free over ₨2,000” or “Hours — 9am to 11pm”.
              </div>
            ) : (
              <div className="space-y-2">
                {form.brandFacts.map((x) => (
                  <div key={x.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={x.label}
                      maxLength={60}
                      onChange={(e) => updateFact(x.id, { label: e.target.value })}
                      placeholder="Label (e.g. Delivery)"
                      className="sm:w-56"
                    />
                    <Input
                      value={x.value}
                      maxLength={300}
                      onChange={(e) => updateFact(x.id, { value: e.target.value })}
                      placeholder="Value (e.g. Free over ₨2,000, 30 mins)"
                      className="sm:flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove fact"
                      onClick={() => removeFact(x.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ── AUTO-POST ────────────────────────────────────────────── */}
        <TabsContent value="autopilot" className="space-y-4">
          <p className="flex items-center gap-1.5 text-[13px] text-text-tertiary">
            <Info className="size-3.5" /> Turn Autopilot on or off from the panel at the top of this
            page.
          </p>

          <label className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <span>
              <span className="block text-sm font-medium text-text-primary">
                Auto-post positive replies
              </span>
              <span className="mt-0.5 block text-[13px] text-text-tertiary">
                Post replies to high-rated reviews without approval. Lower ratings stay as drafts.
              </span>
            </span>
            <Switch
              checked={form.autopilotAutoPost}
              onCheckedChange={(v) => set("autopilotAutoPost", v)}
            />
          </label>

          <Field
            label="Auto-post threshold"
            hint="Only reviews at or above this rating are posted automatically."
          >
            <Select
              value={String(form.autopilotMinRating)}
              onValueChange={(v) => set("autopilotMinRating", Number(v))}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}★ and above
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
