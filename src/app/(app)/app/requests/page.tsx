import type { Metadata } from "next";
import Link from "next/link";
import { Send, UserPlus } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { formatRelativeTime } from "@/shared/lib/format";
import { SendRequestPanel } from "@/features/review-requests/presentation/components/send-request-panel";

export const metadata: Metadata = { title: "Review requests" };

const STATUS_VARIANT: Record<string, "neutral" | "brand" | "success" | "danger"> = {
  queued: "neutral",
  sent: "brand",
  delivered: "brand",
  clicked: "success",
  reviewed: "success",
  failed: "danger",
};

export default async function RequestsPage() {
  const businessId = await getActiveBusinessId();
  const { resolve } = await getServerContainer();

  const [customersRes, requestsRes] = businessId
    ? await Promise.all([
        resolve(TOKENS.ListCustomersUseCase).execute({ businessId, page: 1, pageSize: 50 }),
        resolve(TOKENS.ListRequestsUseCase).execute({ businessId, page: 1, pageSize: 20 }),
      ])
    : [null, null];

  const customers = customersRes?.isOk() ? customersRes.value.items : [];
  const requests = requestsRes?.isOk() ? requestsRes.value.items : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review requests"
        description="Send 1-click Google review links over WhatsApp and track every status."
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Send />}
          title="No customers to message yet"
          description="Add customers, then send them a friendly WhatsApp with a 1-click review link. We'll track sent, delivered, clicked, and reviewed."
          action={
            <Button asChild variant="outline" leadingIcon={<UserPlus />}>
              <Link href="/app/customers">Add customers first</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-text-secondary">Choose a customer to ask</h2>
            <SendRequestPanel
              customers={customers.map((c) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                consent: c.consent,
              }))}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-text-secondary">Recent requests</h2>
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {requests.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-tertiary">No requests sent yet.</p>
                ) : (
                  requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-text-tertiary">
                        {r.createdAt ? formatRelativeTime(r.createdAt) : ""}
                      </span>
                      <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"}>{r.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
