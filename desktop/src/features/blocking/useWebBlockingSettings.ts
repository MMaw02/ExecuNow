import { useEffect, useMemo, useState } from "react";
import {
  addWebBlockEntry,
  normalizeWebBlockingSettings,
  removeWebBlockEntry,
} from "./web-blocking.model.ts";
import {
  readWebBlockingSettings,
  WEB_BLOCKING_SETTINGS_STORAGE_KEY,
  writeWebBlockingSettings,
} from "./web-blocking.storage.ts";

const BROWSER_WEB_BLOCKING_UPDATED_EVENT = "execunow:web-blocking-updated";

export function useWebBlockingSettings() {
  const [settings, setSettings] = useState(() => readWebBlockingSettings());

  useEffect(() => {
    function handleBrowserUpdate(event: Event) {
      const payload = (event as CustomEvent).detail;

      setSettings(normalizeWebBlockingSettings(payload));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== WEB_BLOCKING_SETTINGS_STORAGE_KEY) {
        return;
      }

      setSettings(readWebBlockingSettings());
    }

    window.addEventListener(BROWSER_WEB_BLOCKING_UPDATED_EVENT, handleBrowserUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(BROWSER_WEB_BLOCKING_UPDATED_EVENT, handleBrowserUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return useMemo(
    () => ({
      settings,
      readSettings() {
        return settings;
      },
      addEntry(rawInput: string) {
        const nextResult = addWebBlockEntry(settings, rawInput);

        if (!nextResult.ok) {
          return nextResult;
        }

        commit(nextResult.settings);
        return nextResult;
      },
      removeEntry(entryId: string) {
        commit(removeWebBlockEntry(settings, entryId));
      },
    }),
    [settings],
  );

  function commit(nextSettings: ReturnType<typeof normalizeWebBlockingSettings>) {
    setSettings(nextSettings);
    writeWebBlockingSettings(nextSettings);
    window.dispatchEvent(
      new CustomEvent(BROWSER_WEB_BLOCKING_UPDATED_EVENT, {
        detail: nextSettings,
      }),
    );
  }
}
