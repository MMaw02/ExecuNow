import type { MouseEvent } from "react";
import { getWidgetRuntime } from "../widget/widget.runtime.ts";
import { shouldStartWidgetWindowDrag } from "../widget/widget.window.ts";
import {
  createSessionWidgetDisplayState,
  isSessionWidgetActive,
} from "./session-widget.model.ts";
import { getSessionWidgetSnapshotChannel } from "./session-widget.channel.ts";
import { useSessionWidgetSnapshot } from "./useSessionWidgetSnapshot.ts";

export function useSessionWidgetController() {
  const snapshot = useSessionWidgetSnapshot();
  const runtime = getWidgetRuntime();
  const channel = getSessionWidgetSnapshotChannel();
  const displayState = createSessionWidgetDisplayState(snapshot);

  return {
    runtime,
    viewModel: buildSessionWidgetViewModel(snapshot),
    handlers: {
      onReturnToMain() {
        void channel.publishControl("return-to-main", runtime.getCurrentWindowKind());
      },
      onTogglePause() {
        if (!isSessionWidgetActive(snapshot) || displayState.pauseDisabled) {
          return;
        }

        void channel.publishControl("toggle-pause", runtime.getCurrentWindowKind());
      },
      onWidgetMouseDown(event: MouseEvent<HTMLElement>) {
        if (event.button !== 0 || !shouldStartWidgetWindowDrag(event.target)) {
          return;
        }

        event.preventDefault();
        void runtime.startWindowDrag();
      },
    },
  };
}

export function buildSessionWidgetViewModel(
  snapshot: ReturnType<typeof useSessionWidgetSnapshot>,
) {
  const displayState = createSessionWidgetDisplayState(snapshot);

  return {
    focusStateLabel: displayState.focusStateLabel,
    pauseDisabled: displayState.pauseDisabled,
    remainingSeconds: snapshot.remainingSeconds,
    sessionActive: displayState.sessionActive,
    statusLabel: displayState.statusLabel,
    title: displayState.title,
  };
}
