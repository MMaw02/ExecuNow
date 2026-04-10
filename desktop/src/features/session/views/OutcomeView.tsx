import { FAILURE_REASONS } from "../session.constants.ts";
import type {
  SessionOutcome,
  SessionResult,
  SessionStats,
} from "../session.types.ts";

type OutcomeViewProps = {
  sessionTask: string;
  sessionResult: SessionResult;
  failureReason: string;
  stats: SessionStats;
  onSessionResultSelect: (value: SessionOutcome) => void;
  onFailureReasonSelect: (value: string) => void;
  onSaveOutcome: () => void;
};

export function OutcomeView({
  sessionTask,
  sessionResult,
  failureReason,
  stats,
  onSessionResultSelect,
  onFailureReasonSelect,
  onSaveOutcome,
}: OutcomeViewProps) {
  return (
    <section className="screen content-grid">
      <div className="primary-panel">
        <div className="cluster">
          <span className="field-label">Session ready to log</span>
          <p className="session-task outcome-task">{sessionTask || "Last session"}</p>
        </div>

        <div className="result-grid" role="radiogroup" aria-label="Session result">
          {(["completed", "incomplete", "abandoned"] as const).map((result) => (
            <button
              key={result}
              type="button"
              className={sessionResult === result ? "result-button active" : "result-button"}
              onClick={() => onSessionResultSelect(result)}
            >
              {result}
            </button>
          ))}
        </div>

        {sessionResult && sessionResult !== "completed" && (
          <div className="cluster">
            <span className="field-label">Why did execution break?</span>
            <div className="suggestion-list">
              {FAILURE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={
                    failureReason === reason
                      ? "suggestion-button active"
                      : "suggestion-button"
                  }
                  onClick={() => onFailureReasonSelect(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={onSaveOutcome}
          disabled={
            !sessionResult ||
            (sessionResult !== "completed" && failureReason.length === 0)
          }
        >
          Save outcome
        </button>
      </div>

      <aside className="secondary-panel">
        <p className="eyebrow">Today summary</p>
        <div className="summary-block">
          <span className="summary-label">Completed</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="summary-block">
          <span className="summary-label">Incomplete</span>
          <strong>{stats.incomplete}</strong>
        </div>
        <div className="summary-block">
          <span className="summary-label">Abandoned</span>
          <strong>{stats.abandoned}</strong>
        </div>
        <div className="summary-block">
          <span className="summary-label">Focus captured</span>
          <strong>{stats.focusMinutes} minutes</strong>
          <p>Keep the summary short. The main job here is to finish the loop.</p>
        </div>
      </aside>
    </section>
  );
}
