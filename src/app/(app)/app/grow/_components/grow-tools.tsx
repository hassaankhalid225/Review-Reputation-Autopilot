"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Check, Printer, Share2, MessageCircle, Send, Globe, Link2, Mail } from "lucide-react";
import { Button } from "@/shared/ui/button";

/** Public QR image endpoint — swappable for a self-hosted generator later. */
function qrUrl(data: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      leadingIcon={copied ? <Check /> : <Copy />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy — select and copy manually.");
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function WidgetEmbed({ widgetUrl }: { widgetUrl: string }) {
  const snippet = `<iframe src="${widgetUrl}" width="100%" height="520" style="border:0" loading="lazy" title="Customer reviews"></iframe>`;
  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-secondary">
        <code>{snippet}</code>
      </pre>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={snippet} label="Copy embed code" />
        <Button variant="ghost" size="sm" asChild>
          <a href={widgetUrl} target="_blank" rel="noreferrer">
            Preview widget
          </a>
        </Button>
      </div>
    </div>
  );
}

export function ShareTools({
  reviewLink,
  businessName,
}: {
  reviewLink: string | null;
  businessName: string;
}) {
  if (!reviewLink) {
    return (
      <p className="text-sm text-text-tertiary">
        Connect a platform with a public review link (Integrations) to unlock QR posters and social sharing.
      </p>
    );
  }

  const link = reviewLink;
  const message = `We'd love your feedback! Please leave ${businessName} a quick review: ${link}`;
  const enc = encodeURIComponent;
  const shares = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(message)}` },
    { label: "Facebook", icon: Globe, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}` },
    { label: "X", icon: Send, href: `https://twitter.com/intent/tweet?text=${enc(message)}` },
    { label: "LinkedIn", icon: Link2, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}` },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${enc(`Would you review ${businessName}?`)}&body=${enc(message)}`,
    },
  ];

  function printPoster() {
    const win = window.open("", "_blank", "width=800,height=1000");
    if (!win) {
      toast.error("Allow pop-ups to print the poster.");
      return;
    }
    win.document.write(`<!doctype html><html><head><title>Review poster</title>
      <style>
        *{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0}
        body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:48px}
        .poster{text-align:center;max-width:560px}
        h1{font-size:40px;font-weight:800;margin-bottom:12px}
        p{font-size:22px;color:#444;margin-bottom:28px}
        img{width:280px;height:280px}
        .tag{margin-top:24px;font-size:16px;color:#888}
      </style></head><body onload="window.print()">
      <div class="poster">
        <h1>Enjoyed ${businessName}?</h1>
        <p>Scan to leave us a quick review — it means the world!</p>
        <img src="${qrUrl(link, 280)}" alt="Review QR code" />
        <div class="tag">${businessName}</div>
      </div></body></html>`);
    win.document.close();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl(reviewLink)}
          alt="Review QR code"
          className="size-32 rounded-lg border border-border bg-white p-2"
          width={128}
          height={128}
        />
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            Print this QR on a poster, receipt or table card. Customers scan it and land straight on your
            review page.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" leadingIcon={<Printer />} onClick={printPoster}>
              Print poster
            </Button>
            <CopyButton text={reviewLink} label="Copy review link" />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
          <Share2 className="size-4" /> Share your review link
        </p>
        <div className="flex flex-wrap gap-2">
          {shares.map((s) => (
            <Button key={s.label} variant="outline" size="sm" leadingIcon={<s.icon />} asChild>
              <a href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
