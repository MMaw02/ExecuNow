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
    <section className="page active-page">
      <div className="session-stage">
        <span className="eyebrow">
          {isPaused
            ? "Paused"
            : strictBlocking
              ? "Strict focus live"
              : "Focus block live"}
        </span>
        <h1 className="timer-display">{formatClock(remainingSeconds)}</h1>
        <p className="session-task session-task-large">{sessionTask}</p>
        <p className="support center">
          {pauseUsed
            ? isPaused
              ? "Resume when ready. This session has used its only pause."
              : "Pause already used for this session."
            : "One short pause is available if execution stalls."}
        </p>

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
            {isPaused ? "Resume" : pauseUsed ? "Pause used" : "Pause once"}
          </button>
          <button
            type="button"
            className="ghost-button warning"
            onClick={() => onCloseSession("abandoned")}
          >
            Abandon
          </button>
        </div>

        <div className="rule-note">
          <span className="summary-label">Rule</span>
          <strong>Stay here until the block is closed.</strong>
        </div>
      </div>
    </section>
  );
}
