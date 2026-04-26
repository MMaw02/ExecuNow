import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import {
  getDefaultSessionWidgetProfile,
  getWidgetRuntime,
  type SessionWidgetProfile,
} from "../widget/widget.runtime.ts";
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
  const [profile, setProfile] = useState<SessionWidgetProfile>(() =>
    getDefaultSessionWidgetProfile(),
  );
  const displayState = createSessionWidgetDisplayState(snapshot);

  useEffect(() => {
    let disposed = false;

    void runtime.getSessionWidgetProfile().then((nextProfile) => {
      if (!disposed) {
        setProfile(nextProfile);
      }
    });

    return () => {
      disposed = true;
    };
  }, [runtime]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.dataset.sessionWidgetSurfaceVariant = profile.surfaceVariant;

    return () => {
      delete document.body.dataset.sessionWidgetSurfaceVariant;
    };
  }, [profile.surfaceVariant]);

  return {
    runtime,
    windowPolicy: {
      focusPolicy: profile.focusPolicy,
      runtime,
    },
    viewModel: buildSessionWidgetViewModel(snapshot, profile),
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
  profile: SessionWidgetProfile,
) {
  const displayState = createSessionWidgetDisplayState(snapshot);

  return {
    focusStateLabel: displayState.focusStateLabel,
    pauseDisabled: displayState.pauseDisabled,
    remainingSeconds: snapshot.remainingSeconds,
    sessionActive: displayState.sessionActive,
    shellVariant: profile.surfaceVariant,
    statusLabel: displayState.statusLabel,
    title: displayState.title,
  };
}
