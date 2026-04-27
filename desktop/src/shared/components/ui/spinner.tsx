import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn.ts";

type SpinnerProps = {
  className?: string;
};

export function Spinner({ className }: SpinnerProps) {
  return <LoaderCircle className={cn("animate-spin", className)} aria-hidden="true" />;
}
