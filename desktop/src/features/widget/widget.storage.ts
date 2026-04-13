import {
  createEmptyWidgetState,
  normalizeWidgetState,
} from "./widget.model.ts";
import type { WidgetState } from "./widget.types.ts";

export const WIDGET_STORAGE_KEY = "execunow.startup-widget.state";

export function readWidgetState(storage: Storage | null = getBrowserStorage()): WidgetState {
  if (!storage) {
    return createEmptyWidgetState();
  }

  try {
    const rawState = storage.getItem(WIDGET_STORAGE_KEY);

    if (!rawState) {
      return createEmptyWidgetState();
    }

    return normalizeWidgetState(JSON.parse(rawState) as Partial<WidgetState>);
  } catch {
    return createEmptyWidgetState();
  }
}

export function writeWidgetState(
  state: WidgetState,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures so the widget stays usable.
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
