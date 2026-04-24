import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POMODORO_SETTINGS } from "../features/pomodoro/pomodoro.model.ts";
import {
  canNavigateTo,
  createInitialSessionState,
  sessionReducer,
} from "../features/session/session.model.ts";
import type { SessionState } from "../features/session/session.types.ts";

test("session does not start without a task", () => {
  const state = createInitialSessionState();
  const next = sessionReducer(state, {
    type: "sessionStarted",
    settings: DEFAULT_POMODORO_SETTINGS,
  });

  assert.deepEqual(next, state);
});

test("session starts from valid today state", () => {
  const initialState = createInitialSessionState();
  const preparedState = sessionReducer(initialState, {
    type: "taskTitleChanged",
    value: "Draft walkthrough",
  });

  const next = sessionReducer(preparedState, {
    type: "sessionStarted",
    settings: DEFAULT_POMODORO_SETTINGS,
  });

  assert.equal(next.view, "active");
  assert.equal(next.sessionTask, "Draft walkthrough");
  assert.equal(next.remainingSeconds, next.selectedDuration * 60);
  assert.equal(next.sessionPhase, "focus");
  assert.equal(next.elapsedFocusSeconds, 0);
  assert.equal(next.pauseUsed, false);
  assert.equal(next.sessionResult, null);
});

test("session supports a custom duration", () => {
  const initialState = createInitialSessionState();
  const preparedState = sessionReducer(initialState, {
    type: "taskTitleChanged",
    value: "Draft walkthrough",
  });
  const customDurationState = sessionReducer(preparedState, {
    type: "durationSelected",
    value: 35,
  });
  const next = sessionReducer(customDurationState, {
    type: "sessionStarted",
    settings: DEFAULT_POMODORO_SETTINGS,
  });

  assert.equal(next.selectedDuration, 35);
  assert.equal(next.sessionDuration, 35);
  assert.equal(next.remainingSeconds, 25 * 60);
});

test("widget handoff can prepare a task on today", () => {
  const initialState = createInitialSessionState();
  const next = sessionReducer(initialState, {
    type: "taskPreparedFromWidget",
    value: {
      title: "Outline onboarding checklist",
      duration: 30,
    },
  });

  assert.equal(next.view, "today");
  assert.equal(next.taskTitle, "Outline onboarding checklist");
  assert.equal(next.selectedDuration, 30);
  assert.equal(next.remainingSeconds, 30 * 60);
});

test("widget handoff can start a session immediately", () => {
  const initialState = createInitialSessionState();
  const next = sessionReducer(initialState, {
    type: "sessionStartedFromWidget",
    value: {
      title: "Review launch notes",
      duration: 20,
    },
    settings: DEFAULT_POMODORO_SETTINGS,
  });

  assert.equal(next.view, "active");
  assert.equal(next.taskTitle, "Review launch notes");
  assert.equal(next.sessionTask, "Review launch notes");
  assert.equal(next.sessionDuration, 20);
  assert.equal(next.remainingSeconds, 20 * 60);
});

test("pause can only be consumed once", () => {
  const activeState = createActiveState();
  const pausedState = sessionReducer(activeState, { type: "pauseToggled" });
  const resumedState = sessionReducer(pausedState, { type: "pauseToggled" });
  const afterSecondPauseAttempt = sessionReducer(resumedState, {
    type: "pauseToggled",
  });

  assert.equal(pausedState.isPaused, true);
  assert.equal(pausedState.pauseUsed, true);
  assert.equal(resumedState.isPaused, false);
  assert.equal(afterSecondPauseAttempt.isPaused, false);
  assert.equal(afterSecondPauseAttempt.pauseUsed, true);
});

test("closing a session moves the flow to outcome", () => {
  const activeState = createActiveState();
  const next = sessionReducer(activeState, {
    type: "sessionClosed",
    value: "incomplete",
  });

  assert.equal(next.view, "outcome");
  assert.equal(next.sessionResult, "incomplete");
  assert.equal(next.isPaused, false);
});

