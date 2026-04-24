import { Clock3, Flag, Tag, Type, WandSparkles } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "../../shared/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../shared/components/ui/dialog.tsx";
import { Input } from "../../shared/components/ui/input.tsx";
import { Label } from "../../shared/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/ui/select.tsx";
import { validationTextClassName } from "../../shared/components/ui/styles.ts";
import {
  isWidgetDraftValid,
  MIN_WIDGET_ESTIMATE_MINUTES,
} from "./widget.model.ts";
import { DEFAULT_TASK_TAG, TASK_TAG_OPTIONS } from "./widget.constants.ts";
import type {
  WidgetPriority,
  WidgetTask,
  WidgetTaskUpdate,
} from "./widget.types.ts";

type TaskDialogMode = "create" | "edit";

type TaskDialogProps = {
  mode: TaskDialogMode;
  open: boolean;
  task?: WidgetTask | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    value: Pick<WidgetTaskUpdate, "title" | "estimateMinutes" | "priority" | "tag">,
  ) => void;
};

export function TaskDialog({
  mode,
  open,
  task,
  onOpenChange,
  onSubmit,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [estimateValue, setEstimateValue] = useState("");
  const [priority, setPriority] = useState<WidgetPriority>(null);
  const [tag, setTag] = useState<string>(DEFAULT_TASK_TAG);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(task?.title ?? "");
    setEstimateValue(task ? String(task.estimateMinutes) : "");
    setPriority(task?.priority ?? null);
    setTag(task?.tag ?? DEFAULT_TASK_TAG);
  }, [open, task]);

  const parsedEstimate =
    estimateValue.trim().length > 0 ? Number.parseInt(estimateValue, 10) : null;
  const estimateInvalid =
    estimateValue.trim().length > 0 &&
    (!Number.isFinite(parsedEstimate) ||
      (parsedEstimate ?? 0) < MIN_WIDGET_ESTIMATE_MINUTES);
  const canSave =
    !estimateInvalid &&
    isWidgetDraftValid(title, parsedEstimate);

  function handleEstimateChange(event: ChangeEvent<HTMLInputElement>) {
    setEstimateValue(event.currentTarget.value.replace(/\D+/g, ""));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave || parsedEstimate === null) {
      return;
    }

    onSubmit({
      title,
      estimateMinutes: parsedEstimate,
      priority,
      tag,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Short, clear, ready to run." : "Tighten the block and save."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="task-dialog-title" className="inline-flex items-center gap-2">
              <Type size={14} />
              Task
            </Label>
            <Input
              id="task-dialog-title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Q4 scale review"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-dialog-time" className="inline-flex items-center gap-2">
                <Clock3 size={14} />
                Time
              </Label>
              <Input
                id="task-dialog-time"
                inputMode="numeric"
                invalid={estimateInvalid}
                value={estimateValue}
                onChange={handleEstimateChange}
                placeholder="25"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-dialog-priority" className="inline-flex items-center gap-2">
                <Flag size={14} />
                Priority
              </Label>
              <Select
                value={priority ?? "optional"}
                onValueChange={(value) => setPriority(parsePriority(value))}
              >
                <SelectTrigger id="task-dialog-priority">
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
            <Label htmlFor="task-dialog-tag" className="inline-flex items-center gap-2">
              <Tag size={14} />
              Tag
            </Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger id="task-dialog-tag">
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TAG_OPTIONS.map((taskTag) => (
                  <SelectItem key={taskTag} value={taskTag}>
                    #{taskTag}
                  </SelectItem>
                ))}
                {!TASK_TAG_OPTIONS.includes(tag as (typeof TASK_TAG_OPTIONS)[number]) ? (
                  <SelectItem value={tag}>#{tag}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {estimateInvalid ? (
            <p className={validationTextClassName}>
              Time must be at least {MIN_WIDGET_ESTIMATE_MINUTES} minutes.
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              <WandSparkles size={15} />
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parsePriority(value: string): WidgetPriority {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return null;
}
