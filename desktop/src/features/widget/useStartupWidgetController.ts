import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from "react";
import { usePomodoroSettings } from "../pomodoro/usePomodoroSettings.ts";
import { consumeWidgetTask, isWidgetDraftValid, MIN_WIDGET_ESTIMATE_MINUTES } from "./widget.model.ts";
import type { WidgetPendingAction } from "./widget.pending-action.ts";
import { getWidgetRuntime } from "./widget.runtime.ts";
import { useWidgetTasks } from "./useWidgetTasks.ts";
import { shouldStartWidgetWindowDrag } from "./widget.window.ts";
import type { WidgetPriority, WidgetState } from "./widget.types.ts";

export function useStartupWidgetController() {
  const { state, actions } = useWidgetTasks();
  const { settings: pomodoroSettings } = usePomodoroSettings();
  const runtime = getWidgetRuntime();
  const [taskTitle, setTaskTitle] = useState("");
  const [estimateValue, setEstimateValue] = useState("15");
  const [priority, setPriority] = useState<WidgetPriority>("medium");

  const draftState = createStartupWidgetDraftState({
    estimateValue,
    taskTitle,
  });

  async function handleOpenTasks() {
    runtime.setPendingAction({ type: "open-tasks" });
    await runtime.showMainWindow();
  }

  async function handleStartTask(taskId: string) {
    const transition = buildStartTaskTransition(state, taskId);

    if (!transition.pendingAction) {
      return;
    }

    actions.replaceState(transition.nextState);
    runtime.setPendingAction(transition.pendingAction);
    await runtime.showMainWindow();
  }

  return {
    viewModel: {
      canAddTask: draftState.canAddTask,
      estimateInvalid: draftState.estimateInvalid,
      estimateValue,
      pomodoroSettings,
      priority,
      selectedTaskId: state.selectedTaskId,
      taskTitle,
      tasks: state.tasks,
    },
    handlers: {
      onEstimateChange(event: ChangeEvent<HTMLInputElement>) {
        setEstimateValue(sanitizeStartupWidgetEstimateInput(event.currentTarget.value));
      },
      onHeaderMouseDown(event: MouseEvent<HTMLElement>) {
        if (event.button !== 0 || !shouldStartWidgetWindowDrag(event.target)) {
          return;
        }

        event.preventDefault();
        void runtime.startWindowDrag();
      },
      onOpenTasks() {
        void handleOpenTasks();
      },
      onPriorityChange(value: string) {
        setPriority(parseWidgetPrioritySelection(value));
      },
      onSelectTask(taskId: string) {
        actions.selectTask(taskId);
      },
      onStartTask(taskId: string) {
        void handleStartTask(taskId);
      },
      onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!draftState.canAddTask || draftState.parsedEstimate === null) {
          return;
        }

        actions.addTask({
          title: taskTitle,
          estimateMinutes: draftState.parsedEstimate,
          priority,
        });

        setTaskTitle("");
      },
      onTaskTitleChange(value: string) {
        setTaskTitle(value);
      },
      onToggleTaskCompleted(taskId: string) {
        actions.toggleTaskCompleted(taskId);
      },
    },
  };
}

export function createStartupWidgetDraftState(input: {
  estimateValue: string;
  taskTitle: string;
}) {
  const parsedEstimate =
    input.estimateValue.trim().length > 0
      ? Number.parseInt(input.estimateValue, 10)
      : null;
  const estimateInvalid =
    input.estimateValue.trim().length > 0 &&
    (!Number.isFinite(parsedEstimate) ||
      (parsedEstimate ?? 0) < MIN_WIDGET_ESTIMATE_MINUTES);

  return {
    canAddTask:
      !estimateInvalid && isWidgetDraftValid(input.taskTitle, parsedEstimate),
    estimateInvalid,
    parsedEstimate,
  };
}

export function sanitizeStartupWidgetEstimateInput(value: string) {
  return value.replace(/\D+/g, "");
}

export function parseWidgetPrioritySelection(value: string): WidgetPriority {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return null;
}

export function buildStartTaskTransition(
  state: WidgetState,
  taskId: string,
): {
  nextState: WidgetState;
  pendingAction: WidgetPendingAction | null;
} {
  const taskToStart = state.tasks.find((task) => task.id === taskId);

  if (!taskToStart || taskToStart.completed) {
    return {
      nextState: state,
      pendingAction: null,
    };
  }

  const { task, nextState } = consumeWidgetTask(state, taskId);

  if (!task) {
    return {
      nextState: state,
      pendingAction: null,
    };
  }

  return {
    nextState,
    pendingAction: {
      type: "start-task",
      payload: {
        duration: task.estimateMinutes,
        title: task.title,
      },
    },
  };
}
