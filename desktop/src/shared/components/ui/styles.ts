import { cn } from "../../lib/cn.ts";

export const pageClassName = "grid gap-6";
export const pageHeaderClassName = "grid gap-2";
export const eyebrowClassName =
  "text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-secondary";
export const pageTitleClassName =
  "text-3xl font-semibold tracking-[-0.03em] text-text-primary";
export const pageCopyClassName =
  "max-w-2xl text-sm text-text-secondary md:text-[0.95rem]";
export const sectionHeadingClassName = "grid gap-1.5";
export const sectionLabelClassName =
  "text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-secondary";
export const sectionCopyClassName = "text-sm text-text-secondary";
export const fieldClassName = "grid gap-2";
export const fieldRowClassName = "flex items-center gap-2";
export const fieldLabelClassName =
  "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-text-secondary";
export const supportTextClassName = "text-sm text-text-secondary";
export const validationTextClassName = "text-sm text-accent-warning";
export const rowListClassName = "grid gap-3";
export const listRowClassName =
  "flex items-center justify-between gap-4 rounded-[var(--radius-medium)] border border-border-subtle bg-white/[0.02] px-4 py-3 text-sm";
export const metricGridClassName = "grid gap-3 sm:grid-cols-2 xl:grid-cols-4";
export const metricCellClassName =
  "grid gap-1 rounded-[var(--radius-medium)] border border-border-subtle bg-white/[0.03] px-4 py-4";
export const summaryLabelClassName =
  "text-[0.7rem] font-medium uppercase tracking-[0.14em] text-text-secondary";
export const emptyPanelClassName =
  "grid min-h-[180px] place-items-center rounded-[var(--radius-large)] border border-dashed border-border-subtle bg-white/[0.02] px-5 py-8 text-center";
export const emptyCopyClassName = "text-sm text-text-secondary";
export const stackCompactClassName = "grid gap-1.5";

export function statePillClassName(
  tone: "completed" | "incomplete" | "abandoned",
) {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em]",
    tone === "completed" &&
      "border-accent-success/25 bg-accent-success/12 text-accent-success",
    tone === "incomplete" &&
      "border-accent-support/25 bg-accent-support/12 text-accent-support",
    tone === "abandoned" &&
      "border-accent-warning/25 bg-accent-warning/12 text-accent-warning",
  );
}
