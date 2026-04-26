import assert from "node:assert/strict";
import test from "node:test";
import {
  createBrowserWidgetRuntime,
  getDefaultSessionWidgetProfile,
  MAIN_WINDOW_KIND,
  STARTUP_WIDGET_WINDOW_KIND,
} from "../features/widget/widget.runtime.ts";

test("browser widget runtime keeps a stable no-op contract", async () => {
  const runtime = createBrowserWidgetRuntime({
    windowKind: STARTUP_WIDGET_WINDOW_KIND,
  });

  assert.equal(runtime.isNative, false);
  assert.equal(runtime.getCurrentWindowKind(), STARTUP_WIDGET_WINDOW_KIND);

  await runtime.showMainWindow();
  await runtime.showStartupWidgetWindow();
  await runtime.showSessionWidgetWindow();
  await runtime.hideSessionWidgetWindow();
  await runtime.getSessionWidgetProfile();
  await runtime.reinforceSessionWidgetZOrder(true);
  await runtime.startWindowDrag();
});

test("browser widget runtime uses the provided handoff store", () => {
  let pendingAction: {
    payload?: { duration: number; title: string };
    type: "open-tasks" | "start-task";
  } | null = null;
  const runtime = createBrowserWidgetRuntime({
    handoffStore: {
      consumePendingAction() {
        const nextAction = pendingAction;
        pendingAction = null;
        return nextAction;
      },
      setPendingAction(action) {
        pendingAction = action;
      },
    },
    windowKind: MAIN_WINDOW_KIND,
  });

  runtime.setPendingAction({ type: "open-tasks" });

  assert.deepEqual(runtime.consumePendingAction(), { type: "open-tasks" });
  assert.equal(runtime.consumePendingAction(), null);
});

test("browser widget runtime exposes the provided session widget profile", async () => {
  const runtime = createBrowserWidgetRuntime({
    sessionWidgetProfile: {
      focusPolicy: "focus-on-open",
      surfaceVariant: "stable-windows",
      transparentWindow: false,
    },
  });

  assert.deepEqual(await runtime.getSessionWidgetProfile(), {
    focusPolicy: "focus-on-open",
    surfaceVariant: "stable-windows",
    transparentWindow: false,
  });
  assert.ok(getDefaultSessionWidgetProfile());
});
