import { MIN_CUSTOM_DURATION } from "../session/session.constants.ts";
import type {
  WidgetPriority,
  WidgetState,
  WidgetTask,
  WidgetTaskUpdate,
} from "./widget.types.ts";

export const MIN_WIDGET_ESTIMATE_MINUTES = MIN_CUSTOM_DURATION;

const PRIORITY_WEIGHT: Record<Exclude<WidgetPriority, null>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function createEmptyWidgetState(): WidgetState {
  return {
    tasks: [],
    selectedTaskId: null,
  };
}

export function isWidgetPriority(value: string): value is Exclude<WidgetPriority, null> {
  return value === "high" || value === "medium" || value === "low";
}

export function normalizeWidgetState(
  state: Partial<WidgetState> | null | undefined,
): WidgetState {
  const tasks = Array.isArray(state?.tasks)
    ? sortWidgetTasks(
        state.tasks.filter(
          (task): task is WidgetTask =>
            typeof task?.id === "string" &&
            typeof task?.title === "string" &&
            task.title.trim().length > 0 &&
            Number.isFinite(task.estimateMinutes) &&
            task.estimateMinutes >= MIN_WIDGET_ESTIMATE_MINUTES &&
            typeof task.completed === "boolean" &&
            typeof task.createdAt === "string" &&
            (task.priority === null || isWidgetPriority(task.priority)),
        ),
      )
    : [];
  const selectedTaskId =
    typeof state?.selectedTaskId === "string" &&
    tasks.some((task) => task.id === state.selectedTaskId)
      ? state.selectedTaskId
      : tasks[0]?.id ?? null;

  return {
    tasks,
    selectedTaskId,
  };
}

export function sortWidgetTasks(tasks: readonly WidgetTask[]): WidgetTask[] {
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return Number(left.completed) - Number(right.completed);
    }

    const priorityDelta = getPriorityWeight(left.priority) - getPriorityWeight(right.priority);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function createWidgetTask(
  input: {
    title: string;
    estimateMinutes: number;
    priority: WidgetPriority;
  },
  options: {
    id?: string;
    createdAt?: string;
  } = {},
): WidgetTask {
  const estimateMinutes = Math.max(
    Math.trunc(input.estimateMinutes),
    MIN_WIDGET_ESTIMATE_MINUTES,
  );

  return {
    id: options.id ?? crypto.randomUUID(),
    title: input.title.trim(),
    estimateMinutes,
    priority: input.priority,
    completed: false,
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

export function insertWidgetTask(state: WidgetState, task: WidgetTask): WidgetState {
  const tasks = sortWidgetTasks([
    task,
    ...state.tasks.filter((existingTask) => existingTask.id !== task.id),
  ]);

  return {
    tasks,
    selectedTaskId: task.id,
  };
}

export function selectWidgetTask(state: WidgetState, taskId: string): WidgetState {
  if (!state.tasks.some((task) => task.id === taskId)) {
    return state;
  }

  return {
    ...state,
    selectedTaskId: taskId,
  };
}

export function getSelectedWidgetTask(state: WidgetState): WidgetTask | null {
  return state.tasks.find((task) => task.id === state.selectedTaskId) ?? null;
}

export function consumeSelectedWidgetTask(state: WidgetState): {
  task: WidgetTask | null;
  nextState: WidgetState;
} {
  const task = getSelectedWidgetTask(state);

  if (!task) {
    return {
      task: null,
      nextState: state,
    };
  }

  const tasks = state.tasks.filter((entry) => entry.id !== task.id);

  return {
    task,
    nextState: {
      tasks,
      selectedTaskId: tasks[0]?.id ?? null,
    },
  };
}

export function isWidgetDraftValid(title: string, estimateMinutes: number | null): boolean {
  return title.trim().length > 0 && estimateMinutes !== null && estimateMinutes >= MIN_WIDGET_ESTIMATE_MINUTES;
}

export function updateWidgetTask(
  state: WidgetState,
  taskId: string,
  updates: WidgetTaskUpdate,
): WidgetState {
  if (!state.tasks.some((task) => task.id === taskId)) {
    return state;
  }

  const tasks = sortWidgetTasks(
    state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: updates.title.trim(),
            estimateMinutes: Math.max(
              Math.trunc(updates.estimateMinutes),
              MIN_WIDGET_ESTIMATE_MINUTES,
            ),
            priority: updates.priority,
            completed: updates.completed ?? task.completed,
          }
        : task,
    ),
  );

  return {
    tasks,
    selectedTaskId: taskId,
  };
}

export function removeWidgetTask(state: WidgetState, taskId: string): WidgetState {
  if (!state.tasks.some((task) => task.id === taskId)) {
    return state;
  }

  const tasks = state.tasks.filter((task) => task.id !== taskId);
  const selectedTaskId =
    state.selectedTaskId === taskId ? tasks[0]?.id ?? null : state.selectedTaskId;

  return {
    tasks,
    selectedTaskId,
  };
}

export function toggleWidgetTaskCompleted(
  state: WidgetState,
  taskId: string,
): WidgetState {
  if (!state.tasks.some((task) => task.id === taskId)) {
    return state;
  }

  const tasks = sortWidgetTasks(
    state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
          }
        : task,
    ),
  );

  const selectedTaskId = tasks.some((task) => task.id === state.selectedTaskId)
    ? state.selectedTaskId
    : tasks[0]?.id ?? null;

  return {
    tasks,
    selectedTaskId,
  };
}

function getPriorityWeight(priority: WidgetPriority): number {
  if (priority === null) {
    return 3;
  }

  return PRIORITY_WEIGHT[priority];
}
