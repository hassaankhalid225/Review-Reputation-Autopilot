"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-center shadow-xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
        <h2 className="relative text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your next 100 reviews are one tap away.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-lg text-white/80">
          Join local businesses growing their Google reputation on autopilot. Free for 14 days.
        </p>
        <div className="relative mt-8 flex justify-center">
          <Button asChild size="lg" variant="secondary" trailingIcon={<ArrowRight />}>
            <Link href="/signup">Start your free trial</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
