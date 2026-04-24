import type {
  PomodoroBreakdown,
  PomodoroFillSegments,
  PomodoroSessionTimeline,
  PomodoroSettings,
} from "./pomodoro.types.ts";

export const MIN_POMODORO_FOCUS_MINUTES = 5;
export const MIN_POMODORO_BREAK_MINUTES = 0;

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
};

export function normalizePomodoroSettings(
  settings: Partial<PomodoroSettings> | null | undefined,
): PomodoroSettings {
  return {
    focusMinutes: normalizeMinutes(
      settings?.focusMinutes,
      DEFAULT_POMODORO_SETTINGS.focusMinutes,
      MIN_POMODORO_FOCUS_MINUTES,
    ),
    breakMinutes: normalizeMinutes(
      settings?.breakMinutes,
      DEFAULT_POMODORO_SETTINGS.breakMinutes,
      MIN_POMODORO_BREAK_MINUTES,
    ),
  };
}

export function getPomodoroBreakdown(
  taskMinutes: number,
  settings: PomodoroSettings,
): PomodoroBreakdown {
  const normalizedSettings = normalizePomodoroSettings(settings);
  const normalizedTaskMinutes = Math.max(Math.trunc(taskMinutes), 1);
  const pomodoroCount = Math.max(
    1,
    Math.ceil(normalizedTaskMinutes / normalizedSettings.focusMinutes),
  );
  const breakCount = Math.max(0, pomodoroCount - 1);
  const breakMinutesTotal = breakCount * normalizedSettings.breakMinutes;

  return {
    pomodoroCount,
    breakCount,
    breakMinutesTotal,
    totalMinutesWithBreaks: normalizedTaskMinutes + breakMinutesTotal,
  };
}

export function getPomodoroSessionTimeline(
  taskMinutes: number,
  settings: PomodoroSettings,
): PomodoroSessionTimeline {
  const normalizedSettings = normalizePomodoroSettings(settings);
  const normalizedTaskMinutes = Math.max(Math.trunc(taskMinutes), 1);
  const breakdown = getPomodoroBreakdown(normalizedTaskMinutes, normalizedSettings);
  const segments = [];
  let remainingTaskMinutes = normalizedTaskMinutes;

  for (let pomodoroIndex = 0; pomodoroIndex < breakdown.pomodoroCount; pomodoroIndex += 1) {
    const focusMinutesInPomodoro = clamp(
      remainingTaskMinutes,
      0,
      normalizedSettings.focusMinutes,
    );
    const focusDurationSeconds = focusMinutesInPomodoro * 60;

    segments.push({
      phase: "focus" as const,
      pomodoroIndex,
      durationSeconds: focusDurationSeconds,
      focusSeconds: focusDurationSeconds,
    });

    remainingTaskMinutes -= focusMinutesInPomodoro;

    if (
      pomodoroIndex < breakdown.pomodoroCount - 1 &&
      normalizedSettings.breakMinutes > 0
    ) {
      segments.push({
        phase: "break" as const,
        pomodoroIndex,
        durationSeconds: normalizedSettings.breakMinutes * 60,
        focusSeconds: 0,
      });
    }
  }

  return {
    breakdown,
    segments,
    totalFocusSeconds: normalizedTaskMinutes * 60,
    totalTimelineSeconds: segments.reduce(
      (total, segment) => total + segment.durationSeconds,
      0,
    ),
  };
}

export function getPomodoroFillRatio(
  taskMinutes: number,
  settings: PomodoroSettings,
  pomodoroIndex: number,
) {
  const normalizedSettings = normalizePomodoroSettings(settings);
  const normalizedTaskMinutes = Math.max(Math.trunc(taskMinutes), 1);
  const normalizedIndex = Math.max(Math.trunc(pomodoroIndex), 0);
  const elapsedBeforePomodoro = normalizedIndex * normalizedSettings.focusMinutes;
  const minutesInPomodoro = clamp(
    normalizedTaskMinutes - elapsedBeforePomodoro,
    0,
    normalizedSettings.focusMinutes,
  );

  return minutesInPomodoro / normalizedSettings.focusMinutes;
}

export function getPomodoroFillSegments(
  taskMinutes: number,
  completedMinutes: number,
  settings: PomodoroSettings,
  pomodoroIndex: number,
): PomodoroFillSegments {
  const normalizedSettings = normalizePomodoroSettings(settings);
  const normalizedTaskMinutes = Math.max(Math.trunc(taskMinutes), 1);
  const normalizedCompletedMinutes = clamp(
    Number.isFinite(completedMinutes) ? completedMinutes : 0,
    0,
    normalizedTaskMinutes,
  );
  const normalizedIndex = Math.max(Math.trunc(pomodoroIndex), 0);
  const elapsedBeforePomodoro = normalizedIndex * normalizedSettings.focusMinutes;
  const plannedMinutesInPomodoro = clamp(
    normalizedTaskMinutes - elapsedBeforePomodoro,
    0,
    normalizedSettings.focusMinutes,
  );
  const completedMinutesInPomodoro = clamp(
    normalizedCompletedMinutes - elapsedBeforePomodoro,
    0,
    plannedMinutesInPomodoro,
  );
  const remainingMinutesInPomodoro =
    plannedMinutesInPomodoro - completedMinutesInPomodoro;
  const defaultMinutesInPomodoro =
    normalizedSettings.focusMinutes - plannedMinutesInPomodoro;

  return {
    defaultRatio: defaultMinutesInPomodoro / normalizedSettings.focusMinutes,
    completedRatio: completedMinutesInPomodoro / normalizedSettings.focusMinutes,
    remainingRatio: remainingMinutesInPomodoro / normalizedSettings.focusMinutes,
  };
}

function normalizeMinutes(value: unknown, defaultValue: number, minimumValue: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }

  const minutes = Math.trunc(value);

  return minutes >= minimumValue ? minutes : defaultValue;
}

function clamp(value: number, minimumValue: number, maximumValue: number) {
  return Math.min(Math.max(value, minimumValue), maximumValue);
}
