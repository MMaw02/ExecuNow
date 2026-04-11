import type {
  SessionRecord,
  SessionStats,
} from "../session.types.ts";

type SummaryViewProps = {
  stats: SessionStats;
  history: readonly SessionRecord[];
};

export function SummaryView({ stats, history }: SummaryViewProps) {
  const totalSessions = stats.completed + stats.incomplete + stats.abandoned;
  const completionRate = totalSessions > 0 ? Math.round((stats.completed / totalSessions) * 100) : 0;
  const averageCaptured = totalSessions > 0 ? Math.round(stats.focusMinutes / totalSessions) : 0;
  const lastBreak = history.find((record) => record.result !== "completed");

  return (
    <section className="page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">Summary</p>
        <h1 className="page-title">Today at a glance.</h1>
        <p className="page-copy">Enough signal to adjust. Not enough noise to distract.</p>
      </header>

      <div className="metric-grid">
        <div className="metric-cell">
          <span className="summary-label">Closed</span>
          <strong>{totalSessions}</strong>
        </div>
        <div className="metric-cell">
          <span className="summary-label">Completion</span>
          <strong>{completionRate}%</strong>
        </div>
        <div className="metric-cell">
          <span className="summary-label">Focus</span>
          <strong>{stats.focusMinutes} min</strong>
        </div>
        <div className="metric-cell">
          <span className="summary-label">Avg block</span>
          <strong>{averageCaptured} min</strong>
        </div>
      </div>

      <div className="page-columns">
        <section className="list-block">
          <div className="section-heading">
            <span className="section-label">Result mix</span>
          </div>
          <div className="row-list">
            <div className="list-row">
              <strong>Completed</strong>
              <span>{stats.completed}</span>
            </div>
            <div className="list-row">
              <strong>Incomplete</strong>
              <span>{stats.incomplete}</span>
            </div>
            <div className="list-row">
              <strong>Abandoned</strong>
              <span>{stats.abandoned}</span>
            </div>
          </div>
        </section>

        <section className="list-block">
          <div className="section-heading">
            <span className="section-label">Latest friction</span>
          </div>
          {lastBreak ? (
            <div className="row-list">
              <div className="list-row">
                <strong>{lastBreak.task}</strong>
                <span>{lastBreak.failureReason || "No reason captured"}</span>
              </div>
            </div>
          ) : (
            <p className="empty-copy">No interruptions logged yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}
