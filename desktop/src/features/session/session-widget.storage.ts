import {
  createInactiveSessionWidgetSnapshot,
  normalizeSessionWidgetSnapshot,
} from "./session-widget.model.ts";
import type { SessionWidgetSnapshot } from "./session-widget.types.ts";

export const SESSION_WIDGET_SNAPSHOT_STORAGE_KEY =
  "execunow.session-widget.snapshot";

export function readSessionWidgetSnapshot(
  storage: Storage | null = getBrowserStorage(),
): SessionWidgetSnapshot {
  if (!storage) {
    return createInactiveSessionWidgetSnapshot();
  }

  try {
    const rawSnapshot = storage.getItem(SESSION_WIDGET_SNAPSHOT_STORAGE_KEY);

    if (!rawSnapshot) {
      return createInactiveSessionWidgetSnapshot();
    }

    return normalizeSessionWidgetSnapshot(
      JSON.parse(rawSnapshot) as Partial<SessionWidgetSnapshot>,
    );
  } catch {
    return createInactiveSessionWidgetSnapshot();
  }
}

export function writeSessionWidgetSnapshot(
  snapshot: SessionWidgetSnapshot,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      SESSION_WIDGET_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(normalizeSessionWidgetSnapshot(snapshot)),
    );
  } catch {
    // Ignore storage failures so the session widget remains usable.
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
