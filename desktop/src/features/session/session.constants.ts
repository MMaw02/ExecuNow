import type {
  DurationOption,
  NavigationItem,
  View,
  ViewCopy,
} from "./session.types.ts";

export const DURATIONS: readonly DurationOption[] = [15, 25, 50];

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
  { id: "home", label: "Home / Today", support: "Set the task and launch" },
  { id: "active", label: "Active Session", support: "Timer and session controls" },
  { id: "outcome", label: "Session Outcome", support: "Close the loop quickly" },
  { id: "blocking", label: "Blocking Settings", support: "Set the focus rule" },
];

export const VIEW_COPY: Record<View, ViewCopy> = {
  home: {
    eyebrow: "Home / Today",
    title: "See the task. Start the session.",
    lead: "Keep setup narrow. Choose the task, choose the block, begin.",
  },
  active: {
    eyebrow: "Active Session",
    title: "Keep the timer dominant until the block is done.",
    lead: "Navigation stays quiet so the next action remains obvious.",
  },
  outcome: {
    eyebrow: "Session Outcome",
    title: "Close the loop while the session is still fresh.",
    lead: "Log the result in seconds and move the system back to ready.",
  },
  blocking: {
    eyebrow: "Blocking Settings",
    title: "Set the rule before focus begins.",
    lead: "Keep blocking operational, short, and firm instead of turning it into admin setup.",
  },
};
