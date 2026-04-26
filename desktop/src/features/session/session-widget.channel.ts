import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isTauriRuntime } from "../widget/widget.runtime.ts";
import {
  normalizeSessionWidgetControl,
  normalizeSessionWidgetSnapshot,
  shouldPersistSessionWidgetSnapshot,
} from "./session-widget.model.ts";
import {
  SESSION_WIDGET_SNAPSHOT_STORAGE_KEY,
  readSessionWidgetSnapshot,
  writeSessionWidgetSnapshot,
} from "./session-widget.storage.ts";
import type {
  SessionWidgetControl,
  SessionWidgetControlPayload,
  SessionWidgetSnapshot,
  SessionWidgetStateUpdatedPayload,
} from "./session-widget.types.ts";

export const SESSION_WIDGET_STATE_UPDATED_EVENT = "session:state-updated";
export const SESSION_WIDGET_CONTROL_EVENT = "session:control";
export const SESSION_WIDGET_BROWSER_UPDATED_EVENT = "execunow:session-widget-updated";
export const SESSION_WIDGET_BROWSER_CONTROL_EVENT = "execunow:session-widget-control";

export type SessionWidgetSnapshotChannel = {
  publishControl(control: SessionWidgetControl, source: string): Promise<void>;
  publishSnapshot(snapshot: SessionWidgetSnapshot, source: string): Promise<void>;
  readInitialSnapshot(): SessionWidgetSnapshot;
  subscribeControl(
    source: string,
    onControl: (payload: SessionWidgetControlPayload) => void,
  ): () => void;
  subscribeSnapshot(
    source: string,
    onSnapshot: (snapshot: SessionWidgetSnapshot) => void,
  ): () => void;
};

export function createSessionWidgetSnapshotChannel(
  storage: Storage | null = getBrowserStorage(),
): SessionWidgetSnapshotChannel {
  return {
    readInitialSnapshot() {
      return readSessionWidgetSnapshot(storage);
    },
    async publishSnapshot(snapshot, source) {
      const normalizedSnapshot = normalizeSessionWidgetSnapshot(snapshot);
      const persistedSnapshot = readSessionWidgetSnapshot(storage);

      if (shouldPersistSessionWidgetSnapshot(persistedSnapshot, normalizedSnapshot)) {
        writeSessionWidgetSnapshot(normalizedSnapshot, storage);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<SessionWidgetStateUpdatedPayload>(
            SESSION_WIDGET_BROWSER_UPDATED_EVENT,
            {
              detail: {
                source,
                snapshot: normalizedSnapshot,
              },
            },
          ),
        );
      }

      if (!isTauriRuntime()) {
        return;
      }

      await emit(SESSION_WIDGET_STATE_UPDATED_EVENT, {
        source,
        snapshot: normalizedSnapshot,
      });
    },
    async publishControl(control, source) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<SessionWidgetControlPayload>(
            SESSION_WIDGET_BROWSER_CONTROL_EVENT,
            {
              detail: {
                source,
                control,
              },
            },
          ),
        );
      }

      if (!isTauriRuntime()) {
        return;
      }

      await emit(SESSION_WIDGET_CONTROL_EVENT, {
        source,
        control,
      });
    },
    subscribeSnapshot(source, onSnapshot) {
      function handleBrowserUpdated(event: Event) {
        const payload = (event as CustomEvent<SessionWidgetStateUpdatedPayload>).detail;

        if (!payload || payload.source === source) {
          return;
        }

        onSnapshot(normalizeSessionWidgetSnapshot(payload.snapshot));
      }

      function handleStorage(event: StorageEvent) {
        if (
          event.key !== null &&
          event.key !== undefined &&
          event.key !== SESSION_WIDGET_SNAPSHOT_STORAGE_KEY
        ) {
          return;
        }

        onSnapshot(readSessionWidgetSnapshot(storage));
      }

      window.addEventListener(SESSION_WIDGET_BROWSER_UPDATED_EVENT, handleBrowserUpdated);
      window.addEventListener("storage", handleStorage);

      let unlisten: (() => void) | undefined;
      let disposed = false;

      if (isTauriRuntime()) {
        void getCurrentWebviewWindow()
          .listen<SessionWidgetStateUpdatedPayload>(
            SESSION_WIDGET_STATE_UPDATED_EVENT,
            (event) => {
              if (event.payload.source === source) {
                return;
              }

              onSnapshot(normalizeSessionWidgetSnapshot(event.payload.snapshot));
            },
          )
          .then((cleanup) => {
            if (disposed) {
              cleanup();
              return;
            }

            unlisten = cleanup;
          });
      }

      return () => {
        disposed = true;
        window.removeEventListener(SESSION_WIDGET_BROWSER_UPDATED_EVENT, handleBrowserUpdated);
        window.removeEventListener("storage", handleStorage);
        unlisten?.();
      };
    },
    subscribeControl(source, onControl) {
      function handleBrowserControl(event: Event) {
        const payload = (event as CustomEvent<SessionWidgetControlPayload>).detail;
        const control = normalizeSessionWidgetControl(payload?.control);

        if (!payload || payload.source === source || !control) {
          return;
        }

        onControl({
          source: payload.source,
          control,
        });
      }

      window.addEventListener(SESSION_WIDGET_BROWSER_CONTROL_EVENT, handleBrowserControl);

      let unlisten: (() => void) | undefined;
      let disposed = false;

      if (isTauriRuntime()) {
        void getCurrentWebviewWindow()
          .listen<SessionWidgetControlPayload>(SESSION_WIDGET_CONTROL_EVENT, (event) => {
            const control = normalizeSessionWidgetControl(event.payload.control);

            if (event.payload.source === source || !control) {
              return;
            }

            onControl({
              source: event.payload.source,
              control,
            });
          })
          .then((cleanup) => {
            if (disposed) {
              cleanup();
              return;
            }

            unlisten = cleanup;
          });
      }

      return () => {
        disposed = true;
        window.removeEventListener(SESSION_WIDGET_BROWSER_CONTROL_EVENT, handleBrowserControl);
        unlisten?.();
      };
    },
  };
}

export function getSessionWidgetSnapshotChannel() {
  return defaultSessionWidgetSnapshotChannel;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

const defaultSessionWidgetSnapshotChannel = createSessionWidgetSnapshotChannel();
