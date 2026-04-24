import type { PomodoroSessionPhase } from "../pomodoro/pomodoro.types.ts";
import type { View } from "./session.types.ts";

export type SessionWidgetSnapshot = {
  view: View;
  sessionTask: string;
  sessionDuration: number;
  remainingSeconds: number;
  sessionPhase: PomodoroSessionPhase;
  isPaused: boolean;
  pauseUsed: boolean;
  strictBlocking: boolean;
};

export type SessionWidgetControl = "toggle-pause" | "return-to-main";

export type SessionWidgetStateUpdatedPayload = {
  source: string;
  snapshot: SessionWidgetSnapshot;
};

export type SessionWidgetControlPayload = {
  source: string;
  control: SessionWidgetControl;
};
