import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { GripVertical, Pause, Play, X } from "lucide-react";
import { useEffect } from "react";
import type { MouseEvent } from "react";
import { Button } from "../../shared/components/ui/button.tsx";
import { formatClock } from "../../shared/utils/formatClock.ts";
import {
  emitSessionWidgetControl,
  getCurrentWindowLabel,
  reinforceSessionWidgetZOrder,
} from "./session-widget.events.ts";
import { isSessionWidgetActive } from "./session-widget.model.ts";
import { useSessionWidgetSnapshot } from "./useSessionWidgetSnapshot.ts";
import { isTauriRuntime, startWidgetWindowDrag } from "../widget/widget.events.ts";

export function SessionWidgetApp() {
  const snapshot = useSessionWidgetSnapshot();
  const windowLabel = getCurrentWindowLabel();
  const sessionActive = isSessionWidgetActive(snapshot);
  const pauseDisabled = !snapshot.isPaused && snapshot.pauseUsed;
  const title = snapshot.sessionTask || "Focus block";
  const statusLabel = snapshot.isPaused
    ? "Paused"
    : snapshot.sessionPhase === "break"
      ? "Break live"
    : snapshot.strictBlocking
      ? "Strict focus live"
      : "Focus block live";

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
        await reinforceSessionWidgetZOrder(forceFocus);
      } catch {
        // Ignore runtime window failures so the widget keeps rendering.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        void enforceWindowPriority(true);
      }
    }

    void enforceWindowPriority(true);
    void currentWindow.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        void enforceWindowPriority(true);
      }
    }).then((unlisten) => {
      if (disposed) {
        unlisten();
        return;
      }

      releaseFocusListener = unlisten;
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const priorityHeartbeat = window.setInterval(() => {
      void enforceWindowPriority(true);
    }, 900);

    return () => {
      disposed = true;
      window.clearInterval(priorityHeartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseFocusListener?.();
    };
  }, []);

  function handleWidgetMouseDown(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (
      target.closest(
        "button, input, select, textarea, a, [role='button'], [data-widget-no-drag]",
      )
    ) {
      return;
    }

    event.preventDefault();
    void startWidgetWindowDrag();
  }

  async function handleTogglePause() {
    if (!sessionActive || pauseDisabled) {
      return;
    }

    await emitSessionWidgetControl("toggle-pause", windowLabel);
  }

  async function handleReturnToMain() {
    await emitSessionWidgetControl("return-to-main", windowLabel);
  }

  return (
    <main className="grid h-screen w-screen place-items-center overflow-hidden bg-transparent p-3">
      <section
        className="grid h-[96px] w-full max-w-[820px] grid-cols-[92px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[10px] border border-[rgba(140,170,222,0.18)] bg-[rgba(4,17,36,0.82)] px-4 py-3 text-foreground shadow-none backdrop-blur-[8px]"
        onMouseDown={handleWidgetMouseDown}
        data-tauri-drag-region
      >
        <div className="flex h-full select-none items-center justify-center rounded-[8px] border border-white/6 bg-white/[0.03] text-[rgba(78,222,163,0.72)]">
          <GripVertical size={22} aria-hidden="true" />
        </div>

        <div className="grid min-w-0 gap-1.5 select-none">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--accent-support)]">
            Active Mission
          </span>
          <strong className="truncate text-[2rem] font-semibold leading-none tracking-[-0.06em] text-foreground">
            {sessionActive ? title : "Session unavailable"}
          </strong>
          <p className="truncate text-xs text-muted-foreground">
            {sessionActive
              ? statusLabel
              : "Return to the main session view to continue."}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-[8px] border border-white/6 bg-white/[0.03] text-[var(--accent-success)] hover:bg-white/[0.07] hover:text-[color-mix(in_srgb,var(--accent-success)_78%,white)]"
          onClick={handleTogglePause}
          disabled={!sessionActive || pauseDisabled}
          data-widget-no-drag
        >
          {snapshot.isPaused ? <Play size={20} /> : <Pause size={20} />}
        </Button>

        <div className="flex items-center gap-3" data-widget-no-drag>
          <div className="grid min-w-[178px] gap-2 rounded-[8px] border border-[rgba(25,120,229,0.26)] bg-[rgba(13,38,72,0.76)] px-4 py-3">
            <div className="flex items-end gap-2 font-semibold leading-none">
              <span className="text-[2.1rem] tracking-[-0.08em] text-[var(--accent-success)] tabular-nums">
                {formatClock(snapshot.remainingSeconds)}
              </span>
              <span className="pb-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[rgba(78,222,163,0.72)]">
                {snapshot.isPaused
                  ? "PAUSE"
                  : snapshot.sessionPhase === "break"
                    ? "BREAK"
                    : "FOCUS"}
              </span>
            </div>
            <div className="h-1 rounded-full bg-[var(--accent-success)]" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-[8px] border border-white/6 bg-white/[0.03] text-[var(--accent-support)] hover:bg-white/[0.07] hover:text-white"
            onClick={handleReturnToMain}
            data-widget-no-drag
          >
            <X size={20} />
          </Button>
        </div>
      </section>
    </main>
  );
}
