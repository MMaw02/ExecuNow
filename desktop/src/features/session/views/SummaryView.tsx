import { Badge } from "../../../shared/components/ui/badge.tsx";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import {
  emptyCopyClassName,
  eyebrowClassName,
  listRowClassName,
  metricCellClassName,
  metricGridClassName,
  pageClassName,
  pageCopyClassName,
  pageHeaderClassName,
  pageTitleClassName,
  rowListClassName,
  sectionHeadingClassName,
  sectionLabelClassName,
  summaryLabelClassName,
} from "../../../shared/components/ui/styles.ts";
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
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>Summary</p>
        <h1 className={pageTitleClassName}>Today at a glance.</h1>
        <p className={pageCopyClassName}>Enough signal to adjust. Not enough noise to distract.</p>
      </header>

      <div className={metricGridClassName}>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Closed</span>
          <strong>{totalSessions}</strong>
        </div>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Completion</span>
          <strong>{completionRate}%</strong>
        </div>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Focus</span>
          <strong>{stats.focusMinutes} min</strong>
        </div>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Avg block</span>
          <strong>{averageCaptured} min</strong>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-card/88">
          <CardContent className="grid gap-4 pt-5">
            <div className={sectionHeadingClassName}>
              <span className={sectionLabelClassName}>Result mix</span>
            </div>
            <div className={rowListClassName}>
              <div className={listRowClassName}>
                <strong>Completed</strong>
                <Badge variant="success">{stats.completed}</Badge>
              </div>
              <div className={listRowClassName}>
                <strong>Incomplete</strong>
                <Badge variant="info">{stats.incomplete}</Badge>
              </div>
              <div className={listRowClassName}>
                <strong>Abandoned</strong>
                <Badge variant="warning">{stats.abandoned}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/88">
          <CardContent className="grid gap-4 pt-5">
            <div className={sectionHeadingClassName}>
              <span className={sectionLabelClassName}>Latest friction</span>
            </div>
            {lastBreak ? (
              <div className={rowListClassName}>
                <div className={listRowClassName}>
                  <strong>{lastBreak.task}</strong>
                  <span>{lastBreak.failureReason || "No reason captured"}</span>
                </div>
              </div>
            ) : (
              <p className={emptyCopyClassName}>No interruptions logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
