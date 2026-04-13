import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-small)] border text-sm font-medium tracking-[0.01em] transition-colors duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(25,120,229,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-base-deep",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-accent-primary text-white shadow-[0_16px_30px_rgba(25,120,229,0.28)] hover:bg-[#2b86ec]",
        secondary:
          "border-border-subtle bg-white/[0.03] text-text-primary hover:border-border-strong hover:bg-white/[0.05]",
        ghost:
          "border-transparent bg-transparent text-text-secondary hover:bg-white/[0.04] hover:text-text-primary",
        toggle:
          "border-border-subtle bg-surface-subtle/80 text-text-secondary hover:border-border-strong hover:bg-surface-strong/80 hover:text-text-primary",
        segment:
          "border-border-subtle bg-surface-subtle/70 text-text-secondary hover:border-border-strong hover:bg-surface-strong/80 hover:text-text-primary",
        link: "border-transparent bg-transparent text-text-secondary hover:text-text-primary",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-5",
        icon: "h-9 w-9 px-0",
        link: "h-auto px-0 py-0",
      },
      active: {
        true: "border-border-strong bg-surface-active text-text-primary shadow-[inset_0_0_0_1px_rgba(140,170,222,0.18)]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
      active: false,
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, active, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, active }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
