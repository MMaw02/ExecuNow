import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useRef, useState } from "react";
import {
  consumeWidgetTask,
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
  WIDGET_TASKS_UPDATED_EVENT,
} from "./widget.sync.ts";
import { getCurrentWindowKind, isTauriRuntime } from "./widget.runtime.ts";
import { readWidgetState, writeWidgetState } from "./widget.storage.ts";
import type {
  WidgetPriority,
  WidgetState,
  WidgetTask,
  WidgetTaskUpdate,
  WidgetTasksUpdatedPayload,
} from "./widget.types.ts";

export function useWidgetTasks() {
  const windowLabel = getCurrentWindowKind();
  const [state, setState] = useState<WidgetState>(() => readWidgetState());
  const stateRef = useRef(state);

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

        const normalizedState = normalizeWidgetState(event.payload.state);
        stateRef.current = normalizedState;
        setState(normalizedState);
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

    stateRef.current = normalizedState;
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
        commit(selectWidgetTask(stateRef.current, taskId));
      },
      addTask(input: {
        title: string;
        estimateMinutes: number;
        priority: WidgetPriority;
        tag?: string | null;
      }) {
        const task = createWidgetTask(input);
        commit(insertWidgetTask(stateRef.current, task));
        return task;
      },
      updateTask(taskId: string, updates: WidgetTaskUpdate) {
        commit(updateWidgetTask(stateRef.current, taskId, updates));
      },
      removeTask(taskId: string) {
        commit(removeWidgetTask(stateRef.current, taskId));
      },
      toggleTaskCompleted(taskId: string) {
        commit(toggleWidgetTaskCompleted(stateRef.current, taskId));
      },
      replaceState(nextState: WidgetState) {
        commit(nextState);
      },
      consumeTask(taskId: string) {
        const { task, nextState } = consumeWidgetTask(stateRef.current, taskId);

        if (!task) {
          return null;
        }

        commit(nextState);
        return task;
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
