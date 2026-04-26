import {
  ArrowDown,
  CircleAlert,
  Flag,
} from "lucide-react";
import { cn } from "../../shared/lib/cn.ts";
import type { WidgetPriority } from "./widget.types.ts";

export function PriorityOptionContent({
  priority,
}: {
  priority: WidgetPriority;
}) {
  const presentation = getPriorityPresentation(priority);
  const Icon = priority === "high" ? CircleAlert : priority === "low" ? ArrowDown : Flag;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon size={13} className={cn("shrink-0", presentation.iconClassName)} aria-hidden="true" />
      <span className={cn("truncate", presentation.textClassName)}>{presentation.label}</span>
    </span>
  );
}

export function PriorityChip({ priority }: { priority: WidgetPriority }) {
  const presentation = getPriorityPresentation(priority);
  const Icon = priority === "high" ? CircleAlert : priority === "low" ? ArrowDown : Flag;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.64rem] font-medium uppercase tracking-[0.12em]",
        presentation.chipClassName,
      )}
    >
      <Icon size={11} className={presentation.iconClassName} aria-hidden="true" />
      <span>{presentation.label}</span>
    </span>
  );
}

function getPriorityPresentation(priority: WidgetPriority) {
  if (priority === "high") {
    return {
      label: "High",
      chipClassName: "border-rose-400/20 bg-rose-400/10 text-rose-200",
      iconClassName: "text-rose-300",
      textClassName: "text-rose-200",
    };
  }

  if (priority === "medium") {
    return {
      label: "Medium",
      chipClassName: "border-sky-400/20 bg-sky-400/10 text-sky-200",
      iconClassName: "text-sky-300",
      textClassName: "text-sky-200",
    };
  }

  if (priority === "low") {
    return {
      label: "Low",
      chipClassName: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      iconClassName: "text-emerald-300",
      textClassName: "text-emerald-200",
    };
  }

  return {
    label: "Optional",
    chipClassName: "border-border/70 bg-muted/30 text-muted-foreground",
    iconClassName: "text-muted-foreground",
    textClassName: "text-muted-foreground",
  };
}
