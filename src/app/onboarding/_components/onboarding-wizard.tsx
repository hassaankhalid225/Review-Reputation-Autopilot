"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Stepper } from "@/shared/ui/patterns/stepper";
import { Button } from "@/shared/ui/button";
import { createBusinessAction } from "@/features/businesses/presentation/business.actions";
import { StepBusiness, type BusinessDraft } from "./step-business";
import { StepConnectGoogle } from "./step-connect-google";
import { StepDone } from "./step-done";

const STEPS = ["Business", "Connect Google", "Done"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
};

export function OnboardingWizard() {
  const router = useRouter();
  const [[step, dir], setStep] = React.useState<[number, number]>([0, 0]);
  const [business, setBusiness] = React.useState<BusinessDraft>({ name: "", category: "", city: "" });
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const go = (next: number) => setStep([next, next > step ? 1 : -1]);

  /** Persist the business on first advance from step 0; never double-create. */
  async function handleContinue() {
    if (step !== 0) return go(step + 1);
    if (businessId) return go(1); // already created — user stepped back and forward

    setSaving(true);
    const result = await createBusinessAction({
      name: business.name,
      category: business.category || null,
      city: business.city || null,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setBusinessId(result.data.id);
    go(1);
  }

  const canContinue = step === 0 ? business.name.trim().length > 0 && business.category.length > 0 : true;

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} />

      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* A single keyed motion.div (no AnimatePresence): it re-mounts and
              plays the enter animation only when `step` changes — NOT on every
              keystroke — so controlled inputs keep their value and focus. */}
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            {step === 0 && <StepBusiness value={business} onChange={setBusiness} />}
            {step === 1 && <StepConnectGoogle connected={connected} onConnect={() => setConnected(true)} />}
            {step === 2 && <StepDone businessName={business.name} />}
          </motion.div>
        </CardContent>
      </Card>

      {/* Footer controls */}
      {step < 2 ? (
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" leadingIcon={<ArrowLeft />} onClick={() => go(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {step === 1 && (
              <Button variant="ghost" onClick={() => go(2)}>
                Skip for now
              </Button>
            )}
            <Button
              trailingIcon={<ArrowRight />}
              loading={saving}
              disabled={!canContinue || saving}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button size="lg" leadingIcon={<Sparkles />} onClick={() => router.push("/app")}>
            Go to dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
