import type {
  PomodoroSessionPhase,
  PomodoroSettings,
} from "../pomodoro/pomodoro.types.ts";

export type NavView = "today" | "tasks" | "history" | "summary" | "blocking" | "settings";
export type View = NavView | "active" | "outcome";
export type DurationOption = number;
export type SessionOutcome = "completed" | "incomplete" | "abandoned";
export type SessionResult = SessionOutcome | null;

export type SessionStats = {
  completed: number;
  incomplete: number;
  abandoned: number;
  focusMinutes: number;
};

export type SessionRecord = {
  id: string;
  task: string;
  duration: DurationOption;
  capturedMinutes: number;
  result: SessionOutcome;
  failureReason: string;
  strictBlocking: boolean;
  endedAt: string;
};

export type SessionTaskDraft = {
  title: string;
  duration: DurationOption;
};

export type SessionState = {
  view: View;
  taskTitle: string;
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  sessionTask: string;
  sessionDuration: DurationOption;
  sessionPomodoroSettings: PomodoroSettings;
  sessionPhase: PomodoroSessionPhase;
  sessionSegmentIndex: number;
  elapsedFocusSeconds: number;
  elapsedFocusSecondsAtSegmentStart: number;
  remainingSeconds: number;
  segmentStartedAtMs: number | null;
  segmentEndsAtMs: number | null;
  isPaused: boolean;
  pausedAtMs: number | null;
  pauseUsed: boolean;
  sessionResult: SessionResult;
  failureReason: string;
  stats: SessionStats;
  history: SessionRecord[];
};

export type SessionAction =
  | { type: "taskTitleChanged"; value: string }
  | { type: "durationSelected"; value: DurationOption }
  | { type: "taskPreparedFromWidget"; value: SessionTaskDraft }
  | {
      type: "sessionStartedFromWidget";
      value: SessionTaskDraft;
      settings: PomodoroSettings;
      startedAtMs?: number;
    }
  | { type: "strictBlockingToggled" }
  | { type: "navigated"; value: View }
  | { type: "sessionStarted"; settings: PomodoroSettings; startedAtMs?: number }
  | { type: "pauseToggled"; nowMs?: number }
  | { type: "sessionClosed"; value: SessionOutcome }
  | { type: "sessionResultSelected"; value: SessionOutcome }
  | { type: "failureReasonSelected"; value: string }
  | { type: "sessionSaved" }
  | { type: "tick"; nowMs?: number };

export type NavigationItem = {
  id: NavView;
  label: string;
};
