import { useEffect } from "react";
import type { WidgetRuntime } from "../widget/widget.runtime.ts";
import { isTauriRuntime } from "../widget/widget.runtime.ts";

export function useSessionWidgetWindowPolicy(runtime: WidgetRuntime) {
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    void runtime.reinforceSessionWidgetZOrder(true).catch(() => {
      // Keep the widget usable even if native focus controls fail.
    });
  }, [runtime]);
}
