import { useEffect, useState } from "react";
import {
  DURATIONS,
  MIN_CUSTOM_DURATION,
  SUGGESTED_TASKS,
} from "../session.constants.ts";
import type {
  DurationOption,
  SessionRecord,
} from "../session.types.ts";
import { InfoHint } from "../../../shared/components/InfoHint.tsx";

type HomeViewProps = {
  taskTitle: string;
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  sessionPrepared: boolean;
  history: readonly SessionRecord[];
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
  history,
  onTaskTitleChange,
  onSuggestedTaskSelect,
  onDurationSelect,
  onStrictBlockingToggle,
  onStartSession,
}: HomeViewProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState("");
  const recentWins = history.filter((record) => record.result === "completed").slice(0, 3);
  const usingCustomDuration = !DURATIONS.includes(selectedDuration);
  const trimmedCustomValue = customDurationValue.trim();
  const parsedCustomDuration =
    trimmedCustomValue.length > 0 ? Number.parseInt(trimmedCustomValue, 10) : null;
  const customDurationInvalid =
    trimmedCustomValue.length > 0 &&
    (!Number.isFinite(parsedCustomDuration) || (parsedCustomDuration ?? 0) < MIN_CUSTOM_DURATION);
  const effectiveDuration =
    trimmedCustomValue.length > 0 && !customDurationInvalid && parsedCustomDuration !== null
      ? parsedCustomDuration
      : selectedDuration;
  const canStartSession = sessionPrepared && !customDurationInvalid;

  useEffect(() => {
    if (usingCustomDuration) {
      setCustomDurationValue(String(selectedDuration));
      return;
    }

    setCustomDurationValue("");
  }, [selectedDuration, usingCustomDuration]);

  function handleCustomDurationChange(value: string) {
    const sanitized = value.replace(/\D+/g, "");
    setCustomDurationValue(sanitized);

    if (sanitized.length === 0) {
      return;
    }

    const nextDuration = Number.parseInt(sanitized, 10);

    if (Number.isFinite(nextDuration) && nextDuration >= MIN_CUSTOM_DURATION) {
      onDurationSelect(nextDuration);
    }
  }

  function handlePresetDurationSelect(duration: DurationOption) {
    setCustomDurationValue("");
    onDurationSelect(duration);
  }

  return (
    <section className="page today-page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">Today</p>
        <h1 className="page-title">What are we executing now?</h1>
        <p className="page-copy">Open fast. Set the task. Start before attention drifts.</p>
      </header>

      <div className="focus-composer">
        <label className="field">
          <span className="field-row">
            <span className="field-label">Task</span>
            <InfoHint label="Keep it small enough to advance in a single focus block." />
          </span>
          <input
            className="text-input"
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.currentTarget.value)}
            placeholder="Finish the proposal draft"
          />
        </label>

        <div className="recommendation-strip">
          <button
            type="button"
            className={showSuggestions ? "inline-action active" : "inline-action"}
            onClick={() => setShowSuggestions((value) => !value)}
          >
            {showSuggestions ? "Hide suggestions" : "Need a recommendation?"}
          </button>

          {showSuggestions ? (
            <div className="suggestion-list compact">
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
          ) : null}
        </div>

        <div className="stack">
          <span className="field-row">
            <span className="field-label">Block</span>
            <InfoHint label="Use a preset when you want to start instantly. Use Others when the block needs a custom length." />
          </span>
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
                onClick={() => handlePresetDurationSelect(duration)}
              >
                {duration} min
              </button>
            ))}
          </div>
          <div className="custom-duration-row">
            <label className="custom-duration-field">
              <span className="field-label">Others</span>
              <input
                className={customDurationInvalid ? "text-input compact invalid" : "text-input compact"}
                inputMode="numeric"
                min={MIN_CUSTOM_DURATION}
                placeholder="Min 5"
                value={customDurationValue}
                onChange={(event) => handleCustomDurationChange(event.currentTarget.value)}
                aria-invalid={customDurationInvalid}
              />
            </label>
            <span className={usingCustomDuration ? "custom-duration-badge active" : "custom-duration-badge"}>
              {effectiveDuration} min
            </span>
          </div>
          {customDurationInvalid ? (
            <p className="validation-copy">Others must be at least {MIN_CUSTOM_DURATION} minutes.</p>
          ) : null}
        </div>

        <div className="control-row">
          <div className="stack compact">
            <span className="field-row">
              <span className="field-label">Blocking</span>
              <InfoHint label="Strict mode keeps distracting sites and apps out while the timer is running." />
            </span>
            <p className="support">
              {strictBlocking ? "Strict mode ready" : "Relaxed mode ready"}
            </p>
          </div>
          <button
            type="button"
            className={strictBlocking ? "toggle-button active" : "toggle-button"}
            onClick={onStrictBlockingToggle}
          >
            {strictBlocking ? "Strict" : "Relaxed"}
          </button>
        </div>

        <button
          type="button"
          className="primary-button launch-button"
          onClick={onStartSession}
          disabled={!canStartSession}
        >
          Start {effectiveDuration} min
        </button>
      </div>

      <section className="list-block recent-wins-block">
        <div className="section-heading">
          <span className="section-label">Recent wins</span>
          <p className="section-copy">Keep momentum visible without turning this into a dashboard.</p>
        </div>
        {recentWins.length > 0 ? (
          <div className="wins-grid">
            {recentWins.map((record) => (
              <article key={record.id} className="win-card">
                <div className="win-accent" aria-hidden="true" />
                <div className="win-copy">
                  <strong>{record.task}</strong>
                  <span>{record.capturedMinutes} min captured</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">Completed blocks will land here.</p>
        )}
      </section>
    </section>
  );
}
