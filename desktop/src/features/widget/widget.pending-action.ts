import type { DurationOption } from "../session/session.types.ts";

export type WidgetTaskTransferPayload = {
  title: string;
  duration: DurationOption;
};

export type WidgetPendingAction =
  | { type: "open-tasks" }
  | {
      type: "start-task";
      payload: WidgetTaskTransferPayload;
    };

export type WidgetPendingActionStore = {
  consumePendingAction(): WidgetPendingAction | null;
  setPendingAction(action: WidgetPendingAction): void;
};

export const WIDGET_PENDING_ACTION_STORAGE_KEY = "execunow.widget.pending-action";

export function createWidgetPendingActionStore(
  storage: Storage | null = getBrowserStorage(),
): WidgetPendingActionStore {
  return {
    consumePendingAction() {
      if (!storage) {
        return null;
      }

      const rawValue = storage.getItem(WIDGET_PENDING_ACTION_STORAGE_KEY);

      if (!rawValue) {
        return null;
      }

      storage.removeItem(WIDGET_PENDING_ACTION_STORAGE_KEY);

      try {
        const value = JSON.parse(rawValue) as unknown;
        return parseWidgetPendingAction(value);
      } catch {
        return null;
      }
    },
    setPendingAction(action) {
      if (!storage) {
        return;
      }

      storage.setItem(WIDGET_PENDING_ACTION_STORAGE_KEY, JSON.stringify(action));
    },
  };
}

export function parseWidgetPendingAction(
  value: unknown,
): WidgetPendingAction | null {
  if (value && typeof value === "object" && "type" in value) {
    const candidate = value as {
      payload?: WidgetTaskTransferPayload;
      type?: string;
    };

    if (candidate.type === "open-tasks") {
      return { type: "open-tasks" };
    }

    if (
      candidate.type === "start-task" &&
      typeof candidate.payload?.title === "string" &&
      Number.isFinite(candidate.payload.duration)
    ) {
      return {
        type: "start-task",
        payload: {
          title: candidate.payload.title,
          duration: candidate.payload.duration,
        },
      };
    }
  }

  return null;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
