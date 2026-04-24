import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import {
  getCurrentWindowLabel,
  isTauriRuntime,
} from "../widget/widget.events.ts";
import type {
  SessionWidgetControl,
  SessionWidgetSnapshot,
} from "./session-widget.types.ts";

export const SESSION_WIDGET_WINDOW_LABEL = "session-widget";
export const SESSION_WIDGET_STATE_UPDATED_EVENT = "session:state-updated";
export const SESSION_WIDGET_CONTROL_EVENT = "session:control";
export const SESSION_WIDGET_BROWSER_UPDATED_EVENT = "execunow:session-widget-updated";

export { getCurrentWindowLabel };

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
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("reinforce_session_widget_z_order", {
    force_focus: forceFocus,
  });
}
