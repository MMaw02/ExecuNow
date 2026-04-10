export type View = "home" | "active" | "outcome" | "blocking";
export type DurationOption = 15 | 25 | 50;
export type SessionOutcome = "completed" | "incomplete" | "abandoned";
export type SessionResult = SessionOutcome | null;

export type SessionStats = {
  completed: number;
  incomplete: number;
  abandoned: number;
  focusMinutes: number;
};

export type SessionState = {
  view: View;
  taskTitle: string;
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  sessionTask: string;
  sessionDuration: number;
  remainingSeconds: number;
  isPaused: boolean;
  pauseUsed: boolean;
  sessionResult: SessionResult;
  failureReason: string;
  stats: SessionStats;
};

export type SessionAction =
  | { type: "taskTitleChanged"; value: string }
  | { type: "durationSelected"; value: DurationOption }
  | { type: "strictBlockingToggled" }
  | { type: "navigated"; value: View }
  | { type: "sessionStarted" }
  | { type: "pauseToggled" }
  | { type: "sessionClosed"; value: SessionOutcome }
  | { type: "sessionResultSelected"; value: SessionOutcome }
  | { type: "failureReasonSelected"; value: string }
  | { type: "sessionSaved" }
  | { type: "tick" };

export type NavigationItem = {
  id: View;
  label: string;
  support: string;
};

export type ViewCopy = {
  eyebrow: string;
  title: string;
  lead: string;
};
