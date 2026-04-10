type BlockingSettingsViewProps = {
  strictBlocking: boolean;
  sessionFlowLocked: boolean;
  onStrictBlockingToggle: () => void;
};

export function BlockingSettingsView({
  strictBlocking,
  sessionFlowLocked,
  onStrictBlockingToggle,
}: BlockingSettingsViewProps) {
  return (
    <section className="screen content-grid">
      <div className="primary-panel">
        <div className="cluster split">
          <div>
            <span className="field-label">Focus rule</span>
            <p className="support">
              Use one switch. Make the session environment firm before you start.
            </p>
          </div>
          <button
            type="button"
            className={strictBlocking ? "toggle active" : "toggle"}
            onClick={onStrictBlockingToggle}
            disabled={sessionFlowLocked}
          >
            {strictBlocking ? "Strict blocking on" : "Strict blocking off"}
          </button>
        </div>

        <div className="settings-grid">
          <div className="summary-block">
            <span className="summary-label">Web distractions</span>
            <strong>
              {strictBlocking ? "Blocked during session" : "Visible but discouraged"}
            </strong>
            <p>
              Keep social feeds, streaming, and drift-heavy sites out of the focus
              lane.
            </p>
          </div>
          <div className="summary-block">
            <span className="summary-label">Apps</span>
            <strong>
              {strictBlocking ? "Hard stop for common distractors" : "Reminders only"}
            </strong>
            <p>
              Protect the session from casual alt-tabbing into video, chat, or
              browsing.
            </p>
          </div>
          <div className="summary-block">
            <span className="summary-label">Interruptions</span>
            <strong>
              {strictBlocking ? "Quiet mode stays firm" : "You choose manually"}
            </strong>
            <p>
              Notifications and weak prompts should not compete with the timer.
            </p>
          </div>
        </div>
      </div>

      <aside className="secondary-panel">
        <p className="eyebrow">Operational note</p>
        <div className="summary-block">
          <span className="summary-label">Current mode</span>
          <strong>
            {strictBlocking ? "Strict session protection" : "Advisory setup only"}
          </strong>
          <p>
            The stronger setting should feel calm and automatic, not configurable
            in ten different places.
          </p>
        </div>
        <div className="summary-block">
          <span className="summary-label">Lock timing</span>
          <strong>Settings freeze once focus starts</strong>
          <p>
            Keep adjustment before the session, then remove hesitation once the
            timer is running.
          </p>
        </div>
        <div className="summary-block">
          <span className="summary-label">Next additions</span>
          <strong>Rules can expand later without changing the shell</strong>
          <p>
            This page stays compact so the MVP keeps execution ahead of
            configuration.
          </p>
        </div>
      </aside>
    </section>
  );
}
