/**
 * Reusable Motion variants & transitions — the single source of animation truth.
 * See Docs/DESIGN_SYSTEM.md §5. Animate transform/opacity only (60fps).
 */
import type { Transition, Variants } from "motion/react";

export const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

export const spring: Transition = { type: "spring", stiffness: 300, damping: 30 };
export const springSnappy: Transition = { type: "spring", stiffness: 400, damping: 32 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT_EXPO } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
};

/** Parent container that staggers its children on mount. */
export const staggerContainer = (stagger = 0.04, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
};

/** Modal/dialog content. */
export const dialogContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.12 } },
};
