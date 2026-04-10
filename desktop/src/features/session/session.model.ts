import { DURATIONS } from "./session.constants.ts";
import type {
  SessionAction,
  SessionState,
  SessionStats,
  View,
} from "./session.types.ts";

const DEFAULT_DURATION = DURATIONS[1];

const INITIAL_STATS: SessionStats = {
  completed: 0,
  incomplete: 0,
  abandoned: 0,
  focusMinutes: 0,
};

export function createInitialSessionState(): SessionState {
  return {
    view: "home",
    taskTitle: "",
    selectedDuration: DEFAULT_DURATION,
    strictBlocking: true,
    sessionTask: "",
    sessionDuration: DEFAULT_DURATION,
    remainingSeconds: DEFAULT_DURATION * 60,
    isPaused: false,
    pauseUsed: false,
    sessionResult: null,
    failureReason: "",
    stats: INITIAL_STATS,
  };
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "taskTitleChanged":
      return {
        ...state,
        taskTitle: action.value,
      };
    case "durationSelected":
      return {
        ...state,
        selectedDuration: action.value,
        remainingSeconds:
          state.view === "home" ? action.value * 60 : state.remainingSeconds,
      };
    case "strictBlockingToggled":
      if (isSessionFlowLocked(state)) {
        return state;
      }

      return {
        ...state,
        strictBlocking: !state.strictBlocking,
      };
    case "navigated":
      return {
        ...state,
        view: action.value,
      };
    case "sessionStarted":
      if (!isSessionPrepared(state)) {
        return state;
      }

      return {
        ...state,
        view: "active",
        sessionTask: state.taskTitle.trim(),
        sessionDuration: state.selectedDuration,
        remainingSeconds: state.selectedDuration * 60,
        isPaused: false,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
      };
    case "pauseToggled":
      if (state.view !== "active") {
        return state;
      }

      if (state.isPaused) {
        return {
          ...state,
          isPaused: false,
        };
      }

      if (state.pauseUsed) {
        return state;
      }

      return {
        ...state,
        isPaused: true,
        pauseUsed: true,
      };
    case "sessionClosed":
      return {
        ...state,
        view: "outcome",
        sessionResult: action.value,
        isPaused: false,
      };
    case "sessionResultSelected":
      return {
        ...state,
        sessionResult: action.value,
        failureReason: action.value === "completed" ? "" : state.failureReason,
      };
    case "failureReasonSelected":
      return {
        ...state,
        failureReason: action.value,
      };
    case "sessionSaved":
      if (!state.sessionResult) {
        return state;
      }

      return {
        ...state,
        view: "home",
        taskTitle: "",
        sessionTask: "",
        sessionDuration: state.selectedDuration,
        remainingSeconds: state.selectedDuration * 60,
        isPaused: false,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
        stats: {
          ...state.stats,
          [state.sessionResult]: state.stats[state.sessionResult] + 1,
          focusMinutes:
            state.stats.focusMinutes + getCapturedMinutesForSave(state),
        },
      };
    case "tick":
      if (state.view !== "active" || state.isPaused) {
        return state;
      }

      const remainingSeconds = Math.max(state.remainingSeconds - 1, 0);

      if (remainingSeconds === 0) {
        return {
          ...state,
          remainingSeconds,
          view: "outcome",
          sessionResult: "completed",
          isPaused: false,
        };
      }

      return {
        ...state,
        remainingSeconds,
      };
    default:
      return assertNever(action);
  }
}

export function isSessionPrepared(state: SessionState) {
  return state.taskTitle.trim().length > 0;
}

export function isSessionFlowLocked(state: Pick<SessionState, "view">) {
  return state.view === "active" || state.view === "outcome";
}

export function hasSessionRecord(state: SessionState) {
  return (
    state.sessionTask.trim().length > 0 ||
    state.sessionResult !== null ||
    state.view === "active" ||
    state.view === "outcome"
  );
}

export function canNavigateTo(
  state: SessionState,
  target: View,
) {
  if (isSessionFlowLocked(state)) {
    return target === state.view;
  }

  if ((target === "active" || target === "outcome") && !hasSessionRecord(state)) {
    return false;
  }

  return true;
}

export function getElapsedMinutes(state: SessionState) {
  return Math.max(
    state.sessionDuration - Math.ceil(state.remainingSeconds / 60),
    0,
  );
}

export function getCompletedTodayLabel(stats: SessionStats) {
  const closedSessions = stats.completed + stats.incomplete + stats.abandoned;

  return closedSessions > 0 ? `${stats.completed} completed` : "No sessions closed yet";
}

export function getBlockingModeLabel(strictBlocking: boolean) {
  return strictBlocking ? "Armed" : "Relaxed";
}

export function getBlockingModeDescription(strictBlocking: boolean) {
  return strictBlocking
    ? "Apps and sites stay firm during focus."
    : "Blocking stays advisory until you tighten it.";
}

export function getTopbarStatusLabel(
  state: Pick<SessionState, "isPaused" | "strictBlocking">,
) {
  if (state.isPaused) {
    return "Session paused";
  }

  return state.strictBlocking ? "Blocking armed" : "Blocking relaxed";
}

function getCapturedMinutesForSave(state: SessionState) {
  return state.sessionResult === "completed"
    ? state.sessionDuration
    : getElapsedMinutes(state);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled session action: ${JSON.stringify(value)}`);
}
