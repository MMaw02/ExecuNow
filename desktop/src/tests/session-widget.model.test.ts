import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POMODORO_SETTINGS } from "../features/pomodoro/pomodoro.model.ts";
import { createInitialSessionState, sessionReducer } from "../features/session/session.model.ts";
import {
  createSessionWidgetSnapshot,
  normalizeSessionWidgetControl,
  normalizeSessionWidgetSnapshot,
} from "../features/session/session-widget.model.ts";
import {
  SESSION_WIDGET_SNAPSHOT_STORAGE_KEY,
  readSessionWidgetSnapshot,
  writeSessionWidgetSnapshot,
} from "../features/session/session-widget.storage.ts";

test("session widget snapshot mirrors active session state", () => {
  const initialState = createInitialSessionState();
  const preparedState = sessionReducer(initialState, {
    type: "taskTitleChanged",
    value: "Ship session widget",
  });
  const activeState = sessionReducer(preparedState, {
    type: "sessionStarted",
    settings: DEFAULT_POMODORO_SETTINGS,
  });
  const pausedState = sessionReducer(activeState, { type: "pauseToggled" });

  const snapshot = createSessionWidgetSnapshot(pausedState);

  assert.equal(snapshot.view, "active");
  assert.equal(snapshot.sessionTask, "Ship session widget");
  assert.equal(snapshot.remainingSeconds, pausedState.remainingSeconds);
  assert.equal(snapshot.isPaused, true);
  assert.equal(snapshot.pauseUsed, true);
  assert.equal(snapshot.strictBlocking, true);
});

test("session widget snapshot normalizes invalid persisted data", () => {
  const normalized = normalizeSessionWidgetSnapshot({
    view: "unknown",
    sessionTask: "  Review countdown  ",
    sessionDuration: -10,
    remainingSeconds: Number.NaN,
    isPaused: "yes" as never,
    pauseUsed: true,
    strictBlocking: "strict" as never,
  });

  assert.equal(normalized.view, "today");
  assert.equal(normalized.sessionTask, "Review countdown");
  assert.equal(normalized.sessionDuration, 0);
  assert.equal(normalized.remainingSeconds, 0);
  assert.equal(normalized.isPaused, false);
  assert.equal(normalized.pauseUsed, true);
  assert.equal(normalized.strictBlocking, true);
});

test("session widget storage persists normalized snapshots", () => {
  const storage = new MemoryStorage();

  writeSessionWidgetSnapshot(
    {
      view: "active",
      sessionTask: "Deep work",
      sessionDuration: 25,
      remainingSeconds: 1200,
      sessionPhase: "focus",
      isPaused: false,
      pauseUsed: false,
      strictBlocking: true,
    },
    storage,
  );

  assert.deepEqual(readSessionWidgetSnapshot(storage), {
    view: "active",
    sessionTask: "Deep work",
    sessionDuration: 25,
    remainingSeconds: 1200,
    sessionPhase: "focus",
    isPaused: false,
    pauseUsed: false,
    strictBlocking: true,
  });

  storage.setItem(
    SESSION_WIDGET_SNAPSHOT_STORAGE_KEY,
    JSON.stringify({ view: "broken", remainingSeconds: -5 }),
  );

  assert.deepEqual(readSessionWidgetSnapshot(storage), {
    view: "today",
    sessionTask: "",
    sessionDuration: 0,
    remainingSeconds: 0,
    sessionPhase: "focus",
    isPaused: false,
    pauseUsed: false,
    strictBlocking: true,
  });
});

test("session widget controls accept only supported actions", () => {
  assert.equal(normalizeSessionWidgetControl("toggle-pause"), "toggle-pause");
  assert.equal(normalizeSessionWidgetControl("return-to-main"), "return-to-main");
  assert.equal(normalizeSessionWidgetControl("close-session"), null);
});

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }

  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.entries.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.entries.delete(key);
  }

  setItem(key: string, value: string) {
    this.entries.set(key, value);
  }
}
