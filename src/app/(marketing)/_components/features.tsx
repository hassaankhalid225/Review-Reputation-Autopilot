"use client";

import { motion } from "motion/react";
import { MessageSquarePlus, Sparkles, BellRing, LineChart, ShieldCheck } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { fadeUp, staggerContainer } from "@/shared/motion/variants";

const FEATURES = [
  {
    icon: MessageSquarePlus,
    title: "Review request engine",
    body: "Send a 1-click Google review link over WhatsApp or SMS. Add customers manually, by CSV, or from your POS.",
  },
  {
    icon: LineChart,
    title: "Live review monitor",
    body: "Every new Google review lands on one dashboard within minutes — with rating trends and response rate.",
  },
  {
    icon: Sparkles,
    title: "AI reply drafts",
    body: "Claude drafts a professional, on-brand reply for every review. Approve, edit, or regenerate in one click.",
  },
  {
    icon: BellRing,
    title: "Instant bad-review alerts",
    body: "A 1–2 star review triggers a WhatsApp alert immediately, so you can fix it before it does damage.",
  },
  {
    icon: ShieldCheck,
    title: "100% Google-compliant",
    body: "No review gating — every customer gets the same public invite. You grow reviews the right way.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Everything your reputation needs
        </h2>
        <p className="mt-4 text-lg text-text-secondary">
          Five features that run the full review lifecycle — so you can focus on running your business.
        </p>
      </div>

      <motion.div
        variants={staggerContainer(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.title} variants={fadeUp}>
            <Card interactive className="h-full p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.body}</p>
            </Card>
          </motion.div>
        ))}

        {/* Highlight tile */}
        <motion.div variants={fadeUp}>
          <Card className="flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
            <Sparkles className="size-6" />
            <div className="mt-8">
              <p className="text-2xl font-semibold leading-tight">From 4.1 to 4.7 stars in 60 days.</p>
              <p className="mt-2 text-sm text-white/80">That&apos;s what happens when you ask, reply, and respond — automatically.</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}
