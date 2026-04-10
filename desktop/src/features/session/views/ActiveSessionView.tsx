import { formatClock } from "../../../shared/utils/formatClock.ts";
import type { SessionOutcome } from "../session.types.ts";

type ActiveSessionViewProps = {
  remainingSeconds: number;
  sessionTask: string;
  isPaused: boolean;
  pauseUsed: boolean;
  strictBlocking: boolean;
  onTogglePause: () => void;
  onCloseSession: (result: SessionOutcome) => void;
};

export function ActiveSessionView({
  remainingSeconds,
  sessionTask,
  isPaused,
  pauseUsed,
  strictBlocking,
  onTogglePause,
  onCloseSession,
}: ActiveSessionViewProps) {
  return (
    <section className="screen active-screen">
      <div className="timer-shell">
        <span className="timer-state">
          {isPaused
            ? "Paused"
            : strictBlocking
              ? "Blocking active"
              : "Blocking relaxed"}
        </span>
        <h3 className="timer-display">{formatClock(remainingSeconds)}</h3>
        <p className="session-task">{sessionTask}</p>
        <p className="support center">
          {pauseUsed
            ? isPaused
              ? "Resume when ready. This session has used its only pause."
              : "Pause already used for this session."
            : "One short pause is available if execution stalls."}
        </p>
      </div>

      <div className="active-controls">
        <button
          type="button"
          className="primary-button"
          onClick={() => onCloseSession("completed")}
        >
          Complete session
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onTogglePause}
          disabled={pauseUsed && !isPaused}
        >
          {isPaused ? "Resume session" : pauseUsed ? "Pause used" : "Pause once"}
        </button>
        <button
          type="button"
          className="ghost-button warning"
          onClick={() => onCloseSession("abandoned")}
        >
          Abandon
        </button>
      </div>

      <div className="active-note">
        <span className="summary-label">Focus rule</span>
        <strong>Navigation and settings stay quiet until this block closes.</strong>
      </div>
    </section>
  );
}
