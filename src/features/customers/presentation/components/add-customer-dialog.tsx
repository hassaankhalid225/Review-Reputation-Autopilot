"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { addCustomerAction } from "../customer.actions";

export function AddCustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [consent, setConsent] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCustomerAction({ name: name || null, phone, consent });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success("Customer added");
      setName("");
      setPhone("");
      setConsent(true);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button leadingIcon={<UserPlus />}>Add customer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a customer</DialogTitle>
          <DialogDescription>
            We&apos;ll use their WhatsApp number to send a review request when you&apos;re ready.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" hint="Optional — helps personalize the message.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ayesha" autoFocus />
          </Field>
          <Field label="Phone number" required error={error ?? undefined}>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              invalid={!!error}
              inputMode="tel"
            />
          </Field>
          <label className="flex items-start gap-2.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-[var(--color-primary)]"
            />
            <span>This customer agreed to receive messages from my business.</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!phone.trim()}>
              Add customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
