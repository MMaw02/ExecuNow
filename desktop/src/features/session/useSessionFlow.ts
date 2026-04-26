import { useEffect, useRef, useReducer } from "react";
import { toast } from "sonner";
import { applyWebBlocking, clearWebBlocking } from "../blocking/web-blocking.runtime.ts";
import { usePomodoroSettings } from "../pomodoro/usePomodoroSettings.ts";
import { NAV_ITEMS } from "./session.constants.ts";
import {
  canNavigateTo,
  createInitialSessionState,
  isSessionPrepared,
  isSessionFlowLocked,
  sessionReducer,
} from "./session.model.ts";
import {
  prepareBlockingForSession,
  releaseBlockingAfterSession,
} from "./session-blocking.ts";
import type {
  DurationOption,
  NavView,
  SessionOutcome,
  SessionTaskDraft,
  View,
} from "./session.types.ts";

export function useSessionFlow() {
  const { settings: pomodoroSettings } = usePomodoroSettings();
  const [state, dispatch] = useReducer(
    sessionReducer,
    undefined,
    createInitialSessionState,
  );
  const stateRef = useRef(state);
  const previousViewRef = useRef(state.view);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.view !== "active" || state.isPaused) {
      return;
    }

    let timerId = 0;

    const scheduleTick = () => {
      const nowMs = Date.now();
      dispatch({ type: "tick", nowMs });
      timerId = window.setTimeout(
        scheduleTick,
        Math.max(50, 1000 - (nowMs % 1000)),
      );
    };

    timerId = window.setTimeout(
      scheduleTick,
      Math.max(50, 1000 - (Date.now() % 1000)),
    );

    return () => window.clearTimeout(timerId);
  }, [state.view, state.isPaused]);

  useEffect(() => {
    const previousView = previousViewRef.current;
    previousViewRef.current = state.view;

    if (previousView !== "active" || state.view === "active") {
      return;
    }

    void releaseBlockingAfterSession({
      clear: clearWebBlocking,
    }).then((result) => {
      if (result.ok) {
        return;
      }

      toast.error("ExecuNow could not restore the system hosts file.", {
        description: result.error,
      });
    });
  }, [state.view]);

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
      prepareTaskFromWidget(value: SessionTaskDraft) {
        dispatch({ type: "taskPreparedFromWidget", value });
      },
      async startSessionFromWidgetTask(value: SessionTaskDraft) {
        const startAllowed = await prepareSessionStart(stateRef.current, value);

        if (!startAllowed) {
          return;
        }

        dispatch({
          type: "sessionStartedFromWidget",
          value,
          settings: pomodoroSettings,
          startedAtMs: Date.now(),
        });
      },
      toggleStrictBlocking() {
        dispatch({ type: "strictBlockingToggled" });
      },
      async startSession() {
        const startAllowed = await prepareSessionStart(stateRef.current);

        if (!startAllowed) {
          return;
        }

        dispatch({
          type: "sessionStarted",
          settings: pomodoroSettings,
          startedAtMs: Date.now(),
        });
      },
      togglePause() {
        dispatch({ type: "pauseToggled", nowMs: Date.now() });
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

  async function prepareSessionStart(
    nextState: typeof state,
    draft: SessionTaskDraft | null = null,
  ) {
    if (isSessionFlowLocked(nextState)) {
      return false;
    }

    if (draft ? draft.title.trim().length === 0 : !isSessionPrepared(nextState)) {
      return false;
    }

    const blockingResult = await prepareBlockingForSession(
      nextState,
      {
        apply: applyWebBlocking,
      },
    );

    if (blockingResult.ok) {
      return true;
    }

    toast.error("ExecuNow could not arm web blocking for this session.", {
      description: blockingResult.error,
    });

    return false;
  }
}

function getActiveNavView(view: View): NavView {
  if (view === "active" || view === "outcome") {
    return "today";
  }

  return view;
}
