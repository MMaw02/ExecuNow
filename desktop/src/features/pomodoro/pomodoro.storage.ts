import {
  DEFAULT_POMODORO_SETTINGS,
  normalizePomodoroSettings,
} from "./pomodoro.model.ts";
import type { PomodoroSettings } from "./pomodoro.types.ts";

export const POMODORO_SETTINGS_STORAGE_KEY = "execunow.pomodoro.settings";

export function readPomodoroSettings(
  storage: Storage | null = getBrowserStorage(),
): PomodoroSettings {
  if (!storage) {
    return DEFAULT_POMODORO_SETTINGS;
  }

  try {
    const rawSettings = storage.getItem(POMODORO_SETTINGS_STORAGE_KEY);

    if (!rawSettings) {
      return DEFAULT_POMODORO_SETTINGS;
    }

    return normalizePomodoroSettings(
      JSON.parse(rawSettings) as Partial<PomodoroSettings>,
    );
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

export function writePomodoroSettings(
  settings: PomodoroSettings,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      POMODORO_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizePomodoroSettings(settings)),
    );
  } catch {
    // Ignore storage failures so task capture stays usable.
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
