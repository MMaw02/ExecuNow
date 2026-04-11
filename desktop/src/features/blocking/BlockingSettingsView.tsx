import { InfoHint } from "../../shared/components/InfoHint.tsx";

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
    <section className="page settings-page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">Blocking</p>
        <h1 className="page-title">Set the rule before the timer starts.</h1>
        <p className="page-copy">Keep it calm, strict, and easy to trust.</p>
      </header>

      <div className="setting-row">
        <div className="stack compact">
          <span className="field-row">
            <span className="field-label">Focus rule</span>
            <InfoHint label="This applies to the next session. During an active block, the rule stays locked." />
          </span>
          <p className="support">
            {strictBlocking
              ? "Strict mode is armed for the next block."
              : "Relaxed mode is ready for the next block."}
          </p>
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

      <div className="row-list">
        <div className="list-row">
          <strong>Web distractions</strong>
          <span>{strictBlocking ? "Blocked during the block" : "Still visible"}</span>
        </div>
        <div className="list-row">
          <strong>Distracting apps</strong>
          <span>
            {strictBlocking ? "Held outside the session" : "Soft guidance only"}
          </span>
        </div>
        <div className="list-row">
          <strong>Interruptions</strong>
          <span>{strictBlocking ? "Quiet mode stays firm" : "You manage it manually"}</span>
        </div>
      </div>
    </section>
  );
}
