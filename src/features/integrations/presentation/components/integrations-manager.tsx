"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
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
import type { Platform } from "@/network/supabase/types";
import { PLATFORM_LIST, type PlatformMeta } from "../platform-catalog";
import { connectSourceAction, disconnectSourceAction } from "../integrations.actions";

export function IntegrationsManager({ sources }: { sources: ReviewSourceView[] }) {
  const connected = new Map(sources.map((s) => [s.platform, s]));
  const [editing, setEditing] = React.useState<PlatformMeta | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_LIST.map((meta) => (
          <PlatformCard
            key={meta.platform}
            meta={meta}
            source={connected.get(meta.platform) ?? null}
            onConnect={() => setEditing(meta)}
          />
        ))}
      </div>

      <ConnectDialog key={editing?.platform ?? "none"} meta={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function PlatformCard({
  meta,
  source,
  onConnect,
}: {
  meta: PlatformMeta;
  source: ReviewSourceView | null;
  onConnect: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const Icon = meta.icon;
  const isConnected = !!source;

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
            ) : (
              <Badge variant="outline" className="mt-0.5">
                {meta.method === "oauth" ? "OAuth" : "Add link"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary">{meta.blurb}</p>

      {isConnected && source?.reviewLink && (
        <a
          href={source.reviewLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 truncate text-xs text-brand-600 hover:underline dark:text-brand-300"
        >
          <ExternalLink className="size-3 shrink-0" />
          <span className="truncate">{source.reviewLink}</span>
        </a>
      )}

      <div className="mt-auto flex gap-2 pt-1">
        {isConnected ? (
          <>
            <Button variant="outline" size="sm" leadingIcon={<Link2 />} onClick={onConnect}>
              Update link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Trash2 />}
              loading={pending}
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button size="sm" leadingIcon={<Plus />} onClick={onConnect}>
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}

function ConnectDialog({ meta, onClose }: { meta: PlatformMeta | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [link, setLink] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!meta) return;
    setError(null);
    const platform: Platform = meta.platform;
    startTransition(async () => {
      const result = await connectSourceAction({
        platform,
        reviewLink: link,
        displayName: name || undefined,
      });
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
    <Dialog open={!!meta} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect {meta?.label}</DialogTitle>
          <DialogDescription>
            Paste your public review link. Customers who tap it land straight on your {meta?.label} page
            — perfect for requests, your website widget and QR posters.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label={`${meta?.label ?? ""} review link`} required error={error ?? undefined}>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
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
            <Button type="submit" loading={pending} disabled={!link.trim()}>
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
