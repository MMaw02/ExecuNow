import type { SessionState, View } from "./session.types.ts";
import type {
  SessionWidgetControl,
  SessionWidgetSnapshot,
} from "./session-widget.types.ts";

const VALID_VIEWS: View[] = [
  "today",
  "tasks",
  "history",
  "summary",
  "blocking",
  "settings",
  "active",
  "outcome",
];

export function createInactiveSessionWidgetSnapshot(): SessionWidgetSnapshot {
  return {
    view: "today",
    sessionTask: "",
    sessionDuration: 0,
    remainingSeconds: 0,
    sessionPhase: "focus",
    isPaused: false,
    pauseUsed: false,
    strictBlocking: true,
  };
}

export function createSessionWidgetSnapshot(
  state: Pick<
    SessionState,
    | "view"
    | "sessionTask"
    | "sessionDuration"
    | "remainingSeconds"
    | "sessionPhase"
    | "isPaused"
    | "pauseUsed"
    | "strictBlocking"
  >,
): SessionWidgetSnapshot {
  return normalizeSessionWidgetSnapshot({
    view: state.view,
    sessionTask: state.sessionTask,
    sessionDuration: state.sessionDuration,
    remainingSeconds: state.remainingSeconds,
    sessionPhase: state.sessionPhase,
    isPaused: state.isPaused,
    pauseUsed: state.pauseUsed,
    strictBlocking: state.strictBlocking,
  });
}

export function normalizeSessionWidgetSnapshot(
  value: Partial<SessionWidgetSnapshot> | null | undefined,
): SessionWidgetSnapshot {
  const fallback = createInactiveSessionWidgetSnapshot();

  return {
    view: normalizeView(value?.view),
    sessionTask: typeof value?.sessionTask === "string" ? value.sessionTask.trim() : "",
    sessionDuration: normalizeNumber(value?.sessionDuration, fallback.sessionDuration),
    remainingSeconds: normalizeNumber(value?.remainingSeconds, fallback.remainingSeconds),
    sessionPhase: value?.sessionPhase === "break" ? "break" : fallback.sessionPhase,
    isPaused: typeof value?.isPaused === "boolean" ? value.isPaused : fallback.isPaused,
    pauseUsed: typeof value?.pauseUsed === "boolean" ? value.pauseUsed : fallback.pauseUsed,
    strictBlocking:
      typeof value?.strictBlocking === "boolean"
        ? value.strictBlocking
        : fallback.strictBlocking,
  };
}

export function normalizeSessionWidgetControl(
  value: unknown,
): SessionWidgetControl | null {
  return value === "toggle-pause" || value === "return-to-main" ? value : null;
}

export function isSessionWidgetActive(
  snapshot: Pick<SessionWidgetSnapshot, "view">,
) {
  return snapshot.view === "active";
}

function normalizeView(value: unknown): View {
  return typeof value === "string" && VALID_VIEWS.includes(value as View)
    ? (value as View)
    : "today";
}

function normalizeNumber(value: unknown, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(Math.trunc(value as number), 0);
}
