import { Button } from "../../../shared/components/ui/button.tsx";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import { ToggleGroup, ToggleGroupItem } from "../../../shared/components/ui/toggle-group.tsx";
import {
  eyebrowClassName,
  metricCellClassName,
  metricGridClassName,
  pageClassName,
  pageCopyClassName,
  pageHeaderClassName,
  pageTitleClassName,
  summaryLabelClassName,
} from "../../../shared/components/ui/styles.ts";
import { FAILURE_REASONS } from "../session.constants.ts";
import type {
  SessionOutcome,
  SessionResult,
  SessionStats,
} from "../session.types.ts";

type OutcomeViewProps = {
  sessionTask: string;
  sessionResult: SessionResult;
  failureReason: string;
  stats: SessionStats;
  onSessionResultSelect: (value: SessionOutcome) => void;
  onFailureReasonSelect: (value: string) => void;
  onSaveOutcome: () => void;
};

export function OutcomeView({
  sessionTask,
  sessionResult,
  failureReason,
  stats,
  onSessionResultSelect,
  onFailureReasonSelect,
  onSaveOutcome,
}: OutcomeViewProps) {
  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>Outcome</p>
        <h1 className={pageTitleClassName}>Close the loop.</h1>
        <p className={pageCopyClassName}>{sessionTask || "Last session"}</p>
      </header>

      <Card className="bg-card/92">
        <CardContent className="grid gap-5 pt-5">
          <ToggleGroup
            type="single"
            value={sessionResult ?? ""}
            onValueChange={(value) => {
              if (value === "completed" || value === "incomplete" || value === "abandoned") {
                onSessionResultSelect(value);
              }
            }}
            className="grid gap-3 md:grid-cols-3"
          >
            {(["completed", "incomplete", "abandoned"] as const).map((result) => (
              <ToggleGroupItem
                key={result}
                value={result}
                className="h-11 justify-center"
                aria-label={formatOutcomeLabel(result)}
              >
                {formatOutcomeLabel(result)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {sessionResult && sessionResult !== "completed" ? (
            <div className="grid gap-3">
              <Label>Why did execution break?</Label>
              <div className="flex flex-wrap gap-2">
                {FAILURE_REASONS.map((reason) => (
                  <Button
                    key={reason}
                    variant={failureReason === reason ? "default" : "secondary"}
                    size="sm"
                    onClick={() => onFailureReasonSelect(reason)}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <Button
            variant="default"
            size="lg"
            className="w-full md:w-auto"
            onClick={onSaveOutcome}
            disabled={
              !sessionResult ||
              (sessionResult !== "completed" && failureReason.length === 0)
            }
          >
            Save outcome
          </Button>
        </CardContent>
      </Card>

      <div className={metricGridClassName}>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Incomplete</span>
          <strong>{stats.incomplete}</strong>
        </div>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Abandoned</span>
          <strong>{stats.abandoned}</strong>
        </div>
        <div className={metricCellClassName}>
          <span className={summaryLabelClassName}>Focus</span>
          <strong>{stats.focusMinutes} min</strong>
        </div>
      </div>
    </section>
  );
}

function formatOutcomeLabel(result: SessionOutcome) {
  return `${result.charAt(0).toUpperCase()}${result.slice(1)}`;
}
