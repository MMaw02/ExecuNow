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
    elapsedFocusSecondsAtSegmentStart: 0,
    remainingSeconds: DEFAULT_DURATION * 60,
    segmentStartedAtMs: null,
    segmentEndsAtMs: null,
    isPaused: false,
    pausedAtMs: null,
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
        elapsedFocusSecondsAtSegmentStart: 0,
        remainingSeconds: draft.duration * 60,
        segmentStartedAtMs: null,
        segmentEndsAtMs: null,
        isPaused: false,
        pausedAtMs: null,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
      };
    }
    case "sessionStartedFromWidget": {
      const draft = normalizeSessionTaskDraft(action.value);
      const sessionPomodoroSettings = normalizePomodoroSettings(action.settings);
      const timeline = getPomodoroSessionTimeline(draft.duration, sessionPomodoroSettings);
      const firstSegment = timeline.segments[0];
      const startedAtMs = normalizeNowMs(action.startedAtMs);

      return {
        ...state,
        view: "active",
        taskTitle: draft.title,
        selectedDuration: draft.duration,
        sessionTask: draft.title,
        sessionDuration: draft.duration,
        sessionPomodoroSettings,
        sessionPhase: firstSegment?.phase ?? "focus",
        sessionSegmentIndex: 0,
        elapsedFocusSeconds: 0,
        elapsedFocusSecondsAtSegmentStart: 0,
        remainingSeconds: firstSegment?.durationSeconds ?? draft.duration * 60,
        segmentStartedAtMs: firstSegment ? startedAtMs : null,
        segmentEndsAtMs: firstSegment
          ? startedAtMs + firstSegment.durationSeconds * 1000
          : null,
        isPaused: false,
        pausedAtMs: null,
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
      const firstSegment = timeline.segments[0];
      const startedAtMs = normalizeNowMs(action.startedAtMs);

      return {
        ...state,
        view: "active",
        sessionTask: state.taskTitle.trim(),
        sessionDuration: state.selectedDuration,
        sessionPomodoroSettings,
        sessionPhase: firstSegment?.phase ?? "focus",
        sessionSegmentIndex: 0,
        elapsedFocusSeconds: 0,
        elapsedFocusSecondsAtSegmentStart: 0,
        remainingSeconds: firstSegment?.durationSeconds ?? state.selectedDuration * 60,
        segmentStartedAtMs: firstSegment ? startedAtMs : null,
        segmentEndsAtMs: firstSegment
          ? startedAtMs + firstSegment.durationSeconds * 1000
          : null,
        isPaused: false,
        pausedAtMs: null,
        pauseUsed: false,
        sessionResult: null,
        failureReason: "",
      };
    }
    case "pauseToggled":
      if (state.view !== "active") {
        return state;
      }

      const nowMs = normalizeNowMs(action.nowMs);
      if (state.isPaused) {
        return resumePausedSession(state, nowMs);
      }

      const syncedState = advanceActiveSession(state, nowMs);

      if (syncedState.view !== "active") {
        return syncedState;
      }

      if (syncedState.pauseUsed) {
        return syncedState;
      }

      return {
        ...syncedState,
        isPaused: true,
        pausedAtMs: nowMs,
        pauseUsed: true,
      };
    case "sessionClosed":
      return {
        ...state,
        view: "outcome",
        sessionResult: action.value,
        segmentStartedAtMs: null,
        segmentEndsAtMs: null,
        isPaused: false,
        pausedAtMs: null,
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
        elapsedFocusSecondsAtSegmentStart: 0,
        remainingSeconds: state.selectedDuration * 60,
        segmentStartedAtMs: null,
        segmentEndsAtMs: null,
        isPaused: false,
        pausedAtMs: null,
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

      return advanceActiveSession(state, normalizeNowMs(action.nowMs));
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

function advanceActiveSession(state: SessionState, nowMs: number): SessionState {
  const timeline = getPomodoroSessionTimeline(
    state.sessionDuration,
    state.sessionPomodoroSettings,
  );
  let segmentIndex = state.sessionSegmentIndex;
  let currentSegment = timeline.segments[segmentIndex];

  if (!currentSegment) {
    return completeSession(state, state.elapsedFocusSeconds);
  }

  let {
    elapsedFocusSecondsAtSegmentStart,
    segmentEndsAtMs,
    segmentStartedAtMs,
  } = resolveSegmentTiming(state, currentSegment, nowMs);

  while (nowMs >= segmentEndsAtMs) {
    const elapsedFocusSecondsAtSegmentEnd =
      currentSegment.phase === "focus"
        ? elapsedFocusSecondsAtSegmentStart + currentSegment.durationSeconds
        : elapsedFocusSecondsAtSegmentStart;
    const nextSegment = timeline.segments[segmentIndex + 1];

    if (!nextSegment) {
      return completeSession(state, elapsedFocusSecondsAtSegmentEnd);
    }

    segmentIndex += 1;
    currentSegment = nextSegment;
    elapsedFocusSecondsAtSegmentStart = elapsedFocusSecondsAtSegmentEnd;
    segmentStartedAtMs = segmentEndsAtMs;
    segmentEndsAtMs = segmentStartedAtMs + currentSegment.durationSeconds * 1000;
  }

  const elapsedInSegmentSeconds =
    currentSegment.phase === "focus"
      ? Math.min(
          currentSegment.durationSeconds,
          Math.max(Math.floor((nowMs - segmentStartedAtMs) / 1000), 0),
        )
      : 0;

  return {
    ...state,
    sessionPhase: currentSegment.phase,
    sessionSegmentIndex: segmentIndex,
    elapsedFocusSeconds:
      elapsedFocusSecondsAtSegmentStart + elapsedInSegmentSeconds,
    elapsedFocusSecondsAtSegmentStart,
    remainingSeconds: Math.max(Math.ceil((segmentEndsAtMs - nowMs) / 1000), 0),
    segmentStartedAtMs,
    segmentEndsAtMs,
    pausedAtMs: null,
  };
}

function completeSession(
  state: SessionState,
  elapsedFocusSeconds: number,
): SessionState {
  return {
    ...state,
    elapsedFocusSeconds,
    elapsedFocusSecondsAtSegmentStart: elapsedFocusSeconds,
    remainingSeconds: 0,
    segmentStartedAtMs: null,
    segmentEndsAtMs: null,
    isPaused: false,
    pausedAtMs: null,
    view: "outcome",
    sessionResult: "completed",
  };
}

function resolveSegmentTiming(
  state: SessionState,
  currentSegment: {
    durationSeconds: number;
    phase: SessionState["sessionPhase"];
  },
  nowMs: number,
) {
  if (state.segmentStartedAtMs !== null && state.segmentEndsAtMs !== null) {
    return {
      segmentStartedAtMs: state.segmentStartedAtMs,
      segmentEndsAtMs: state.segmentEndsAtMs,
      elapsedFocusSecondsAtSegmentStart: state.elapsedFocusSecondsAtSegmentStart,
    };
  }

  const elapsedWithinSegmentSeconds = Math.max(
    currentSegment.durationSeconds - state.remainingSeconds,
    0,
  );

  return {
    segmentStartedAtMs: nowMs - elapsedWithinSegmentSeconds * 1000,
    segmentEndsAtMs: nowMs + state.remainingSeconds * 1000,
    elapsedFocusSecondsAtSegmentStart:
      currentSegment.phase === "focus"
        ? Math.max(state.elapsedFocusSeconds - elapsedWithinSegmentSeconds, 0)
        : state.elapsedFocusSeconds,
  };
}

function resumePausedSession(state: SessionState, nowMs: number): SessionState {
  if (
    state.segmentStartedAtMs === null ||
    state.segmentEndsAtMs === null ||
    state.pausedAtMs === null
  ) {
    return {
      ...state,
      isPaused: false,
      pausedAtMs: null,
    };
  }

  const pausedDurationMs = Math.max(nowMs - state.pausedAtMs, 0);

  return {
    ...state,
    isPaused: false,
    pausedAtMs: null,
    segmentStartedAtMs: state.segmentStartedAtMs + pausedDurationMs,
    segmentEndsAtMs: state.segmentEndsAtMs + pausedDurationMs,
  };
}

function normalizeNowMs(value: number | undefined) {
  return Number.isFinite(value) ? Math.trunc(value as number) : Date.now();
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
