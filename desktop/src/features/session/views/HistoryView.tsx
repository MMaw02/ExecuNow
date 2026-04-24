import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import {
  emptyPanelClassName,
  eyebrowClassName,
  pageClassName,
  pageCopyClassName,
  pageHeaderClassName,
  pageTitleClassName,
  rowListClassName,
  statePillClassName,
} from "../../../shared/components/ui/styles.ts";
import { cn } from "../../../shared/lib/cn.ts";
import type { SessionRecord } from "../session.types.ts";

type HistoryViewProps = {
  history: readonly SessionRecord[];
};

export function HistoryView({ history }: HistoryViewProps) {
  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>History</p>
        <h1 className={pageTitleClassName}>Recent focus blocks.</h1>
        <p className={pageCopyClassName}>A compact record of what closed and how it ended.</p>
      </header>

      {history.length > 0 ? (
        <Card className="bg-card/92">
          <CardContent className={cn(rowListClassName, "pt-5")}>
            {history.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-3 rounded-[var(--radius-medium)] border border-border bg-muted/35 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="grid gap-1">
                  <strong>{record.task}</strong>
                  <span className="text-sm text-muted-foreground">
                    {record.duration} min block - {record.capturedMinutes} min captured
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground md:items-end">
                  <span className={statePillClassName(record.result)}>
                    {formatOutcomeLabel(record.result)}
                  </span>
                  <span>{formatEndedAt(record.endedAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className={emptyPanelClassName}>
          <strong>No sessions logged yet.</strong>
          <span className="text-sm text-muted-foreground">Your closed blocks will appear here.</span>
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
