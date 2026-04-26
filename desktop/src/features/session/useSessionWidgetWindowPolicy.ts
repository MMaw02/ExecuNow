import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import type {
  SessionWidgetFocusPolicy,
  WidgetRuntime,
} from "../widget/widget.runtime.ts";
import { isTauriRuntime } from "../widget/widget.runtime.ts";

export function useSessionWidgetWindowPolicy(input: {
  focusPolicy: SessionWidgetFocusPolicy;
  runtime: WidgetRuntime;
}) {
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    const currentWindow = getCurrentWebviewWindow();
    let disposed = false;
    let releaseFocusListener: (() => void) | undefined;

    async function enforceWindowPriority(forceFocus = false) {
      if (disposed) {
        return;
      }

      try {
        await input.runtime.reinforceSessionWidgetZOrder(forceFocus);
      } catch {
        // Keep the widget responsive even when native focus controls fail.
      }
    }

    const forceFocusOnOpen = shouldForceFocusOnOpen(input.focusPolicy);
    const reassertOnBlur = shouldReassertOnBlur(input.focusPolicy);

    void enforceWindowPriority(forceFocusOnOpen);
    void currentWindow
      .onFocusChanged(({ payload: focused }) => {
        if (!focused && reassertOnBlur) {
          void enforceWindowPriority(false);
        }
      })
      .then((unlisten) => {
        if (disposed) {
          unlisten();
          return;
        }

        releaseFocusListener = unlisten;
      });

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && reassertOnBlur) {
        void enforceWindowPriority(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseFocusListener?.();
    };
  }, [input.focusPolicy, input.runtime]);
}

export function shouldForceFocusOnOpen(focusPolicy: SessionWidgetFocusPolicy) {
  return focusPolicy !== "passive";
}

export function shouldReassertOnBlur(focusPolicy: SessionWidgetFocusPolicy) {
  return focusPolicy === "focus-on-open" || focusPolicy === "aggressive";
}
