import * as React from "react";
import { cn } from "../../lib/cn.ts";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[116px] w-full rounded-[var(--radius-small)] border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-destructive/70 focus-visible:ring-destructive/40" : "",
        className,
      )}
      aria-invalid={invalid || props["aria-invalid"]}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export { Textarea };
