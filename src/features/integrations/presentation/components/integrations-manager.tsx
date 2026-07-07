"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, Plus, RefreshCw, Sparkles, Trash2, Zap } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { ReviewSourceView } from "../../application/source.dto";
import type { PlatformStatus } from "../../application/platform-status.usecase";
import type { Platform } from "@/network/supabase/types";
import type { ConnectMethod } from "../../domain/platform";
import { PLATFORM_LIST, type PlatformMeta } from "../platform-catalog";
import {
  autoConnectSourceAction,
  connectSourceAction,
  disconnectSourceAction,
  startOAuthConnectAction,
} from "../integrations.actions";

interface Row {
  meta: PlatformMeta;
  status: PlatformStatus;
  source: ReviewSourceView | null;
}

export function IntegrationsManager({
  sources,
  statuses,
}: {
  sources: ReviewSourceView[];
  statuses: PlatformStatus[];
}) {
  const connected = new Map(sources.map((s) => [s.platform, s]));
  const statusMap = new Map(statuses.map((s) => [s.platform, s]));
  const [editing, setEditing] = React.useState<Row | null>(null);

  const rows: Row[] = PLATFORM_LIST.map((meta) => ({
    meta,
    status: statusMap.get(meta.platform) ?? { platform: meta.platform, method: "link", live: false },
    source: connected.get(meta.platform) ?? null,
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <PlatformCard key={row.meta.platform} row={row} onOpenDialog={() => setEditing(row)} />
        ))}
      </div>
      <ConnectDialog key={editing?.meta.platform ?? "none"} row={editing} onClose={() => setEditing(null)} />
    </>
  );
}

/** Effective connect method: degrade to "link" until the platform's keys are live. */
function effectiveMethod(status: PlatformStatus): ConnectMethod {
  if (status.method === "oauth") return status.live ? "oauth" : "link";
  if (status.method === "api") return status.live ? "api" : "link";
  return "link";
}

function PlatformCard({ row, onOpenDialog }: { row: Row; onOpenDialog: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const { meta, status, source } = row;
  const Icon = meta.icon;
  const isConnected = !!source;
  const method = effectiveMethod(status);

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectSourceAction({ platform: meta.platform });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`${meta.label} disconnected`);
      router.refresh();
    });
  }

  function connectOAuth() {
    startTransition(async () => {
      const result = await startOAuthConnectAction({ platform: meta.platform });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      window.location.href = result.data.url;
    });
  }

  function autoConnect() {
    startTransition(async () => {
      const result = await autoConnectSourceAction({ platform: meta.platform });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`${meta.label} connected`);
      router.refresh();
    });
  }

  /** The primary connect action for this platform's effective method. */
  function primaryConnect() {
    if (method === "oauth") return connectOAuth();
    if (method === "api") return autoConnect();
    return onOpenDialog();
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-lg text-white [&_svg]:size-5"
            style={{ backgroundColor: meta.accent }}
          >
            <Icon />
          </span>
          <div>
            <p className="font-semibold text-text-primary">{meta.label}</p>
            {isConnected ? (
              <Badge variant="success" className="mt-0.5">
                <Check className="size-3" /> Connected
              </Badge>
            ) : status.live ? (
              <Badge variant="brand" className="mt-0.5">
                <Zap className="size-3" /> {method === "oauth" ? "1-click connect" : "Auto-sync"}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-0.5">
                Link
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary">{meta.blurb}</p>

      {isConnected && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
          {source?.avgRating != null && <span>★ {source.avgRating.toFixed(1)}</span>}
          {source && source.reviewCount > 0 && <span>{source.reviewCount} reviews</span>}
          {source?.reviewLink && (
            <a
              href={source.reviewLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-brand-600 hover:underline dark:text-brand-300"
            >
              <ExternalLink className="size-3 shrink-0" /> View
            </a>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {isConnected ? (
          <>
            <Button variant="outline" size="sm" leadingIcon={<RefreshCw />} loading={pending} onClick={primaryConnect}>
              Reconnect
            </Button>
            <Button variant="ghost" size="sm" leadingIcon={<Trash2 />} loading={pending} onClick={disconnect}>
              Disconnect
            </Button>
          </>
        ) : method === "oauth" ? (
          <Button size="sm" leadingIcon={<Icon />} loading={pending} onClick={connectOAuth}>
            Continue with {meta.label}
          </Button>
        ) : method === "api" ? (
          <>
            <Button size="sm" leadingIcon={<Sparkles />} loading={pending} onClick={autoConnect}>
              Find my business
            </Button>
            <Button variant="ghost" size="sm" onClick={onOpenDialog}>
              Enter link
            </Button>
          </>
        ) : (
          <Button size="sm" leadingIcon={<Plus />} loading={pending} onClick={onOpenDialog}>
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}

function ConnectDialog({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const meta = row?.meta;
  const method = row ? effectiveMethod(row.status) : "link";
  const isApi = method === "api";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!meta) return;
    setError(null);
    const platform: Platform = meta.platform;
    startTransition(async () => {
      const result = await connectSourceAction({ platform, query, displayName: name || undefined });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(`${meta.label} connected`);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect {meta?.label}</DialogTitle>
          <DialogDescription>
            {isApi
              ? `Paste your ${meta?.label} business URL — we'll pull your rating and reviews automatically.`
              : `Paste your public ${meta?.label} review link. Customers who tap it land straight on your page — great for requests, the widget and QR posters.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field
            label={isApi ? `${meta?.label ?? ""} business URL` : `${meta?.label ?? ""} review link`}
            required
            error={error ?? undefined}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={meta?.linkPlaceholder}
              invalid={!!error}
              autoFocus
              inputMode="url"
            />
          </Field>
          <Field label="Display name" hint="Optional — how this listing is named.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main branch" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!query.trim()}>
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
