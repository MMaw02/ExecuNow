import type { ViewCopy } from "../session/session.types.ts";

type TopbarProps = {
  copy: ViewCopy;
  statusLabel: string;
};

export function Topbar({ copy, statusLabel }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <div className="topbar-heading">
          <h2>{copy.title}</h2>
          <p className="lead">{copy.lead}</p>
        </div>
      </div>

      <div className="topbar-status">
        <span className="status-dot" aria-hidden="true" />
        <span>{statusLabel}</span>
      </div>
    </header>
  );
}
