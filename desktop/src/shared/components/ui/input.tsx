import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

export const inputVariants = cva(
  "w-full rounded-[var(--radius-small)] border border-border-subtle bg-surface-subtle/85 px-3.5 text-sm text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors outline-none placeholder:text-text-muted focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-[rgba(25,120,229,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-base-deep disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-11",
        compact: "h-10 px-3",
      },
      invalid: {
        true: "border-accent-warning/70 focus-visible:ring-[rgba(234,88,12,0.45)]",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      invalid: false,
    },
  },
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ size, invalid }), className)}
      aria-invalid={invalid || props["aria-invalid"]}
      {...props}
    />
  ),
);

Input.displayName = "Input";
