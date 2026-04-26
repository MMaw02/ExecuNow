import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionWidgetViewModel } from "../features/session/useSessionWidgetController.ts";

test("session widget view model derives active focus labels and pause guard", () => {
  const viewModel = buildSessionWidgetViewModel(
    {
      view: "active",
      sessionTask: "Close release checklist",
      sessionDuration: 25,
      remainingSeconds: 1180,
      sessionPhase: "focus",
      isPaused: false,
      pauseUsed: true,
      strictBlocking: true,
    },
  );

  assert.equal(viewModel.title, "Close release checklist");
  assert.equal(viewModel.statusLabel, "Strict focus live");
  assert.equal(viewModel.focusStateLabel, "FOCUS");
  assert.equal(viewModel.pauseDisabled, true);
});

test("session widget view model derives paused and inactive states", () => {
  const pausedViewModel = buildSessionWidgetViewModel(
    {
      view: "active",
      sessionTask: "Review notes",
      sessionDuration: 15,
      remainingSeconds: 300,
      sessionPhase: "break",
      isPaused: true,
      pauseUsed: true,
      strictBlocking: false,
    },
  );
  const inactiveViewModel = buildSessionWidgetViewModel(
    {
      view: "today",
      sessionTask: "",
      sessionDuration: 0,
      remainingSeconds: 0,
      sessionPhase: "focus",
      isPaused: false,
      pauseUsed: false,
      strictBlocking: true,
    },
  );

  assert.equal(pausedViewModel.focusStateLabel, "PAUSE");
  assert.equal(pausedViewModel.statusLabel, "Paused");
  assert.equal(pausedViewModel.pauseDisabled, false);
  assert.equal(inactiveViewModel.title, "Session unavailable");
  assert.equal(inactiveViewModel.statusLabel, "Return to the main session view to continue.");
});
