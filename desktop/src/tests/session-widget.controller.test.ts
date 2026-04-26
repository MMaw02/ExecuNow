import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionWidgetViewModel } from "../features/session/useSessionWidgetController.ts";
import {
  shouldForceFocusOnOpen,
  shouldReassertOnBlur,
} from "../features/session/useSessionWidgetWindowPolicy.ts";

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
    {
      focusPolicy: "focus-on-open",
      surfaceVariant: "stable-windows",
      transparentWindow: false,
    },
  );

  assert.equal(viewModel.title, "Close release checklist");
  assert.equal(viewModel.statusLabel, "Strict focus live");
  assert.equal(viewModel.focusStateLabel, "FOCUS");
  assert.equal(viewModel.pauseDisabled, true);
  assert.equal(viewModel.shellVariant, "stable-windows");
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
    {
      focusPolicy: "focus-on-open",
      surfaceVariant: "glass-default",
      transparentWindow: true,
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
    {
      focusPolicy: "passive",
      surfaceVariant: "glass-default",
      transparentWindow: true,
    },
  );

  assert.equal(pausedViewModel.focusStateLabel, "PAUSE");
  assert.equal(pausedViewModel.statusLabel, "Paused");
  assert.equal(pausedViewModel.pauseDisabled, false);
  assert.equal(inactiveViewModel.title, "Session unavailable");
  assert.equal(inactiveViewModel.statusLabel, "Return to the main session view to continue.");
});

test("session widget window policy is event-driven instead of aggressive polling", () => {
  assert.equal(shouldForceFocusOnOpen("focus-on-open"), true);
  assert.equal(shouldForceFocusOnOpen("passive"), false);
  assert.equal(shouldReassertOnBlur("focus-on-open"), true);
  assert.equal(shouldReassertOnBlur("aggressive"), true);
  assert.equal(shouldReassertOnBlur("passive"), false);
});
