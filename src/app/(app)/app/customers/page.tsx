import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { AddCustomerDialog } from "@/features/customers/presentation/components/add-customer-dialog";
import { ImportCsvDialog } from "@/features/customers/presentation/components/import-csv-dialog";
import { CustomersTable } from "@/features/customers/presentation/components/customers-table";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const businessId = await getActiveBusinessId();

  const { resolve } = await getServerContainer();
  const result = businessId
    ? await resolve(TOKENS.ListCustomersUseCase).execute({
        businessId,
        search: q,
        page: Number(pageParam) || 1,
        pageSize: 20,
      })
    : null;

  const data = result?.isOk() ? result.value : null;
  const hasCustomers = (data?.total ?? 0) > 0 || q.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Your customer list — add manually or import a CSV to start requesting reviews."
        actions={
          <>
            <ImportCsvDialog />
            <AddCustomerDialog />
          </>
        }
      />

      {data && hasCustomers ? (
        <CustomersTable
          key={q}
          customers={data.items}
          total={data.total}
          page={data.page}
          pageCount={data.pageCount}
          search={q}
        />
      ) : (
        <EmptyState
          icon={<Users />}
          title="No customers yet"
          description="Add a customer's phone number to send them a review request, or bulk-import your existing customers from a CSV file."
          action={<AddCustomerDialog />}
        />
      )}
    </div>
  );
}
