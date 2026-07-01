"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Phone } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { sendRequestAction } from "../request.actions";

export interface SendableCustomer {
  id: string;
  name: string | null;
  phone: string;
  consent: boolean;
}

export function SendRequestPanel({ customers }: { customers: SendableCustomer[] }) {
  const router = useRouter();
  const [sendingId, setSendingId] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  function send(id: string) {
    setSendingId(id);
    startTransition(async () => {
      const result = await sendRequestAction({ customerId: id });
      setSendingId(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.data.status === "sent" ? "Request sent" : "Request queued");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {customers.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{c.name ?? "Customer"}</p>
              <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <Phone className="size-3" />
                {c.phone}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              leadingIcon={<Send />}
              loading={sendingId === c.id}
              disabled={!c.consent || sendingId !== null}
              onClick={() => send(c.id)}
            >
              {c.consent ? "Send request" : "No consent"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
