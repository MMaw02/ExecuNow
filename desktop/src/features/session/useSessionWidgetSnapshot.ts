import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import {
  SESSION_WIDGET_BROWSER_UPDATED_EVENT,
  SESSION_WIDGET_STATE_UPDATED_EVENT,
  getCurrentWindowLabel,
} from "./session-widget.events.ts";
import { normalizeSessionWidgetSnapshot } from "./session-widget.model.ts";
import {
  SESSION_WIDGET_SNAPSHOT_STORAGE_KEY,
  readSessionWidgetSnapshot,
} from "./session-widget.storage.ts";
import type {
  SessionWidgetSnapshot,
  SessionWidgetStateUpdatedPayload,
} from "./session-widget.types.ts";
import { isTauriRuntime } from "../widget/widget.events.ts";

export function useSessionWidgetSnapshot() {
  const windowLabel = getCurrentWindowLabel();
  const [snapshot, setSnapshot] = useState<SessionWidgetSnapshot>(() =>
    readSessionWidgetSnapshot(),
  );

  useEffect(() => {
    function handleBrowserUpdated(event: Event) {
      const payload = (event as CustomEvent<SessionWidgetSnapshot>).detail;

      if (!payload) {
        return;
      }

      setSnapshot(normalizeSessionWidgetSnapshot(payload));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== SESSION_WIDGET_SNAPSHOT_STORAGE_KEY) {
        return;
      }

      setSnapshot(readSessionWidgetSnapshot());
    }

    window.addEventListener(
      SESSION_WIDGET_BROWSER_UPDATED_EVENT,
      handleBrowserUpdated,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        SESSION_WIDGET_BROWSER_UPDATED_EVENT,
        handleBrowserUpdated,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let unlisten: (() => void) | undefined;
    let disposed = false;

    void getCurrentWebviewWindow()
      .listen<SessionWidgetStateUpdatedPayload>(
        SESSION_WIDGET_STATE_UPDATED_EVENT,
        (event) => {
          if (event.payload.source === windowLabel) {
            return;
          }

          setSnapshot(normalizeSessionWidgetSnapshot(event.payload.snapshot));
        },
      )
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

  return snapshot;
}
