export type PomodoroSettings = {
  focusMinutes: number;
  breakMinutes: number;
};

export type PomodoroBreakdown = {
  pomodoroCount: number;
  breakCount: number;
  breakMinutesTotal: number;
  totalMinutesWithBreaks: number;
};

export type PomodoroFillSegments = {
  defaultRatio: number;
  completedRatio: number;
  remainingRatio: number;
};

export type PomodoroSessionPhase = "focus" | "break";

export type PomodoroSessionSegment = {
  phase: PomodoroSessionPhase;
  pomodoroIndex: number;
  durationSeconds: number;
  focusSeconds: number;
};

export type PomodoroSessionTimeline = {
  breakdown: PomodoroBreakdown;
  segments: PomodoroSessionSegment[];
  totalFocusSeconds: number;
  totalTimelineSeconds: number;
};
