import { DURATIONS } from "./session.constants.ts";
import {
  DEFAULT_POMODORO_SETTINGS,
  getPomodoroSessionTimeline,
  normalizePomodoroSettings,
} from "../pomodoro/pomodoro.model.ts";
import type {
  SessionAction,
  SessionOutcome,
  SessionRecord,
  SessionState,
  SessionStats,
  SessionTaskDraft,
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
    view: "today",
    taskTitle: "",
    selectedDuration: DEFAULT_DURATION,
    strictBlocking: true,
    sessionTask: "",
    sessionDuration: DEFAULT_DURATION,
    sessionPomodoroSettings: DEFAULT_POMODORO_SETTINGS,
    sessionPhase: "focus",
    sessionSegmentIndex: 0,
    elapsedFocusSeconds: 0,
    remainingSeconds: DEFAULT_DURATION * 60,
    isPaused: false,
    pauseUsed: false,
    sessionResult: null,
    failureReason: "",
    stats: INITIAL_STATS,
    history: [],
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
          !isSessionFlowLocked(state) ? action.value * 60 : state.remainingSeconds,
      };
    case "taskPreparedFromWidget": {
      const draft = normalizeSessionTaskDraft(action.value);

      return {
        ...state,
        view: "today",
        taskTitle: draft.title,
        selectedDuration: draft.duration,
        sessionTask: "",
        sessionDuration: draft.duration,
        sessionPhase: "focus",
        sessionSegmentIndex: 0,
        elapsedFocusSeconds: 0,
        remainingSeconds: draft.duration * 60,
        isPaused: false,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
      };
    }
    case "sessionStartedFromWidget": {
      const draft = normalizeSessionTaskDraft(action.value);
      const sessionPomodoroSettings = normalizePomodoroSettings(action.settings);
      const timeline = getPomodoroSessionTimeline(draft.duration, sessionPomodoroSettings);

      return {
        ...state,
        view: "active",
        taskTitle: draft.title,
        selectedDuration: draft.duration,
        sessionTask: draft.title,
        sessionDuration: draft.duration,
        sessionPomodoroSettings,
        sessionPhase: timeline.segments[0]?.phase ?? "focus",
        sessionSegmentIndex: 0,
        elapsedFocusSeconds: 0,
        remainingSeconds: timeline.segments[0]?.durationSeconds ?? draft.duration * 60,
        isPaused: false,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
      };
    }
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
    case "sessionStarted": {
      if (!isSessionPrepared(state)) {
        return state;
      }

      const sessionPomodoroSettings = normalizePomodoroSettings(action.settings);
      const timeline = getPomodoroSessionTimeline(state.selectedDuration, sessionPomodoroSettings);

      return {
        ...state,
        view: "active",
        sessionTask: state.taskTitle.trim(),
        sessionDuration: state.selectedDuration,
        sessionPomodoroSettings,
        sessionPhase: timeline.segments[0]?.phase ?? "focus",
        sessionSegmentIndex: 0,
        elapsedFocusSeconds: 0,
        remainingSeconds:
          timeline.segments[0]?.durationSeconds ?? state.selectedDuration * 60,
        isPaused: false,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
      };
    }
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

      const sessionRecord = createSessionRecord(state);

      return {
        ...state,
        view: "today",
        taskTitle: "",
        sessionTask: "",
        sessionDuration: state.selectedDuration,
        sessionPomodoroSettings: state.sessionPomodoroSettings,
        sessionPhase: "focus",
        sessionSegmentIndex: 0,
        elapsedFocusSeconds: 0,
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
        history: [sessionRecord, ...state.history].slice(0, 24),
      };
    case "tick": {
      if (state.view !== "active" || state.isPaused) {
        return state;
      }

      const timeline = getPomodoroSessionTimeline(
        state.sessionDuration,
        state.sessionPomodoroSettings,
      );
      const currentSegment = timeline.segments[state.sessionSegmentIndex];

      if (!currentSegment) {
        return {
          ...state,
          view: "outcome",
          sessionResult: "completed",
          isPaused: false,
          remainingSeconds: 0,
        };
      }

      const nextRemainingSeconds = Math.max(state.remainingSeconds - 1, 0);
      const elapsedFocusSeconds =
        state.elapsedFocusSeconds + (currentSegment.phase === "focus" ? 1 : 0);

      if (nextRemainingSeconds > 0) {
        return {
          ...state,
          elapsedFocusSeconds,
          remainingSeconds: nextRemainingSeconds,
        };
      }

      const nextSegment = timeline.segments[state.sessionSegmentIndex + 1];

      if (!nextSegment) {
        return {
          ...state,
          elapsedFocusSeconds,
          remainingSeconds: 0,
          view: "outcome",
          sessionResult: "completed",
          isPaused: false,
        };
      }

      return {
        ...state,
        elapsedFocusSeconds,
        sessionPhase: nextSegment.phase,
        sessionSegmentIndex: state.sessionSegmentIndex + 1,
        remainingSeconds: nextSegment.durationSeconds,
      };
    }
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
  return Math.max(Math.floor(state.elapsedFocusSeconds / 60), 0);
}

function createSessionRecord(state: SessionState): SessionRecord {
  return {
    id: `${Date.now()}`,
    task: state.sessionTask || "Focus block",
    duration: state.sessionDuration,
    capturedMinutes: getCapturedMinutesForSave(state),
    result: state.sessionResult as SessionOutcome,
    failureReason: state.failureReason,
    strictBlocking: state.strictBlocking,
    endedAt: new Date().toISOString(),
  };
}

function getCapturedMinutesForSave(state: SessionState) {
  return state.sessionResult === "completed"
    ? state.sessionDuration
    : getElapsedMinutes(state);
}

function normalizeSessionTaskDraft(draft: SessionTaskDraft): SessionTaskDraft {
  return {
    title: draft.title.trim(),
    duration: Math.max(Math.trunc(draft.duration), 1),
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled session action: ${JSON.stringify(value)}`);
}
