import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useMemo, useState } from "react";
import { normalizePomodoroSettings } from "./pomodoro.model.ts";
import {
  POMODORO_SETTINGS_STORAGE_KEY,
  readPomodoroSettings,
  writePomodoroSettings,
} from "./pomodoro.storage.ts";
import type { PomodoroSettings } from "./pomodoro.types.ts";

const POMODORO_SETTINGS_UPDATED_EVENT = "pomodoro:settings-updated";
const BROWSER_POMODORO_SETTINGS_EVENT = "execunow:pomodoro-settings-updated";

type PomodoroSettingsUpdatedPayload = {
  source: string;
  settings: PomodoroSettings;
};

export function usePomodoroSettings() {
  const windowLabel = getCurrentWindowLabel();
  const [settings, setSettings] = useState<PomodoroSettings>(() => readPomodoroSettings());

  useEffect(() => {
    function handleBrowserSettingsUpdated(event: Event) {
      const payload = (event as CustomEvent<PomodoroSettings>).detail;

      if (!payload) {
        return;
      }

      setSettings(normalizePomodoroSettings(payload));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== POMODORO_SETTINGS_STORAGE_KEY) {
        return;
      }

      setSettings(readPomodoroSettings());
    }

    window.addEventListener(BROWSER_POMODORO_SETTINGS_EVENT, handleBrowserSettingsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        BROWSER_POMODORO_SETTINGS_EVENT,
        handleBrowserSettingsUpdated,
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
      .listen<PomodoroSettingsUpdatedPayload>(
        POMODORO_SETTINGS_UPDATED_EVENT,
        (event) => {
          if (event.payload.source === windowLabel) {
            return;
          }

          setSettings(normalizePomodoroSettings(event.payload.settings));
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

  return useMemo(
    () => ({
      settings,
      updateSettings(updates: Partial<PomodoroSettings>) {
        const nextSettings = normalizePomodoroSettings({
          ...settings,
          ...updates,
        });

        setSettings(nextSettings);
        writePomodoroSettings(nextSettings);
        emitBrowserSettingsUpdated(nextSettings);
        void emitTauriSettingsUpdated(nextSettings, windowLabel);
      },
    }),
    [settings, windowLabel],
  );
}

function emitBrowserSettingsUpdated(settings: PomodoroSettings) {
  window.dispatchEvent(
    new CustomEvent(BROWSER_POMODORO_SETTINGS_EVENT, {
      detail: settings,
    }),
  );
}

async function emitTauriSettingsUpdated(settings: PomodoroSettings, source: string) {
  if (!isTauriRuntime()) {
    return;
  }

  await emit(POMODORO_SETTINGS_UPDATED_EVENT, { source, settings });
}

function getCurrentWindowLabel(): string {
  return isTauriRuntime() ? getCurrentWebviewWindow().label : "browser";
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
