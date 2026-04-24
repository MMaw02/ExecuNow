import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  CheckCheck,
  Clock3,
  Flag,
  Play,
  Shield,
  Tag,
  Undo2,
  Zap,
} from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import { Input } from "../../../shared/components/ui/input.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import { ScrollArea } from "../../../shared/components/ui/scroll-area.tsx";
import { Separator } from "../../../shared/components/ui/separator.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select.tsx";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "../../../shared/components/ui/toggle-group.tsx";
import {
  emptyCopyClassName,
  eyebrowClassName,
  pageHeaderClassName,
  pageClassName,
  pageCopyClassName,
  pageTitleClassName,
  sectionHeadingClassName,
  sectionLabelClassName,
} from "../../../shared/components/ui/styles.ts";
import { cn } from "../../../shared/lib/cn.ts";
import { PomodoroIndicator } from "../../pomodoro/PomodoroIndicator.tsx";
import { getPomodoroBreakdown } from "../../pomodoro/pomodoro.model.ts";
import { usePomodoroSettings } from "../../pomodoro/usePomodoroSettings.ts";
import { DEFAULT_TASK_TAG, TASK_TAG_OPTIONS } from "../../widget/widget.constants.ts";
import { useWidgetTasks } from "../../widget/useWidgetTasks.ts";
import type { WidgetPriority, WidgetTask } from "../../widget/widget.types.ts";
import { MIN_CUSTOM_DURATION } from "../session.constants.ts";
import type {
  DurationOption,
  SessionRecord,
  SessionTaskDraft,
} from "../session.types.ts";

type TaskPriority = Exclude<WidgetPriority, null>;

