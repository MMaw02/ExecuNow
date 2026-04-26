import { emit } from "@tauri-apps/api/event";
import { isTauriRuntime } from "./widget.runtime.ts";
import type { WidgetState } from "./widget.types.ts";

export const WIDGET_TASKS_UPDATED_EVENT = "widget:tasks-updated";

export async function emitWidgetTasksUpdated(
  state: WidgetState,
  source: string,
) {
  if (!isTauriRuntime()) {
    return;
  }

  await emit(WIDGET_TASKS_UPDATED_EVENT, { source, state });
}
