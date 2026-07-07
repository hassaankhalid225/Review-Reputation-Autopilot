import type { Metadata } from "next";
import { Bot, Star, Sparkles, TriangleAlert, ScanSearch, PencilLine, Send } from "lucide-react";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { isClaudeConfigured } from "@/network/claude/client";
import { AutopilotPanel } from "@/features/ai-replies/presentation/components/autopilot-panel";
import { AiSettingsForm } from "@/features/businesses/presentation/components/ai-settings-form";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { StatCard } from "@/shared/ui/patterns/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { BRAND_TONES, LANGUAGES } from "@/core/config/constants";

export const metadata: Metadata = { title: "AI Autopilot" };

const STEPS = [
  {
    icon: ScanSearch,
    title: "Finds reviews",
    body: "Autopilot scans reviews that still need a reply across your connected platforms.",
  },
  {
    icon: PencilLine,
    title: "Drafts in your voice",
    body: "Each reply is written using your tone, templates, brand facts, and language.",
  },
  {
    icon: Send,
    title: "You approve or auto-post",
    body: "High-rated reviews can post automatically; the rest wait for your one-click approval.",
  },
];

export default async function AutopilotPage() {
  const { active } = await getTenantContext();
  const aiConfigured = isClaudeConfigured();

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Autopilot" description="Let AI handle your review replies." />
        <EmptyState
          icon={<Bot />}
          title="No business yet"
          description="Create a business to set up your AI reply system."
        />
      </div>
    );
  }

  const { resolve } = await getServerContainer();
  const list = await resolve(TOKENS.ListReviewsUseCase).execute({
    businessId: active.id,
    filter: "needs_reply",
    page: 1,
    pageSize: 1,
  });
  const pendingCount = list.isOk() ? list.value.total : 0;

  const tone = BRAND_TONES.find((t) => t.id === active.brandTone)?.label ?? active.brandTone;
  const language = LANGUAGES.find((l) => l.code === active.replyLanguage)?.label ?? active.replyLanguage;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Autopilot"
        description="Handle every review reply on autopilot — in your own brand voice."
      />

      {!aiConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-bg/40 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-fg" />
          <div className="text-sm">
            <p className="font-medium text-text-primary">AI replies aren&apos;t configured yet</p>
            <p className="mt-0.5 text-text-secondary">
              Add an Anthropic API key to your environment to switch Autopilot on.
            </p>
          </div>
        </div>
      )}

      <AutopilotPanel
        businessId={active.id}
        enabled={active.autopilotEnabled}
        autoPost={active.autopilotAutoPost}
        minRating={active.autopilotMinRating}
        aiConfigured={aiConfigured}
        pendingCount={pendingCount}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting reply" value={pendingCount} icon={<Star />} />
        <StatCard
          label="Posting mode"
          value={active.autopilotAutoPost ? `Auto ${active.autopilotMinRating}★+` : "Draft only"}
          icon={<Sparkles />}
        />
        <StatCard label="Reply voice" value={tone} icon={<Bot />} suffix={<span className="text-sm text-text-tertiary">· {language}</span>} />
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How Autopilot works</CardTitle>
          <CardDescription>Three steps, fully hands-off when you want it.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-col gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <s.icon className="size-[18px]" />
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {i + 1}. {s.title}
              </p>
              <p className="text-[13px] text-text-tertiary">{s.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configure the AI system — right here, no need to leave this screen */}
      <Card>
        <CardHeader>
          <CardTitle>Configure your AI system</CardTitle>
          <CardDescription>
            The voice, templates, facts, and auto-post rules Autopilot uses. Changes save right here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiSettingsForm businessId={active.id} business={active} />
        </CardContent>
      </Card>
    </div>
  );
}
