"use client";

import { motion } from "motion/react";
import { PartyPopper } from "lucide-react";
import { staggerContainer, listItem } from "@/shared/motion/variants";

export function StepDone({ businessName }: { businessName: string }) {
  const name = businessName.trim() || "your business";
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center gap-4 py-4 text-center"
    >
      <motion.div
        variants={listItem}
        className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg"
      >
        <PartyPopper className="size-8" />
      </motion.div>
      <motion.h2 variants={listItem} className="text-2xl font-semibold tracking-tight text-text-primary">
        You&apos;re all set!
      </motion.h2>
      <motion.p variants={listItem} className="max-w-sm text-sm text-text-secondary">
        {name} is ready to grow on autopilot. Add a few customers and send your first review request — your
        rating starts climbing today.
      </motion.p>
    </motion.div>
  );
}
