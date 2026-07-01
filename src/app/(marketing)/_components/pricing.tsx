"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { fadeUp, staggerContainer } from "@/shared/motion/variants";

const TIERS = [
  {
    name: "Starter",
    priceLocal: "₨1,500",
    priceUsd: "$29",
    tagline: "For a single location getting started.",
    features: ["1 location", "300 review requests / mo", "Unlimited AI replies", "Bad-review alerts", "Live dashboard"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    priceLocal: "₨4,000",
    priceUsd: "$79",
    tagline: "For growing, multi-location businesses.",
    features: [
      "Up to 5 locations",
      "1,500 review requests / mo",
      "Unlimited AI replies",
      "Bad-review alerts + escalation",
      "Competitor view",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Simple, honest pricing
        </h2>
        <p className="mt-4 text-lg text-text-secondary">
          Start with a 14-day free trial. Local pricing for Pakistan & India, USD everywhere else.
        </p>
      </div>

      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2"
      >
        {TIERS.map((t) => (
          <motion.div key={t.name} variants={fadeUp}>
            <Card
              className={cn(
                "relative flex h-full flex-col p-7",
                t.highlight && "border-brand-300 shadow-lg ring-1 ring-brand-300 dark:border-brand-700 dark:ring-brand-700",
              )}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-text-primary">{t.name}</h3>
              <p className="mt-1 text-sm text-text-secondary">{t.tagline}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-text-primary">{t.priceLocal}</span>
                <span className="text-sm text-text-tertiary">/mo · {t.priceUsd}</span>
              </div>

              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-1">
                <Button asChild className="w-full" variant={t.highlight ? "primary" : "outline"}>
                  <Link href="/signup">{t.cta}</Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
