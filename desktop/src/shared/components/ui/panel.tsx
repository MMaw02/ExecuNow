import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

const panelVariants = cva(
  "rounded-[var(--radius-large)] border border-border-subtle bg-surface-subtle/82 shadow-[var(--shadow-soft)] backdrop-blur-sm",
  {
    variants: {
      padding: {
        default: "p-5",
        compact: "p-4",
        none: "",
      },
      tone: {
        default: "",
        strong: "bg-surface-strong/88",
        muted: "bg-white/[0.03] shadow-none",
      },
    },
    defaultVariants: {
      padding: "default",
      tone: "default",
    },
  },
);

type PanelProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof panelVariants>;

export function Panel({ className, padding, tone, ...props }: PanelProps) {
  return (
    <div
      className={cn(panelVariants({ padding, tone }), className)}
      {...props}
    />
  );
}
