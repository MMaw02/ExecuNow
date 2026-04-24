import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

export const inputVariants = cva(
  "flex w-full rounded-[var(--radius-small)] border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-11",
        compact: "h-10 px-3",
      },
      invalid: {
        true: "border-destructive/70 focus-visible:ring-destructive/40",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      invalid: false,
    },
  },
);

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, ...props }, ref) => {
    const ariaInvalid = invalid ? true : props["aria-invalid"];

    return (
      <input
        ref={ref}
        className={cn(inputVariants({ size, invalid }), className)}
        aria-invalid={ariaInvalid}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
