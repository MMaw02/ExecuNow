import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_POMODORO_SETTINGS,
  getPomodoroBreakdown,
  getPomodoroFillSegments,
  getPomodoroFillRatio,
  getPomodoroSessionTimeline,
  normalizePomodoroSettings,
} from "../features/pomodoro/pomodoro.model.ts";
import {
  POMODORO_SETTINGS_STORAGE_KEY,
  readPomodoroSettings,
  writePomodoroSettings,
} from "../features/pomodoro/pomodoro.storage.ts";

test("pomodoro breakdown handles two focus blocks and one break", () => {
  assert.deepEqual(getPomodoroBreakdown(50, DEFAULT_POMODORO_SETTINGS), {
    pomodoroCount: 2,
    breakCount: 1,
    breakMinutesTotal: 5,
    totalMinutesWithBreaks: 55,
  });
});

test("pomodoro breakdown handles three focus blocks and two breaks", () => {
  assert.deepEqual(getPomodoroBreakdown(75, DEFAULT_POMODORO_SETTINGS), {
    pomodoroCount: 3,
    breakCount: 2,
    breakMinutesTotal: 10,
    totalMinutesWithBreaks: 85,
  });
});

test("pomodoro breakdown supports compressed indicator counts", () => {
  const breakdown = getPomodoroBreakdown(80, DEFAULT_POMODORO_SETTINGS);

  assert.equal(breakdown.pomodoroCount, 4);
  assert.equal(breakdown.breakCount, 3);
  assert.equal(breakdown.totalMinutesWithBreaks, 95);
});

test("pomodoro breakdown uses at least one focus block", () => {
  const breakdown = getPomodoroBreakdown(10, DEFAULT_POMODORO_SETTINGS);

  assert.equal(breakdown.pomodoroCount, 1);
  assert.equal(breakdown.breakCount, 0);
  assert.equal(breakdown.totalMinutesWithBreaks, 10);
});

test("pomodoro fill ratio renders the remaining task time inside a partial block", () => {
  assert.equal(
    getPomodoroFillRatio(10, { focusMinutes: 30, breakMinutes: 5 }, 0),
    1 / 3,
  );
});

test("pomodoro fill ratio keeps full blocks filled and the last block partial", () => {
  const settings = { focusMinutes: 25, breakMinutes: 5 };

  assert.equal(getPomodoroFillRatio(60, settings, 0), 1);
  assert.equal(getPomodoroFillRatio(60, settings, 1), 1);
  assert.equal(getPomodoroFillRatio(60, settings, 2), 10 / 25);
});

test("pomodoro fill segments split default, completed, and remaining time", () => {
  assert.deepEqual(
    getPomodoroFillSegments(
      20,
      10,
      {
        focusMinutes: 30,
        breakMinutes: 5,
      },
      0,
    ),
    {
      defaultRatio: 1 / 3,
      completedRatio: 1 / 3,
      remainingRatio: 1 / 3,
    },
  );
});

test("pomodoro fill segments handle progress across multiple focus blocks", () => {
  const settings = { focusMinutes: 25, breakMinutes: 5 };

  assert.deepEqual(getPomodoroFillSegments(60, 40, settings, 0), {
    defaultRatio: 0,
    completedRatio: 1,
    remainingRatio: 0,
  });
  assert.deepEqual(getPomodoroFillSegments(60, 40, settings, 1), {
    defaultRatio: 0,
    completedRatio: 15 / 25,
    remainingRatio: 10 / 25,
  });
  assert.deepEqual(getPomodoroFillSegments(60, 40, settings, 2), {
    defaultRatio: 15 / 25,
    completedRatio: 0,
    remainingRatio: 10 / 25,
  });
});

test("zero-minute breaks do not increase the estimated total", () => {
  const breakdown = getPomodoroBreakdown(50, {
    focusMinutes: 25,
    breakMinutes: 0,
  });

  assert.equal(breakdown.pomodoroCount, 2);
  assert.equal(breakdown.breakCount, 1);
  assert.equal(breakdown.breakMinutesTotal, 0);
  assert.equal(breakdown.totalMinutesWithBreaks, 50);
});

test("pomodoro session timeline alternates focus and break segments", () => {
  const timeline = getPomodoroSessionTimeline(60, DEFAULT_POMODORO_SETTINGS);

  assert.deepEqual(
    timeline.segments.map((segment) => ({
      phase: segment.phase,
      pomodoroIndex: segment.pomodoroIndex,
      durationSeconds: segment.durationSeconds,
    })),
    [
      { phase: "focus", pomodoroIndex: 0, durationSeconds: 25 * 60 },
      { phase: "break", pomodoroIndex: 0, durationSeconds: 5 * 60 },
      { phase: "focus", pomodoroIndex: 1, durationSeconds: 25 * 60 },
      { phase: "break", pomodoroIndex: 1, durationSeconds: 5 * 60 },
      { phase: "focus", pomodoroIndex: 2, durationSeconds: 10 * 60 },
    ],
  );
  assert.equal(timeline.totalFocusSeconds, 60 * 60);
  assert.equal(timeline.totalTimelineSeconds, 70 * 60);
});

test("pomodoro session timeline omits break segments when break minutes are zero", () => {
  const timeline = getPomodoroSessionTimeline(50, {
    focusMinutes: 25,
    breakMinutes: 0,
  });

  assert.deepEqual(
    timeline.segments.map((segment) => segment.phase),
    ["focus", "focus"],
  );
  assert.equal(timeline.totalTimelineSeconds, 50 * 60);
});

test("pomodoro settings normalize missing or invalid values to defaults", () => {
  assert.deepEqual(
    normalizePomodoroSettings({
      focusMinutes: 3,
      breakMinutes: -1,
    }),
    DEFAULT_POMODORO_SETTINGS,
  );
  assert.deepEqual(normalizePomodoroSettings(null), DEFAULT_POMODORO_SETTINGS);
});

test("pomodoro settings storage falls back to defaults", () => {
  const storage = new MemoryStorage();

  assert.deepEqual(readPomodoroSettings(storage), DEFAULT_POMODORO_SETTINGS);

  storage.setItem(POMODORO_SETTINGS_STORAGE_KEY, JSON.stringify({ focusMinutes: 1 }));

  assert.deepEqual(readPomodoroSettings(storage), DEFAULT_POMODORO_SETTINGS);
});

test("pomodoro settings storage persists normalized values", () => {
  const storage = new MemoryStorage();

  writePomodoroSettings({ focusMinutes: 45, breakMinutes: 10 }, storage);

  assert.deepEqual(readPomodoroSettings(storage), {
    focusMinutes: 45,
    breakMinutes: 10,
  });
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
