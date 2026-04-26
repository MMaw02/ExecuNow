import type { DurationOption } from "../session/session.types.ts";

export type WidgetPriority = "high" | "medium" | "low" | null;

export type WidgetTask = {
  id: string;
  title: string;
  estimateMinutes: DurationOption;
  priority: WidgetPriority;
  tag: string | null;
  completed: boolean;
  createdAt: string;
};

export type WidgetState = {
  tasks: WidgetTask[];
  selectedTaskId: string | null;
};

export type WidgetTasksUpdatedPayload = {
  source: string;
  state: WidgetState;
};

export type WidgetTaskUpdate = {
  title: string;
  estimateMinutes: DurationOption;
  priority: WidgetPriority;
  tag: string | null;
  completed?: boolean;
};
