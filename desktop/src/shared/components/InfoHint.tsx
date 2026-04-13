import { Info } from "lucide-react";
import { cn } from "../lib/cn.ts";

type InfoHintProps = {
  label: string;
};

export function InfoHint({ label }: InfoHintProps) {
  return (
    <span
      className={cn(
        "group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-border-subtle bg-white/[0.02] text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(25,120,229,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-base-deep",
      )}
      tabIndex={0}
      role="note"
      aria-label={label}
      title={label}
    >
      <Info size={12} strokeWidth={2.2} aria-hidden="true" />
      <span
        className="pointer-events-none absolute bottom-[calc(100%+0.6rem)] left-1/2 z-20 hidden w-56 -translate-x-1/2 rounded-[var(--radius-small)] border border-border-subtle bg-shell-background px-3 py-2 text-left text-[0.72rem] leading-relaxed text-text-secondary shadow-[var(--shadow-soft)] group-hover:block group-focus-visible:block"
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
