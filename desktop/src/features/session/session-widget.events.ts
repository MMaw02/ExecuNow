import { emit } from "@tauri-apps/api/event";
import {
  getCurrentWindowKind,
  getWidgetRuntime,
  isTauriRuntime,
  SESSION_WIDGET_WINDOW_KIND,
} from "../widget/widget.runtime.ts";
import type {
  SessionWidgetControl,
  SessionWidgetSnapshot,
} from "./session-widget.types.ts";

export const SESSION_WIDGET_WINDOW_LABEL = SESSION_WIDGET_WINDOW_KIND;
export const SESSION_WIDGET_STATE_UPDATED_EVENT = "session:state-updated";
export const SESSION_WIDGET_CONTROL_EVENT = "session:control";
export const SESSION_WIDGET_BROWSER_UPDATED_EVENT = "execunow:session-widget-updated";

export const getCurrentWindowLabel = getCurrentWindowKind;

export function emitBrowserSessionWidgetUpdated(
  snapshot: SessionWidgetSnapshot,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SESSION_WIDGET_BROWSER_UPDATED_EVENT, {
      detail: snapshot,
    }),
  );
}

export async function emitSessionWidgetStateUpdated(
  snapshot: SessionWidgetSnapshot,
  source: string,
) {
  if (!isTauriRuntime()) {
    return;
  }

  await emit(SESSION_WIDGET_STATE_UPDATED_EVENT, {
    source,
    snapshot,
  });
}

export async function emitSessionWidgetControl(
  control: SessionWidgetControl,
  source: string,
) {
  if (!isTauriRuntime()) {
    return;
  }

  await emit(SESSION_WIDGET_CONTROL_EVENT, {
    source,
    control,
  });
}

export async function reinforceSessionWidgetZOrder(forceFocus = false) {
  await getWidgetRuntime().reinforceSessionWidgetZOrder(forceFocus);
}
