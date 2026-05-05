import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import { Textarea } from "../../../shared/components/ui/textarea.tsx";
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
import { cn } from "../../../shared/lib/cn.ts";
import type {
  SessionOutcome,
  SessionResult,
  SessionStats,
} from "../session.types.ts";

type OutcomeViewProps = {
  sessionTask: string;
  sessionResult: SessionResult;
  failureReason: string;
  remainingSeconds: number;
  stats: SessionStats;
  onSessionResultSelect: (value: SessionOutcome) => void;
  onFailureReasonSelect: (value: string) => void;
  onCancel: () => void;
  onSaveOutcome: () => void;
};

export function OutcomeView({
  sessionTask,
  sessionResult,
  failureReason,
  remainingSeconds,
  stats,
  onSessionResultSelect,
  onFailureReasonSelect,
  onCancel,
  onSaveOutcome,
}: OutcomeViewProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState(failureReason);
  const initialOutcomeRef = useRef<SessionResult>(sessionResult);

  useEffect(() => {
    setReasonDraft(failureReason);
  }, [failureReason, sessionResult]);

  const selectedOutcome = sessionResult;
  const selectedOutcomeLabel = selectedOutcome ? formatOutcomeLabel(selectedOutcome) : "Outcome";
  const showContextSection = selectedOutcome === "incomplete" || selectedOutcome === "abandoned";
  const canCancelOutcome = remainingSeconds > 0;
  const canRestoreOriginal =
    initialOutcomeRef.current !== null && initialOutcomeRef.current !== selectedOutcome;
  const statsSnapshot = [
    { label: "Completed", value: stats.completed },
    { label: "Incomplete", value: stats.incomplete },
    { label: "Abandoned", value: stats.abandoned },
    { label: "Focus", value: `${stats.focusMinutes} min` },
  ];

  function handleSave() {
    if (!selectedOutcome) {
      return;
    }

    if (selectedOutcome === "completed") {
      onFailureReasonSelect("");
      onSaveOutcome();
      return;
    }

    setConfirmOpen(true);
  }

  function handleConfirmSave() {
    onFailureReasonSelect(selectedOutcome === "completed" ? "" : reasonDraft.trim());
    onSaveOutcome();
    setConfirmOpen(false);
  }

  return (
    <>
      <section className={pageClassName}>
        <header className={pageHeaderClassName}>
          <p className={eyebrowClassName}>Outcome</p>
          <h1 className={pageTitleClassName}>Close the loop.</h1>
          <p className={pageCopyClassName}>
            Review the result, keep the next action obvious, and save the block.
          </p>
        </header>
      </section>

      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && canCancelOutcome) {
            onCancel();
          }
        }}
      >
        <DialogContent
          className="w-[min(42rem,calc(100vw-1.5rem))] gap-6 border-border/80 bg-[rgba(10,18,30,0.98)]"
        >
          <DialogHeader className="gap-2 pr-0">
            <p className={eyebrowClassName}>Session Outcome</p>
            <DialogTitle>Close the loop.</DialogTitle>
            <DialogDescription className="text-sm">
              {showContextSection
                ? "Mark how this block ended and add context only if it helps."
                : "The block is ready to be saved. If the finish was not clean, adjust the result before continuing."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-2 rounded-[var(--radius-medium)] border border-border/70 bg-background/50 px-4 py-4">
              <span className={eyebrowClassName}>Task</span>
              <strong className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                {sessionTask || "Last session"}
              </strong>
            </div>

            <div className="grid gap-3 rounded-[var(--radius-medium)] border border-border/70 bg-background/40 px-4 py-4">
              <div className="grid gap-1">
                <span className={summaryLabelClassName}>
                  {showContextSection ? "Session outcome" : "Current result"}
                </span>
                <p className="text-sm text-muted-foreground">
                  {showContextSection
                    ? "The note is optional. Save when the result feels accurate."
                    : "This session will be saved as finished unless you mark it differently."}
                </p>
              </div>

              {showContextSection ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant={selectedOutcome === "incomplete" ? "default" : "secondary"}
                      className="sm:flex-1"
                      onClick={() => onSessionResultSelect("incomplete")}
                    >
                      Incomplete
                    </Button>
                    <Button
                      type="button"
                      variant={selectedOutcome === "abandoned" ? "destructive" : "secondary"}
                      className="sm:flex-1"
                      onClick={() => onSessionResultSelect("abandoned")}
                    >
                      Abandoned
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="outcome-context-note">Optional note</Label>
                    <Textarea
                      id="outcome-context-note"
                      value={reasonDraft}
                      onChange={(event) => setReasonDraft(event.currentTarget.value)}
                      placeholder="Add a short note about what blocked progress, or leave this empty."
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    className="sm:flex-1"
                    onClick={() => onSessionResultSelect("incomplete")}
                  >
                    Mark incomplete
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="sm:flex-1"
                    onClick={() => onSessionResultSelect("abandoned")}
                  >
                    Mark abandoned
                  </Button>
                </div>
              )}

              {canRestoreOriginal ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start px-0 text-sm text-muted-foreground hover:bg-transparent"
                  onClick={() => {
                    const originalOutcome = initialOutcomeRef.current;
                    if (!originalOutcome) {
                      return;
                    }

                    onSessionResultSelect(originalOutcome);
                    if (originalOutcome === "completed") {
                      setReasonDraft("");
                    }
                  }}
                >
                  Restore original result
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {showContextSection
                  ? "You can save this result with or without a note."
                  : "Save and return to Today."}
              </p>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {canCancelOutcome ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleSave}
                  disabled={!selectedOutcome}
                >
                  {showContextSection ? `Save ${selectedOutcomeLabel.toLowerCase()}` : "Save outcome"}
                </Button>
              </div>
            </div>

            <div className={cn(metricGridClassName, "xl:grid-cols-2")}>
              {statsSnapshot.map((item) => (
                <div key={item.label} className={metricCellClassName}>
                  <span className={summaryLabelClassName}>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Save as {selectedOutcomeLabel.toLowerCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reasonDraft.trim().length > 0
                ? `This saves the result with your note: "${reasonDraft.trim()}"`
                : "This saves the result without any extra context."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant={selectedOutcome === "abandoned" ? "destructive" : "default"}
              onClick={handleConfirmSave}
            >
              Save outcome
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatOutcomeLabel(result: SessionOutcome) {
  return `${result.charAt(0).toUpperCase()}${result.slice(1)}`;
}
