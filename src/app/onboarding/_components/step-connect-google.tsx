"use client";

import * as React from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Star, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { startGoogleConnectAction } from "@/features/google-locations/presentation/google.actions";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335" />
    </svg>
  );
}

export function StepConnectGoogle({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  const [connecting, setConnecting] = React.useState(false);

  async function handleConnect() {
    setConnecting(true);
    const result = await startGoogleConnectAction();
    if (!result.ok) {
      setConnecting(false);
      // Google not configured yet → let the user proceed; they can connect later.
      toast.message(result.message, { description: "You can connect Google later from Settings." });
      onConnect();
      return;
    }
    // Hand off to Google's consent screen; we return to /onboarding?google=connected.
    window.location.href = result.data.url;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Connect Google Business Profile</h2>
        <p className="text-sm text-text-secondary">We&apos;ll import your reviews and let you reply right from here.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-6">
        {connected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <div className="grid size-12 place-items-center rounded-full bg-success-bg text-success-fg">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Google connected</p>
              <p className="text-sm text-text-secondary">Importing your existing reviews…</p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-surface shadow-sm">
              <GoogleGlyph />
            </div>
            <Button size="lg" loading={connecting} onClick={handleConnect}>
              {connecting ? "Connecting…" : "Connect Google Business Profile"}
            </Button>
          </div>
        )}
      </div>

      <ul className="space-y-2.5 text-sm text-text-secondary">
        <li className="flex items-center gap-2.5">
          <Star className="size-4 text-brand-500" /> Import all your existing reviews instantly
        </li>
        <li className="flex items-center gap-2.5">
          <Loader2 className="size-4 text-brand-500" /> Auto-sync new reviews every few minutes
        </li>
        <li className="flex items-center gap-2.5">
          <ShieldCheck className="size-4 text-brand-500" /> Read-only + reply access. We never post without you.
        </li>
      </ul>
    </div>
  );
}
