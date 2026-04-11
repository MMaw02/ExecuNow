type TopbarProps = {
  currentLabel: string;
  statusLabel: string;
};

export function Topbar({ currentLabel, statusLabel }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-context">
        <span className="eyebrow">Workspace</span>
        <strong>{currentLabel}</strong>
      </div>

      <div className="topbar-status">
        <span className="status-dot" aria-hidden="true" />
        <span>{statusLabel}</span>
      </div>
    </header>
  );
}
