"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/shared/motion/variants";

const STEPS = [
  {
    n: "01",
    title: "Connect your Google profile",
    body: "Sign up and link your Google Business Profile in under 5 minutes. We import your existing reviews instantly.",
  },
  {
    n: "02",
    title: "Send review requests",
    body: "Add a customer's number and we send a friendly WhatsApp with a 1-click review link. They tap, they review.",
  },
  {
    n: "03",
    title: "Reply & relax",
    body: "New reviews appear with an AI-drafted reply. Bad reviews ping your phone. Your rating climbs on autopilot.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-text-secondary">Three steps. No technical setup. No training.</p>
        </div>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mt-16 grid gap-10 md:grid-cols-3"
        >
          {STEPS.map((s, i) => (
            <motion.div key={s.n} variants={fadeUp} className="relative">
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-600 font-mono text-sm font-semibold text-white shadow-md">
                {s.n}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute left-12 top-6 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-border to-transparent md:block" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
