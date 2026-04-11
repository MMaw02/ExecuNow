import { useEffect, useReducer } from "react";
import { NAV_ITEMS } from "./session.constants.ts";
import {
  canNavigateTo,
  createInitialSessionState,
  getTopbarStatusLabel,
  isSessionPrepared,
  isSessionFlowLocked,
  sessionReducer,
} from "./session.model.ts";
import type {
  DurationOption,
  NavView,
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
      activeNav: getActiveNavView(state.view),
      isSessionMode: state.view === "active",
      sessionPrepared,
      sessionFlowLocked,
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

function getActiveNavView(view: View): NavView {
  if (view === "active" || view === "outcome") {
    return "today";
  }

  return view;
}
