import assert from "node:assert/strict";
import test from "node:test";
import {
  canNavigateTo,
  createInitialSessionState,
  sessionReducer,
} from "../features/session/session.model.ts";
import type { SessionState } from "../features/session/session.types.ts";

test("session does not start without a task", () => {
  const state = createInitialSessionState();
  const next = sessionReducer(state, { type: "sessionStarted" });

  assert.deepEqual(next, state);
});

test("session starts from valid today state", () => {
  const initialState = createInitialSessionState();
  const preparedState = sessionReducer(initialState, {
    type: "taskTitleChanged",
    value: "Draft walkthrough",
  });

  const next = sessionReducer(preparedState, { type: "sessionStarted" });

  assert.equal(next.view, "active");
  assert.equal(next.sessionTask, "Draft walkthrough");
  assert.equal(next.remainingSeconds, next.selectedDuration * 60);
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
  const next = sessionReducer(customDurationState, { type: "sessionStarted" });

  assert.equal(next.selectedDuration, 35);
  assert.equal(next.sessionDuration, 35);
  assert.equal(next.remainingSeconds, 35 * 60);
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
  });

  const next = sessionReducer(activeState, { type: "tick" });

  assert.equal(next.remainingSeconds, 0);
  assert.equal(next.view, "outcome");
  assert.equal(next.sessionResult, "completed");
});

test("saving outcome updates stats and returns to today", () => {
  const activeState = createActiveState({
    remainingSeconds: 600,
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
  const activeState = sessionReducer(preparedState, { type: "sessionStarted" });

  return {
    ...activeState,
    ...overrides,
  };
}
