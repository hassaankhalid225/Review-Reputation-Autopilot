"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { importCustomersAction } from "../customer.actions";

export function ImportCsvDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [csv, setCsv] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCsv(await file.text());
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await importCustomersAction({ csv });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const { imported, invalid, duplicatesInFile } = result.data;
      toast.success(`Imported ${imported} customer${imported === 1 ? "" : "s"}`, {
        description:
          invalid.length || duplicatesInFile
            ? `${invalid.length} invalid, ${duplicatesInFile} duplicate in file skipped.`
            : undefined,
      });
      setCsv("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" leadingIcon={<Upload />}>
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a file or paste rows. Columns: <code className="text-text-primary">name, phone</code>. A
            header row is detected automatically.
          </DialogDescription>
        </DialogHeader>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text-primary hover:file:bg-surface-3"
        />

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder={"name,phone\nAyesha,03001234567\nBilal,+923009876543"}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending} disabled={!csv.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
