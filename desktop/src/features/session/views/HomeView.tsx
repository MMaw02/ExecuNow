import { DURATIONS, SUGGESTED_TASKS } from "../session.constants.ts";
import type { DurationOption } from "../session.types.ts";

type HomeViewProps = {
  taskTitle: string;
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  sessionPrepared: boolean;
  onTaskTitleChange: (value: string) => void;
  onSuggestedTaskSelect: (value: string) => void;
  onDurationSelect: (value: DurationOption) => void;
  onStrictBlockingToggle: () => void;
  onStartSession: () => void;
};

export function HomeView({
  taskTitle,
  selectedDuration,
  strictBlocking,
  sessionPrepared,
  onTaskTitleChange,
  onSuggestedTaskSelect,
  onDurationSelect,
  onStrictBlockingToggle,
  onStartSession,
}: HomeViewProps) {
  return (
    <section className="screen content-grid">
      <div className="primary-panel">
        <label className="field">
          <span className="field-label">What needs to get done now?</span>
          <input
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.currentTarget.value)}
            placeholder="Finish the proposal draft"
          />
        </label>

        <div className="cluster">
          <span className="field-label">Suggested starts</span>
          <div className="suggestion-list">
            {SUGGESTED_TASKS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-button"
                onClick={() => onSuggestedTaskSelect(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="cluster">
          <span className="field-label">Focus duration</span>
          <div className="segment-group" role="tablist" aria-label="Duration">
            {DURATIONS.map((duration) => (
              <button
                key={duration}
                type="button"
                className={
                  duration === selectedDuration
                    ? "segment-button active"
                    : "segment-button"
                }
                onClick={() => onDurationSelect(duration)}
              >
                {duration} min
              </button>
            ))}
          </div>
        </div>

        <div className="cluster split">
          <div>
            <span className="field-label">Session behavior</span>
            <p className="support">
              Blocking locks once the timer starts and the timer stays dominant.
            </p>
          </div>
          <button
            type="button"
            className={strictBlocking ? "toggle active" : "toggle"}
            onClick={onStrictBlockingToggle}
          >
            {strictBlocking ? "Strict blocking on" : "Strict blocking off"}
          </button>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onStartSession}
          disabled={!sessionPrepared}
        >
          Start {selectedDuration}-minute session
        </button>
      </div>

      <aside className="secondary-panel">
        <p className="eyebrow">Readiness</p>
        <div className="summary-block">
          <span className="summary-label">Blocking</span>
          <strong>
            {strictBlocking ? "Web and apps will be blocked" : "Advisory only"}
          </strong>
          <p>Keep this visible, clear, and firm before the session starts.</p>
        </div>
        <div className="summary-block">
          <span className="summary-label">Next outcome</span>
          <strong>Completed, incomplete, or abandoned</strong>
          <p>Logging stays short so finishing the loop takes seconds.</p>
        </div>
        <div className="summary-block">
          <span className="summary-label">Do not add</span>
          <strong>Projects, tags, or dashboard cards</strong>
          <p>The home screen stays an action surface, not a planner.</p>
        </div>
      </aside>
    </section>
  );
}
