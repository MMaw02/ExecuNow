import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type {
  WidgetState,
  WidgetTaskTransferPayload,
} from "./widget.types.ts";

export type WidgetPendingAction =
  | { type: "open-tasks" }
  | {
      type: "start-task";
      payload: WidgetTaskTransferPayload;
    };

export const MAIN_WINDOW_LABEL = "main";
export const STARTUP_WIDGET_WINDOW_LABEL = "startup-widget";
export const SESSION_WIDGET_WINDOW_LABEL = "session-widget";
export const WIDGET_START_TASK_EVENT = "widget:start-task";
export const WIDGET_OPEN_TASKS_EVENT = "widget:open-tasks";
export const WIDGET_TASKS_UPDATED_EVENT = "widget:tasks-updated";
export const WIDGET_PENDING_ACTION_STORAGE_KEY = "execunow.widget.pending-action";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function getCurrentWindowLabel(): string {
  return isTauriRuntime() ? getCurrentWebviewWindow().label : MAIN_WINDOW_LABEL;
}

export async function emitWidgetTasksUpdated(state: WidgetState, source: string) {
  if (!isTauriRuntime()) {
    return;
  }

  await emit(WIDGET_TASKS_UPDATED_EVENT, { source, state });
}

export async function bringMainWindowToFront() {
  await showMainWindow();
}

export async function showMainWindow() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("show_main_window");
}

export function setPendingWidgetAction(action: WidgetPendingAction) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WIDGET_PENDING_ACTION_STORAGE_KEY, JSON.stringify(action));
}

export function consumePendingWidgetAction(): WidgetPendingAction | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(WIDGET_PENDING_ACTION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  window.localStorage.removeItem(WIDGET_PENDING_ACTION_STORAGE_KEY);

  try {
    const value = JSON.parse(rawValue) as WidgetPendingAction;

    if (value.type === "open-tasks") {
      return value;
    }

    if (
      value.type === "start-task" &&
      typeof value.payload?.title === "string" &&
      Number.isFinite(value.payload.duration)
    ) {
      return value;
    }

    return null;
  } catch {
    return null;
  }
}

export async function openStartupWidgetWindowFromMain() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("show_widget_window");
}

export async function openSessionWidgetWindowFromMain() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("show_session_widget_window");
}

export async function hideSessionWidgetWindow() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("hide_session_widget_window");
}

export async function startWidgetWindowDrag() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("start_widget_window_drag");
}

export async function startStartupWidgetDrag() {
  await startWidgetWindowDrag();
}

export function toWidgetTransferPayload(task: {
  title: string;
  estimateMinutes: number;
}): WidgetTaskTransferPayload {
  return {
    title: task.title,
    duration: task.estimateMinutes,
  };
}