test("tick completes the session when the timer reaches zero", () => {
  const activeState = createActiveState({
    remainingSeconds: 1,
    elapsedFocusSeconds: 24 * 60 + 59,
  });

  const next = sessionReducer(activeState, { type: "tick" });

  assert.equal(next.remainingSeconds, 0);
  assert.equal(next.view, "outcome");
  assert.equal(next.sessionResult, "completed");
});

test("tick moves the session into a break after a completed focus block", () => {
  const initialState = createInitialSessionState();
  const preparedState = sessionReducer(initialState, {
    type: "taskTitleChanged",
    value: "Deep architecture pass",
  });
  const durationState = sessionReducer(preparedState, {
    type: "durationSelected",
    value: 50,
  });
  const activeState = sessionReducer(durationState, {
    type: "sessionStarted",
    settings: DEFAULT_POMODORO_SETTINGS,
  });
  const almostBreakState = {
    ...activeState,
    remainingSeconds: 1,
    elapsedFocusSeconds: 24 * 60 + 59,
  };

  const next = sessionReducer(almostBreakState, { type: "tick" });

  assert.equal(next.view, "active");
  assert.equal(next.sessionPhase, "break");
  assert.equal(next.sessionSegmentIndex, 1);
  assert.equal(next.remainingSeconds, 5 * 60);
  assert.equal(next.elapsedFocusSeconds, 25 * 60);
});

test("tick returns from break into the next focus block", () => {
  const breakState = createActiveState({
    sessionDuration: 50,
    sessionPhase: "break",
    sessionSegmentIndex: 1,
    remainingSeconds: 1,
    elapsedFocusSeconds: 25 * 60,
  });

  const next = sessionReducer(breakState, { type: "tick" });

  assert.equal(next.view, "active");
  assert.equal(next.sessionPhase, "focus");
  assert.equal(next.sessionSegmentIndex, 2);
  assert.equal(next.remainingSeconds, 25 * 60);
  assert.equal(next.elapsedFocusSeconds, 25 * 60);
});

test("saving outcome updates stats and returns to today", () => {
  const activeState = createActiveState({
    remainingSeconds: 600,
    elapsedFocusSeconds: 15 * 60,
  });
  const outcomeState = sessionReducer(activeState, {
    type: "sessionClosed",
    value: "incomplete",
  });
  const reasonCapturedState = sessionReducer(outcomeState, {
    type: "failureReasonSelected",
    value: "Needed information first",
  });

  const next = sessionReducer(reasonCapturedState, { type: "sessionSaved" });

  assert.equal(next.view, "today");
  assert.equal(next.stats.incomplete, 1);
  assert.equal(next.stats.focusMinutes, 15);
  assert.equal(next.sessionTask, "");
  assert.equal(next.failureReason, "");
  assert.equal(next.sessionResult, null);
  assert.equal(next.history.length, 1);
  assert.equal(next.history[0]?.result, "incomplete");
});

test("navigation locks during active and outcome views", () => {
  const activeState = createActiveState();
  const outcomeState = sessionReducer(activeState, {
    type: "sessionClosed",
    value: "abandoned",
  });

  assert.equal(canNavigateTo(activeState, "blocking"), false);
  assert.equal(canNavigateTo(activeState, "active"), true);
  assert.equal(canNavigateTo(outcomeState, "today"), false);
  assert.equal(canNavigateTo(outcomeState, "outcome"), true);
});

function createActiveState(overrides: Partial<SessionState> = {}) {
  const initialState = createInitialSessionState();
  const preparedState = sessionReducer(initialState, {
    type: "taskTitleChanged",
    value: "Draft walkthrough",
  });
  const normalizedActiveState = sessionReducer(preparedState, {
    type: "sessionStarted",
    settings: DEFAULT_POMODORO_SETTINGS,
  });

  return {
    ...normalizedActiveState,
    ...overrides,
  };
}
