"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { iconButtonClass } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

/** Native share sheet where available, clipboard copy otherwise. */
export function ShareButton({
  path,
  title,
  label = "Share",
  variant = "plain",
}: {
  path: string;
  title: string;
  label?: string;
  variant?: "plain" | "glass" | "outline";
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copied" : label}
      title={copied ? "Link copied" : label}
      className={cn(
        variant === "plain" ? "flex size-9 items-center justify-center rounded-full text-sub hover:bg-field" : iconButtonClass(variant, variant === "outline" ? "size-11 rounded-xl shadow-none" : undefined),
      )}
    >
      <Icon name={copied ? "check" : "share"} size={variant === "plain" ? 16 : 18} />
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}
