import { useEffect, useReducer } from "react";
import { NAV_ITEMS, VIEW_COPY } from "./session.constants.ts";
import {
  canNavigateTo,
  createInitialSessionState,
  getBlockingModeDescription,
  getBlockingModeLabel,
  getCompletedTodayLabel,
  getTopbarStatusLabel,
  isSessionFlowLocked,
  isSessionPrepared,
  sessionReducer,
} from "./session.model.ts";
import type {
  DurationOption,
  SessionOutcome,
  View,
} from "./session.types.ts";

export function useSessionFlow() {
  const [state, dispatch] = useReducer(
    sessionReducer,
    undefined,
    createInitialSessionState,
  );

  useEffect(() => {
    if (state.view !== "active" || state.isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.view, state.isPaused]);

  const sessionPrepared = isSessionPrepared(state);
  const sessionFlowLocked = isSessionFlowLocked(state);

  return {
    state,
    derived: {
      navItems: NAV_ITEMS,
      currentViewCopy: VIEW_COPY[state.view],
      isSessionMode: state.view === "active",
      sessionPrepared,
      sessionFlowLocked,
      completedTodayLabel: getCompletedTodayLabel(state.stats),
      blockingModeLabel: getBlockingModeLabel(state.strictBlocking),
      blockingModeDescription: getBlockingModeDescription(state.strictBlocking),
      topbarStatusLabel: getTopbarStatusLabel(state),
      canNavigateTo: (target: View) => canNavigateTo(state, target),
    },
    actions: {
      navigateTo(target: View) {
        if (!canNavigateTo(state, target)) {
          return;
        }

        dispatch({ type: "navigated", value: target });
      },
      setTaskTitle(value: string) {
        dispatch({ type: "taskTitleChanged", value });
      },
      selectDuration(value: DurationOption) {
        dispatch({ type: "durationSelected", value });
      },
      toggleStrictBlocking() {
        dispatch({ type: "strictBlockingToggled" });
      },
      startSession() {
        dispatch({ type: "sessionStarted" });
      },
      togglePause() {
        dispatch({ type: "pauseToggled" });
      },
      closeSession(result: SessionOutcome) {
        dispatch({ type: "sessionClosed", value: result });
      },
      selectSessionResult(result: SessionOutcome) {
        dispatch({ type: "sessionResultSelected", value: result });
      },
      selectFailureReason(value: string) {
        dispatch({ type: "failureReasonSelected", value });
      },
      saveOutcome() {
        dispatch({ type: "sessionSaved" });
      },
    },
  };
}
