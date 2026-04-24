import { cn } from "../../lib/cn.ts";

export const pageClassName = "grid gap-6";
export const pageHeaderClassName = "grid gap-2";
export const eyebrowClassName =
  "text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground";
export const pageTitleClassName =
  "text-3xl font-semibold tracking-[-0.03em] text-foreground";
export const pageCopyClassName =
  "max-w-2xl text-sm text-muted-foreground md:text-[0.95rem]";
export const sectionHeadingClassName = "grid gap-1.5";
export const sectionLabelClassName =
  "text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground";
export const sectionCopyClassName = "text-sm text-muted-foreground";
export const fieldRowClassName = "flex items-center gap-2";
export const supportTextClassName = "text-sm text-muted-foreground";
export const validationTextClassName = "text-sm text-destructive";
export const rowListClassName = "grid gap-3";
export const listRowClassName =
  "flex items-center justify-between gap-4 rounded-[var(--radius-medium)] border border-border bg-muted/40 px-4 py-3 text-sm";
export const metricGridClassName = "grid gap-3 sm:grid-cols-2 xl:grid-cols-4";
export const metricCellClassName =
  "grid gap-1 rounded-[var(--radius-medium)] border border-border bg-card/90 px-4 py-4";
export const summaryLabelClassName =
  "text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground";
export const emptyPanelClassName =
  "grid min-h-[180px] place-items-center rounded-[var(--radius-large)] border border-dashed border-border bg-muted/30 px-5 py-8 text-center";
export const emptyCopyClassName = "text-sm text-muted-foreground";

export function statePillClassName(
  tone: "completed" | "incomplete" | "abandoned",
) {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em]",
    tone === "completed" &&
      "border-emerald-400/25 bg-emerald-400/12 text-emerald-300",
    tone === "incomplete" &&
      "border-sky-400/25 bg-sky-400/12 text-sky-300",
    tone === "abandoned" &&
      "border-amber-400/25 bg-amber-400/12 text-amber-300",
  );
}
