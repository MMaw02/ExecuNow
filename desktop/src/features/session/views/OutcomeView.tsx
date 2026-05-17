import { Clock3, Flag, Plus, Tag, Type, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog.tsx";
import { Input } from "../../../shared/components/ui/input.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select.tsx";
import { Textarea } from "../../../shared/components/ui/textarea.tsx";
import {
  eyebrowClassName,
  pageClassName,
  pageCopyClassName,
  pageHeaderClassName,
  pageTitleClassName,
  summaryLabelClassName,
  validationTextClassName,
} from "../../../shared/components/ui/styles.ts";
import { DEFAULT_TASK_TAG, TASK_TAG_OPTIONS } from "../../widget/widget.constants.ts";
import { MIN_WIDGET_ESTIMATE_MINUTES } from "../../widget/widget.model.ts";
import type { WidgetPriority, WidgetTaskUpdate } from "../../widget/widget.types.ts";
import type {
  SessionOutcome,
  SessionResult,
} from "../session.types.ts";

type OutcomeViewMode = "session-abandoned" | "task-incomplete";
type FollowUpTaskDraft = Pick<WidgetTaskUpdate, "title" | "estimateMinutes" | "priority" | "tag">;

type OutcomeViewProps = {
  sessionTask: string;
  sessionResult: SessionResult;
  failureReason: string;
  remainingSeconds?: number;
  mode?: OutcomeViewMode;
  followUpTask?: FollowUpTaskDraft;
  onFailureReasonSelect?: (value: string) => void;
  onCancel: () => void;
  onSaveOutcome?: () => void;
  onSaveTaskOutcome?: (value: {
    failureReason: string;
    followUpTask?: FollowUpTaskDraft;
  }) => void;
};

export function OutcomeView({
  sessionTask,
  sessionResult,
  failureReason,
  remainingSeconds = 0,
  mode = "session-abandoned",
  followUpTask,
  onFailureReasonSelect,
  onCancel,
  onSaveOutcome,
  onSaveTaskOutcome,
}: OutcomeViewProps) {
  const [reasonDraft, setReasonDraft] = useState(failureReason);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpEstimateValue, setFollowUpEstimateValue] = useState("");
  const [followUpPriority, setFollowUpPriority] = useState<WidgetPriority>(null);
  const [followUpTag, setFollowUpTag] = useState<string>(DEFAULT_TASK_TAG);
  const [followUpEnabled, setFollowUpEnabled] = useState(false);

  useEffect(() => {
    setReasonDraft(failureReason);
  }, [failureReason, sessionResult]);

  useEffect(() => {
    if (mode !== "task-incomplete") {
      return;
    }

    setFollowUpTitle(followUpTask?.title ?? `Follow up: ${sessionTask}`);
    setFollowUpEstimateValue(String(followUpTask?.estimateMinutes ?? MIN_WIDGET_ESTIMATE_MINUTES));
    setFollowUpPriority(followUpTask?.priority ?? null);
    setFollowUpTag(followUpTask?.tag ?? DEFAULT_TASK_TAG);
    setFollowUpEnabled(false);
  }, [followUpTask, mode, sessionTask]);

  const selectedOutcome = sessionResult;
  const selectedOutcomeLabel = selectedOutcome ? formatOutcomeLabel(selectedOutcome) : "Outcome";
  const isTaskIncomplete = mode === "task-incomplete";
  const canCancelOutcome = isTaskIncomplete || remainingSeconds > 0;
  const parsedFollowUpEstimate =
    followUpEstimateValue.trim().length > 0
      ? Number.parseInt(followUpEstimateValue, 10)
      : null;
  const followUpEstimateInvalid =
    isTaskIncomplete &&
    followUpEnabled &&
    followUpEstimateValue.trim().length > 0 &&
    (!Number.isFinite(parsedFollowUpEstimate) ||
      (parsedFollowUpEstimate ?? 0) < MIN_WIDGET_ESTIMATE_MINUTES);
  const canSaveFollowUp =
    !isTaskIncomplete ||
    !followUpEnabled ||
    (followUpTitle.trim().length > 0 &&
      parsedFollowUpEstimate !== null &&
      !followUpEstimateInvalid);

  function handleFollowUpEstimateChange(event: ChangeEvent<HTMLInputElement>) {
    setFollowUpEstimateValue(event.currentTarget.value.replace(/\D+/g, ""));
  }

  function handleSave() {
    if (!selectedOutcome) {
      return;
    }

    if (selectedOutcome === "completed") {
      onFailureReasonSelect?.("");
      onSaveOutcome?.();
      return;
    }

    if (isTaskIncomplete) {
      if (!canSaveFollowUp) {
        return;
      }

      onSaveTaskOutcome?.({
        failureReason: reasonDraft.trim(),
        followUpTask:
          followUpEnabled && parsedFollowUpEstimate !== null
            ? {
                title: followUpTitle.trim(),
                estimateMinutes: parsedFollowUpEstimate,
                priority: followUpPriority,
                tag: followUpTag,
              }
            : undefined,
      });
      return;
    }

    onFailureReasonSelect?.(reasonDraft.trim());
    onSaveOutcome?.();
  }

  return (
    <>
      <section className={pageClassName}>
        <header className={pageHeaderClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Outcome
          </p>
          <h1 className={pageTitleClassName}>Close the loop.</h1>
          <p className={pageCopyClassName}>
            {isTaskIncomplete
              ? "Mark the task incomplete. Add a follow-up only if there is a clear next step."
              : "Add brief context only when a block is abandoned."}
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {isTaskIncomplete ? "Task Outcome" : "Session Outcome"}
            </p>
            <DialogTitle>{isTaskIncomplete ? "Mark incomplete" : "Mark abandoned"}</DialogTitle>
            <DialogDescription className="text-sm">
              {isTaskIncomplete
                ? "Save the current task as incomplete. The follow-up task is optional."
                : "Save this only when the task was intentionally stopped before completion."}
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
                <span className={summaryLabelClassName}>Session outcome</span>
                <p className="text-sm text-muted-foreground">
                  The note is optional. Save when the result feels accurate.
                </p>
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

            {isTaskIncomplete ? (
              <div className="grid gap-4 rounded-[var(--radius-medium)] border border-border/70 bg-background/35 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-1">
                    <span className={summaryLabelClassName}>Follow-up task</span>
                    <p className="text-sm text-muted-foreground">
                      Optional. Use it only when the next action is already obvious.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={followUpEnabled ? "outline" : "secondary"}
                    className="w-full sm:w-auto"
                    onClick={() => setFollowUpEnabled((value) => !value)}
                  >
                    {followUpEnabled ? <X size={15} /> : <Plus size={15} />}
                    {followUpEnabled ? "Skip follow-up" : "Add follow-up"}
                  </Button>
                </div>

                {followUpEnabled ? (
                  <div className="grid gap-4 rounded-[var(--radius-small)] border border-primary/18 bg-primary/5 px-3 py-3">
                    <div className="grid gap-2">
                      <Label htmlFor="outcome-follow-up-title" className="inline-flex items-center gap-2">
                        <Type size={14} />
                        Task
                      </Label>
                      <Input
                        id="outcome-follow-up-title"
                        value={followUpTitle}
                        onChange={(event) => setFollowUpTitle(event.currentTarget.value)}
                        placeholder="Next concrete step"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="outcome-follow-up-time" className="inline-flex items-center gap-2">
                          <Clock3 size={14} />
                          Time
                        </Label>
                        <Input
                          id="outcome-follow-up-time"
                          inputMode="numeric"
                          invalid={followUpEstimateInvalid}
                          value={followUpEstimateValue}
                          onChange={handleFollowUpEstimateChange}
                          placeholder="25"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="outcome-follow-up-priority" className="inline-flex items-center gap-2">
                          <Flag size={14} />
                          Priority
                        </Label>
                        <Select
                          value={followUpPriority ?? "optional"}
                          onValueChange={(value) => setFollowUpPriority(parsePriority(value))}
                        >
                          <SelectTrigger id="outcome-follow-up-priority">
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="outcome-follow-up-tag" className="inline-flex items-center gap-2">
                        <Tag size={14} />
                        Tag
                      </Label>
                      <Select value={followUpTag} onValueChange={setFollowUpTag}>
                        <SelectTrigger id="outcome-follow-up-tag">
                          <SelectValue placeholder="Select tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_TAG_OPTIONS.map((taskTag) => (
                            <SelectItem key={taskTag} value={taskTag}>
                              #{taskTag}
                            </SelectItem>
                          ))}
                          {!TASK_TAG_OPTIONS.includes(followUpTag as (typeof TASK_TAG_OPTIONS)[number]) ? (
                            <SelectItem value={followUpTag}>#{followUpTag}</SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </div>

                    {followUpEstimateInvalid ? (
                      <p className={validationTextClassName}>
                        Time must be at least {MIN_WIDGET_ESTIMATE_MINUTES} minutes.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {isTaskIncomplete
                  ? followUpEnabled
                    ? "Saving records the incomplete result and queues the follow-up."
                    : "Saving records the incomplete result without adding a new task."
                  : "You can save this result with or without a note."}
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
                  disabled={!selectedOutcome || !canSaveFollowUp}
                >
                  Save {selectedOutcomeLabel.toLowerCase()}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatOutcomeLabel(result: SessionOutcome) {
  return `${result.charAt(0).toUpperCase()}${result.slice(1)}`;
}

function parsePriority(value: string): WidgetPriority {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return null;
}
