"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { RatingStars } from "@/shared/ui/rating-stars";
import { fadeUp, staggerContainer } from "@/shared/motion/variants";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-radial-faded opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-400/30 via-brand-500/20 to-transparent blur-3xl" />

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:pt-28">
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-xs">
              <Sparkles className="size-3.5 text-brand-500" />
              AI-powered review automation for local businesses
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-6xl"
          >
            Turn happy customers into{" "}
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
              5-star reviews
            </span>{" "}
            — on autopilot.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-text-secondary"
          >
            Collect more Google reviews over WhatsApp, reply to every review with AI, and get an instant
            alert the moment a bad review lands. Everything your reputation needs, in one calm dashboard.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" trailingIcon={<ArrowRight />}>
              <Link href="/signup">Start your free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how">See how it works</Link>
            </Button>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-sm text-text-tertiary">
            14-day free trial · No credit card · Cancel anytime
          </motion.p>
        </motion.div>

        {/* Product preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative rounded-2xl border border-border bg-surface p-2 shadow-xl">
      <div className="rounded-xl border border-border bg-background">
        {/* Fake window bar */}
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="size-3 rounded-full bg-danger/60" />
          <span className="size-3 rounded-full bg-warning/60" />
          <span className="size-3 rounded-full bg-success/60" />
          <span className="ml-3 text-xs text-text-tertiary">app.reputationautopilot.com</span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {/* Stat tiles */}
          <PreviewStat label="Average rating" value="4.8" trend="+0.4" star />
          <PreviewStat label="Total reviews" value="247" trend="+38" />
          <PreviewStat label="Response rate" value="96%" trend="+21%" />

          {/* Review card */}
          <div className="sm:col-span-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  AS
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Ayesha S.</p>
                  <RatingStars value={5} size="sm" />
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Sparkles className="size-3" /> AI reply ready
              </span>
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              “Best biryani in town and the service was so quick. Will definitely come back!”
            </p>
            <div className="mt-3 rounded-md border border-dashed border-border bg-surface-2 p-3 text-sm text-text-secondary">
              <span className="text-brand-600 dark:text-brand-400">Reply draft:</span> Thank you so much,
              Ayesha! We’re thrilled you loved the biryani — see you again soon. 🙌
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  trend,
  star,
}: {
  label: string;
  value: string;
  trend: string;
  star?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-2xl font-semibold tabular-nums text-text-primary">{value}</span>
        {star && <Star className="size-4 fill-star text-star" />}
      </div>
      <span className="mt-1 inline-block rounded-full bg-success-bg px-1.5 py-0.5 text-[11px] font-medium text-success-fg">
        {trend}
      </span>
    </div>
  );
}
