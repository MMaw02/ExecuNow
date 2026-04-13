import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import {
  createWidgetTask,
  getSelectedWidgetTask,
  insertWidgetTask,
  normalizeWidgetState,
  removeWidgetTask,
  selectWidgetTask,
  toggleWidgetTaskCompleted,
  updateWidgetTask,
} from "./widget.model.ts";
import {
  emitWidgetTasksUpdated,
  getCurrentWindowLabel,
  isTauriRuntime,
  WIDGET_TASKS_UPDATED_EVENT,
} from "./widget.events.ts";
import { readWidgetState, writeWidgetState } from "./widget.storage.ts";
import type {
  WidgetPriority,
  WidgetState,
  WidgetTask,
  WidgetTaskUpdate,
  WidgetTasksUpdatedPayload,
} from "./widget.types.ts";

export function useWidgetTasks() {
  const windowLabel = getCurrentWindowLabel();
  const [state, setState] = useState<WidgetState>(() => readWidgetState());

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let unlisten: (() => void) | undefined;
    let disposed = false;

    void getCurrentWebviewWindow()
      .listen<WidgetTasksUpdatedPayload>(WIDGET_TASKS_UPDATED_EVENT, (event) => {
        if (event.payload.source === windowLabel) {
          return;
        }

        setState(normalizeWidgetState(event.payload.state));
      })
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }

        unlisten = cleanup;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [windowLabel]);

  function commit(nextState: WidgetState, broadcast = true) {
    const normalizedState = normalizeWidgetState(nextState);

    setState(normalizedState);
    writeWidgetState(normalizedState);

    if (broadcast) {
      void emitWidgetTasksUpdated(normalizedState, windowLabel);
    }
  }

  return {
    state,
    selectedTask: getSelectedWidgetTask(state),
    actions: {
      selectTask(taskId: string) {
        commit(selectWidgetTask(state, taskId));
      },
      addTask(input: {
        title: string;
        estimateMinutes: number;
        priority: WidgetPriority;
      }) {
        const task = createWidgetTask(input);
        commit(insertWidgetTask(state, task));
        return task;
      },
      updateTask(taskId: string, updates: WidgetTaskUpdate) {
        commit(updateWidgetTask(state, taskId, updates));
      },
      removeTask(taskId: string) {
        commit(removeWidgetTask(state, taskId));
      },
      toggleTaskCompleted(taskId: string) {
        commit(toggleWidgetTaskCompleted(state, taskId));
      },
      replaceState(nextState: WidgetState) {
        commit(nextState);
      },
      consumeState(task: WidgetTask | null, nextState: WidgetState) {
        if (!task) {
          return;
        }

        commit(nextState);
      },
    },
  };
}
