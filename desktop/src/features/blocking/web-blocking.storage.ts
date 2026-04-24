import {
  DEFAULT_WEB_BLOCKING_SETTINGS,
  normalizeWebBlockingSettings,
} from "./web-blocking.model.ts";
import type { WebBlockingSettings } from "./web-blocking.types.ts";

export const WEB_BLOCKING_SETTINGS_STORAGE_KEY = "execunow.web-blocking.settings";

export function readWebBlockingSettings(
  storage: Storage | null = getBrowserStorage(),
): WebBlockingSettings {
  if (!storage) {
    return DEFAULT_WEB_BLOCKING_SETTINGS;
  }

  try {
    const rawSettings = storage.getItem(WEB_BLOCKING_SETTINGS_STORAGE_KEY);

    if (!rawSettings) {
      return DEFAULT_WEB_BLOCKING_SETTINGS;
    }

    return normalizeWebBlockingSettings(
      JSON.parse(rawSettings) as Partial<WebBlockingSettings>,
    );
  } catch {
    return DEFAULT_WEB_BLOCKING_SETTINGS;
  }
}

export function writeWebBlockingSettings(
  settings: WebBlockingSettings,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      WEB_BLOCKING_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizeWebBlockingSettings(settings)),
    );
  } catch {
    // Ignore storage failures so blocking settings remain usable.
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
