import type {
  DurationOption,
  NavigationItem,
} from "./session.types.ts";

export const DURATIONS: readonly DurationOption[] = [15, 25, 50];
export const MIN_CUSTOM_DURATION = 5;

export const FAILURE_REASONS = [
  "Task was too big",
  "Reached for a distraction",
  "Energy dropped",
  "Needed information first",
] as const;

export const SUGGESTED_TASKS = [
  "Finish quarterly planning memo",
  "Clear the three urgent inbox replies",
  "Draft the product walkthrough",
] as const;

export const NAV_ITEMS: readonly NavigationItem[] = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
  { id: "summary", label: "Summary" },
  { id: "blocking", label: "Blocking" },
  { id: "settings", label: "Settings" },
];
