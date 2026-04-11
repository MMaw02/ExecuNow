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
    <section className="page outcome-page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">Outcome</p>
        <h1 className="page-title">Close the loop.</h1>
        <p className="page-copy">{sessionTask || "Last session"}</p>
      </header>

      <div className="outcome-stack">
        <div className="result-grid" role="radiogroup" aria-label="Session result">
          {(["completed", "incomplete", "abandoned"] as const).map((result) => (
            <button
              key={result}
              type="button"
              className={sessionResult === result ? "result-button active" : "result-button"}
              onClick={() => onSessionResultSelect(result)}
            >
              {formatOutcomeLabel(result)}
            </button>
          ))}
        </div>

        {sessionResult && sessionResult !== "completed" && (
          <div className="stack">
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

      <div className="metric-grid">
        <div className="metric-cell">
          <span className="summary-label">Completed</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="metric-cell">
          <span className="summary-label">Incomplete</span>
          <strong>{stats.incomplete}</strong>
        </div>
        <div className="metric-cell">
          <span className="summary-label">Abandoned</span>
          <strong>{stats.abandoned}</strong>
        </div>
        <div className="metric-cell">
          <span className="summary-label">Focus</span>
          <strong>{stats.focusMinutes} min</strong>
        </div>
      </div>
    </section>
  );
}

function formatOutcomeLabel(result: SessionOutcome) {
  return `${result.charAt(0).toUpperCase()}${result.slice(1)}`;
}
