import type { SessionRecord } from "../session.types.ts";

type HistoryViewProps = {
  history: readonly SessionRecord[];
};

export function HistoryView({ history }: HistoryViewProps) {
  return (
    <section className="page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">History</p>
        <h1 className="page-title">Recent focus blocks.</h1>
        <p className="page-copy">A compact record of what closed and how it ended.</p>
      </header>

      {history.length > 0 ? (
        <div className="row-list history-list">
          {history.map((record) => (
            <div key={record.id} className="history-row">
              <div className="history-main">
                <strong>{record.task}</strong>
                <span>
                  {record.duration} min block - {record.capturedMinutes} min captured
                </span>
              </div>
              <div className="history-meta">
                <span className={`state-pill ${record.result}`}>
                  {formatOutcomeLabel(record.result)}
                </span>
                <span>{formatEndedAt(record.endedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <strong>No sessions logged yet.</strong>
          <span>Your closed blocks will appear here.</span>
        </div>
      )}
    </section>
  );
}

function formatEndedAt(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOutcomeLabel(result: SessionRecord["result"]) {
  return `${result.charAt(0).toUpperCase()}${result.slice(1)}`;
}