type HomeViewProps = {
  taskTitle: string;
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  history: readonly SessionRecord[];
  onTaskTitleChange: (value: string) => void;
  onDurationSelect: (value: DurationOption) => void;
  onStrictBlockingToggle: () => void;
  onExecuteTask: (value: SessionTaskDraft) => void;
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

export function HomeView({
  taskTitle,
  selectedDuration,
  strictBlocking,
  history,
  onTaskTitleChange,
  onDurationSelect,
  onStrictBlockingToggle,
  onExecuteTask,
}: HomeViewProps) {
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [tag, setTag] = useState<string>(DEFAULT_TASK_TAG);
  const [durationInput, setDurationInput] = useState(String(selectedDuration));
  const { state: widgetState, actions: widgetActions } = useWidgetTasks();
  const { settings: pomodoroSettings } = usePomodoroSettings();
  const recentCompletedTasks = history.filter((record) => record.result === "completed").slice(0, 3);
  const pendingTasks = widgetState.tasks.filter((task) => !task.completed);
  const trimmedDurationInput = durationInput.trim();
  const parsedDuration = trimmedDurationInput.length > 0 ? Number.parseInt(trimmedDurationInput, 10) : null;
  const durationInvalid =
    trimmedDurationInput.length === 0 ||
    !Number.isFinite(parsedDuration) ||
    (parsedDuration ?? 0) < MIN_CUSTOM_DURATION;
  const canRegisterTask = taskTitle.trim().length > 0 && !durationInvalid;

  useEffect(() => {
    setDurationInput(String(selectedDuration));
  }, [selectedDuration]);

  function handleDurationChange(value: string) {
    const sanitized = value.replace(/\D+/g, "");

    setDurationInput(sanitized);

    if (!sanitized) {
      return;
    }

    const nextDuration = Number.parseInt(sanitized, 10);

    if (Number.isFinite(nextDuration) && nextDuration >= MIN_CUSTOM_DURATION) {
      onDurationSelect(nextDuration);
    }
  }

  function handleDurationBlur() {
    if (!trimmedDurationInput) {
      setDurationInput(String(selectedDuration));
      return;
    }

    const nextDuration = Math.max(Number.parseInt(trimmedDurationInput, 10), MIN_CUSTOM_DURATION);

    if (nextDuration !== selectedDuration) {
      onDurationSelect(nextDuration);
    }

    setDurationInput(String(nextDuration));
  }

  function handleRegisterTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = taskTitle.trim();

    if (!normalizedTitle) {
      return;
    }

    const queuedTask = widgetActions.addTask({
      title: normalizedTitle,
      estimateMinutes: selectedDuration,
      priority,
      tag,
    });

    onTaskTitleChange("");

    toast.custom(
      (toastId) => (
        <div className="flex w-[min(44rem,calc(100vw-1.5rem))] items-center gap-3 rounded-[var(--radius-large)] border border-border bg-[rgba(8,26,49,0.98)] px-3 py-3 text-foreground shadow-[var(--shadow-soft)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-400/14 text-emerald-300">
            <CheckCheck size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-[-0.01em]">Task registered</p>
            <p className="truncate text-sm text-muted-foreground">
              {queuedTask.title} · {queuedTask.estimateMinutes} min ·{" "}
              {getPriorityLabel(queuedTask.priority ?? "high")}
              {queuedTask.tag ? ` · #${queuedTask.tag}` : ""}
            </p>
          </div>

          <Button
            variant="ghost"
            className="h-10 shrink-0 px-3 text-muted-foreground hover:text-foreground"
            onClick={() => {
              restoreQueuedTask(queuedTask);
              toast.dismiss(toastId);
            }}
          >
            <Undo2 size={16} />
            Undo
          </Button>

          <Button
            className="h-10 shrink-0 bg-emerald-400 px-4 text-slate-950 hover:bg-emerald-300"
            onClick={() => {
              executeQueuedTask(queuedTask);
              toast.dismiss(toastId);
            }}
          >
            <Zap size={16} />
            Execute
          </Button>
        </div>
      ),
      {
        duration: 9000,
      },
    );
  }

  function restoreQueuedTask(task: WidgetTask) {
    widgetActions.removeTask(task.id);
    onTaskTitleChange(task.title);
    onDurationSelect(task.estimateMinutes);
    setPriority(task.priority ?? "high");
    setTag(task.tag ?? DEFAULT_TASK_TAG);
  }

  function executeQueuedTask(task: WidgetTask) {
    const nextTask = widgetActions.consumeTask(task.id);

    if (!nextTask) {
      return;
    }

    onExecuteTask({
      title: nextTask.title,
      duration: nextTask.estimateMinutes,
    });
  }

  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>Today</p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-2">
            <h1 className={pageTitleClassName}>Plan the next block</h1>
            <p className={pageCopyClassName}>Title, time, priority, tag.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={strictBlocking ? "success" : "info"}
              className="h-9 items-center px-3 text-[0.66rem]"
            >
              <Shield size={14} />
              {strictBlocking ? "Blocking armed" : "Blocking relaxed"}
            </Badge>
            <Button variant="outline" className="min-w-[132px]" onClick={onStrictBlockingToggle}>
              Switch mode
            </Button>
          </div>
        </div>
      </header>

      <form
        className="grid gap-7 rounded-[var(--radius-large)] border border-border bg-[rgba(8,24,46,0.88)] px-5 py-6 shadow-sm lg:px-7 lg:py-7"
        onSubmit={handleRegisterTask}
      >
        <div className="grid gap-2 text-center">
          <span className={eyebrowClassName}>New task</span>
          <div className="grid gap-3">
            <Label htmlFor="task-title" className="sr-only">
              Task title
            </Label>
            <Input
              id="task-title"
              value={taskTitle}
              onChange={(event) => onTaskTitleChange(event.currentTarget.value)}
              placeholder="What are we executing now?"
              className="h-18 border-border bg-[rgba(4,17,36,0.72)] px-5 text-center text-2xl font-semibold tracking-[-0.04em] placeholder:text-[color:rgba(155,178,214,0.42)] md:text-[2rem]"
            />
          </div>
        </div>

        {/* <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]"> */}
        <div className="w-auto flex justify-between">
          <div className="grid gap-3 w-1/4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 size={15} />
              <span className={sectionLabelClassName}>Duration</span>
            </div>

            <div className="grid gap-2">
              <Input
                id="task-duration"
                value={durationInput}
                onChange={(event) => handleDurationChange(event.currentTarget.value)}
                onBlur={handleDurationBlur}
                inputMode="numeric"
                min={MIN_CUSTOM_DURATION}
                invalid={durationInvalid}
                placeholder="25"
                className="h-11 bg-[rgba(4,17,36,0.64)]"
                aria-label="Task duration in minutes"
              />
              {/* <p className="text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
                Min {MIN_CUSTOM_DURATION} min
              </p> */}
            </div>
          </div>

          <div className="grid gap-3 w-1/4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flag size={15} />
              <span className={sectionLabelClassName}>Priority</span>
            </div>

            <ToggleGroup
              type="single"
              value={priority}
              onValueChange={(value) => {
                if (value) {
                  setPriority(value as TaskPriority);
                }
              }}
              className="grid grid-cols-3 gap-2"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={option.label}
                  className={cn(
                    "h-11 justify-center",
                    option.value === "high" && priority === "high" && "text-emerald-300",
                  )}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-3 w-1/4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag size={15} />
              <span className={sectionLabelClassName}>Tag</span>
            </div>

            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="h-11 bg-[rgba(4,17,36,0.64)]">
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
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left">
          <Button
            type="submit"
            size="lg"
            className="min-w-[240px] bg-emerald-400 px-6 text-slate-950 hover:bg-emerald-300"
            disabled={!canRegisterTask}
          >
            Register task
          </Button>
        </div>
      </form>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className={sectionHeadingClassName}>
              <span className={sectionLabelClassName}>Pending Execution</span>
            </div>
            <span className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              {pendingTasks.length} active
            </span>
          </div>

          {pendingTasks.length > 0 ? (
            <ScrollArea className="max-h-[300px] rounded-[var(--radius-large)]">
              <div className="grid gap-2 pr-3">
                {pendingTasks.map((task) => {
                  const pomodoroBreakdown = getPomodoroBreakdown(task.estimateMinutes, pomodoroSettings);

                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-[3px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[var(--radius-large)] border border-border bg-[rgba(8,24,46,0.68)] px-4 py-3 transition-colors hover:bg-[rgba(10,28,52,0.84)]"
                    >
                      <div className="h-10 rounded-full bg-rose-400/45" aria-hidden="true" />

                      <div className="min-w-0 grid gap-0.5">
                        <strong className="truncate text-[0.96rem] font-semibold tracking-[-0.02em]">
                          {task.title}
                        </strong>
                        <p className="truncate text-[0.74rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {getPriorityLabel(task.priority ?? "high")} • {task.estimateMinutes}m
                          {task.tag ? ` • #${task.tag}` : ""}
                          {pomodoroBreakdown.breakCount > 0
                            ? ` • +${pomodoroBreakdown.breakCount} break`
                            : ""}
                        </p>
                      </div>

                      <PomodoroIndicator
                        taskMinutes={task.estimateMinutes}
                        settings={pomodoroSettings}
                        className="hidden lg:inline-flex"
                      />

                      <Button
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-[var(--radius-small)] bg-primary/14 text-primary hover:bg-primary/22"
                        onClick={() => executeQueuedTask(task)}
                        aria-label={`Execute ${task.title}`}
                        title={`Execute ${task.title}`}
                      >
                        <Play size={15} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="grid min-h-[180px] place-items-center rounded-[var(--radius-large)] border border-dashed border-border bg-muted/20 px-5 py-6 text-center">
              <p className={emptyCopyClassName}>No pending tasks.</p>
            </div>
          )}
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className={sectionHeadingClassName}>
              <span className={sectionLabelClassName}>Completed</span>
            </div>
            <span className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              {recentCompletedTasks.length} recent
            </span>
          </div>

          {recentCompletedTasks.length > 0 ? (
            <ScrollArea className="max-h-[300px] rounded-[var(--radius-large)]">
              <div className="grid gap-2 pr-3">
                {recentCompletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-large)] border border-border bg-[rgba(8,24,46,0.68)] px-4 py-3 transition-colors hover:bg-[rgba(10,28,52,0.82)]"
                  >
                    <div className="h-9 rounded-full bg-emerald-400/50" aria-hidden="true" />

                    <div className="min-w-0 grid gap-0.5">
                      <strong className="truncate text-[0.9rem] font-semibold tracking-[-0.02em]">
                        {task.task}
                      </strong>
                      <p className="truncate text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {task.capturedMinutes}m • {formatEndedAt(task.endedAt)}
                      </p>
                    </div>

                    <CheckCircle2 size={16} className="text-emerald-300" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="grid min-h-[180px] place-items-center rounded-[var(--radius-large)] border border-dashed border-border bg-muted/20 px-5 py-6 text-center">
              <p className={emptyCopyClassName}>No completed tasks yet.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function getPriorityLabel(priority: TaskPriority) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? "High";
}

function formatEndedAt(value: string) {
  const endedAt = new Date(value);

  if (Number.isNaN(endedAt.getTime())) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(endedAt);
}
