"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Search, Trash2, Phone } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { formatRelativeTime } from "@/shared/lib/format";
import type { CustomerView } from "../../application/customer.dto";
import { deleteCustomerAction } from "../customer.actions";

export function CustomersTable({
  customers,
  total,
  page,
  pageCount,
  search,
}: {
  customers: CustomerView[];
  total: number;
  page: number;
  pageCount: number;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  function pushQuery(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  // Debounced search. `key={search}` on the parent resets this state when the
  // server-side query changes, so no re-sync effect is needed.
  const [term, setTerm] = React.useState(search);
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (term !== search) pushQuery({ q: term || null, page: null });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCustomerAction(id);
      if (!result.ok) toast.error(result.message);
      else {
        toast.success("Customer removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name or phone…"
          leadingIcon={<Search />}
          className="max-w-xs"
        />
        <span className="text-sm text-text-tertiary">
          {total} customer{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="px-4 py-2.5 font-medium">Consent</th>
              <th className="px-4 py-2.5 font-medium">Last request</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-3 font-medium text-text-primary">{c.name ?? "—"}</td>
                <td className="px-4 py-3 text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 text-text-tertiary" />
                    {c.phone}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.consent ? (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success-fg">
                      Yes
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-text-tertiary">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-tertiary">
                  {c.lastRequestAt ? formatRelativeTime(c.lastRequestAt) : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions" disabled={pending}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem destructive onClick={() => remove(c.id)}>
                        <Trash2 /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => pushQuery({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-text-tertiary">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => pushQuery({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
