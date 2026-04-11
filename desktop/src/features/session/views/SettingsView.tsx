import { DURATIONS } from "../session.constants.ts";
import type { DurationOption } from "../session.types.ts";
import { InfoHint } from "../../../shared/components/InfoHint.tsx";

type SettingsViewProps = {
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  sessionFlowLocked: boolean;
  onDurationSelect: (value: DurationOption) => void;
  onStrictBlockingToggle: () => void;
};

export function SettingsView({
  selectedDuration,
  strictBlocking,
  sessionFlowLocked,
  onDurationSelect,
  onStrictBlockingToggle,
}: SettingsViewProps) {
  return (
    <section className="page settings-page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">Settings</p>
        <h1 className="page-title">Keep defaults simple.</h1>
        <p className="page-copy">Only the settings that help you start faster live here.</p>
      </header>

      <div className="setting-row">
        <div className="stack compact">
          <span className="field-row">
            <span className="field-label">Default block</span>
            <InfoHint label="This becomes the starting duration the next time you open Today." />
          </span>
          <p className="support">Choose the duration you reach for most often.</p>
        </div>
        <div className="segment-group compact" role="tablist" aria-label="Default duration">
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
              disabled={sessionFlowLocked}
            >
              {duration} min
            </button>
          ))}
        </div>
      </div>

      <div className="setting-row">
        <div className="stack compact">
          <span className="field-row">
            <span className="field-label">Default blocking</span>
            <InfoHint label="Strict mode is better when you want the app to reduce drift automatically." />
          </span>
          <p className="support">Set the starting rule for the next focus block.</p>
        </div>
        <button
          type="button"
          className={strictBlocking ? "toggle-button active" : "toggle-button"}
          onClick={onStrictBlockingToggle}
          disabled={sessionFlowLocked}
        >
          {strictBlocking ? "Strict" : "Relaxed"}
        </button>
      </div>

      <div className="page-columns">
        <section className="list-block">
          <div className="section-heading">
            <span className="section-label">Interface</span>
          </div>
          <div className="row-list">
            <div className="list-row">
              <strong>Navigation</strong>
              <span>Single top bar only</span>
            </div>
            <div className="list-row">
              <strong>Copy</strong>
              <span>Compact labels with optional hints</span>
            </div>
          </div>
        </section>

        <section className="list-block">
          <div className="section-heading">
            <span className="section-label">System</span>
          </div>
          <div className="row-list">
            <div className="list-row">
              <strong>Widget</strong>
              <span>Operational, not navigational</span>
            </div>
            <div className="list-row">
              <strong>Calendar setup</strong>
              <span>Reserved for a compact future step</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
