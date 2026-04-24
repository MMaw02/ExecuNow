import {
  ArrowDown,
  Circle,
  CircleAlert,
  CircleCheck,
  CirclePlay,
  Clock3,
  Flag,
  GripHorizontal,
  Plus,
} from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { Badge } from "../../shared/components/ui/badge.tsx";
import { Button } from "../../shared/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "../../shared/components/ui/card.tsx";
import { Input } from "../../shared/components/ui/input.tsx";
import { ScrollArea } from "../../shared/components/ui/scroll-area.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../shared/components/ui/select.tsx";
import { emptyCopyClassName, summaryLabelClassName, validationTextClassName } from "../../shared/components/ui/styles.ts";
import { cn } from "../../shared/lib/cn.ts";
import { PomodoroIndicator } from "../pomodoro/PomodoroIndicator.tsx";
import { getPomodoroBreakdown } from "../pomodoro/pomodoro.model.ts";
import { usePomodoroSettings } from "../pomodoro/usePomodoroSettings.ts";
import {
  consumeWidgetTask,
  isWidgetDraftValid,
  MIN_WIDGET_ESTIMATE_MINUTES,
} from "./widget.model.ts";
import {
  bringMainWindowToFront,
  setPendingWidgetAction,
  startWidgetWindowDrag,
  toWidgetTransferPayload,
} from "./widget.events.ts";
import { useWidgetTasks } from "./useWidgetTasks.ts";
import type { WidgetPriority } from "./widget.types.ts";

export function StartupWidgetApp() {
  const { state, actions } = useWidgetTasks();
  const { settings: pomodoroSettings } = usePomodoroSettings();
  const [taskTitle, setTaskTitle] = useState("");
  const [estimateValue, setEstimateValue] = useState("15");
  const [priority, setPriority] = useState<WidgetPriority>("medium");

  const parsedEstimate =
    estimateValue.trim().length > 0 ? Number.parseInt(estimateValue, 10) : null;
  const estimateInvalid =
    estimateValue.trim().length > 0 &&
    (!Number.isFinite(parsedEstimate) ||
      (parsedEstimate ?? 0) < MIN_WIDGET_ESTIMATE_MINUTES);
  const canAddTask =
    !estimateInvalid && isWidgetDraftValid(taskTitle, parsedEstimate);

  function handleEstimateChange(event: ChangeEvent<HTMLInputElement>) {
    setEstimateValue(event.currentTarget.value.replace(/\D+/g, ""));
  }

  function handleWidgetHeaderMouseDown(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (
      target.closest(
        "button, input, select, textarea, a, [role='button'], [data-widget-no-drag]",
      )
    ) {
      return;
    }

    event.preventDefault();
    void startWidgetWindowDrag();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAddTask || parsedEstimate === null) {
      return;
    }

    actions.addTask({
      title: taskTitle,
      estimateMinutes: parsedEstimate,
      priority,
    });

    setTaskTitle("");
  }

  async function handleOpenTasks() {
    setPendingWidgetAction({ type: "open-tasks" });
    await bringMainWindowToFront();
  }

  async function handleStartTask(taskId: string) {
    const taskToStart = state.tasks.find((task) => task.id === taskId);

    if (!taskToStart || taskToStart.completed) {
      return;
    }

    const { task, nextState } = consumeWidgetTask(state, taskId);

    if (!task) {
      return;
    }

    actions.replaceState(nextState);
    setPendingWidgetAction({
      type: "start-task",
      payload: toWidgetTransferPayload(task),
    });
    await bringMainWindowToFront();
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <Card className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 bg-popover/98 shadow-none">
        <CardHeader className="border-b border-border/70 bg-muted/10 px-3 py-3">
          <header
            className="grid cursor-grab grid-cols-[minmax(0,1fr)_auto] items-start gap-3 active:cursor-grabbing"
            onMouseDown={handleWidgetHeaderMouseDown}
            data-tauri-drag-region
          >
            <div className="grid gap-1.5 select-none">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripHorizontal size={14} aria-hidden="true" />
                <span className="text-[0.68rem] font-semibold text-white uppercase tracking-[0.16em]">
                  TaskCapture
                </span>
              </div>
              <div className="grid gap-0.5">
                {/* <strong className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                  TaskCapture
                </strong> */}
                <p className="text-xs text-muted-foreground">
                  Capture, queue and launch the next focus block.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2" data-widget-no-drag>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full border border-border/70 bg-muted/20 px-3 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                onClick={handleOpenTasks}
                data-widget-no-drag
              >
                Details
              </Button>
            </div>
          </header>
        </CardHeader>

        <CardContent className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden px-3 py-3">
          <section className="shrink-0">
            <form className="grid gap-2.5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.currentTarget.value)}
                  placeholder="Capture quick task..."
                  className="border-border/70 bg-muted/20 shadow-none"
                />
                <Button
                  variant="default"
                  className="min-w-[104px] px-4"
                  type="submit"
                  disabled={!canAddTask}
                >
                  <Plus size={16} />
                  Add
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-[var(--radius-small)] border border-border/70 bg-muted/20 px-3 py-2.5">
                  <span className="text-muted-foreground" aria-hidden="true">
                    <Clock3 size={14} />
                  </span>
                  <Input
                    size="compact"
                    invalid={estimateInvalid}
                    className="h-auto border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                    inputMode="numeric"
                    value={estimateValue}
                    onChange={handleEstimateChange}
                    placeholder="15 min"
                    aria-label="Time"
                  />
                </div>

                <div className="rounded-[var(--radius-small)] border border-border/70 bg-muted/20 px-3 py-2.5">
                  <Select
                    value={priority ?? "optional"}
                    onValueChange={(value) => setPriority(parsePriority(value))}
                  >
                    <SelectTrigger className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0">
                      <PriorityOptionContent priority={priority} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <PriorityOptionContent priority="high" />
                      </SelectItem>
                      <SelectItem value="medium">
                        <PriorityOptionContent priority="medium" />
                      </SelectItem>
                      <SelectItem value="low">
                        <PriorityOptionContent priority="low" />
                      </SelectItem>
                      <SelectItem value="optional">
                        <PriorityOptionContent priority={null} />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {estimateInvalid ? (
                <p className={validationTextClassName}>
                  The estimate must be at least {MIN_WIDGET_ESTIMATE_MINUTES} minutes.
                </p>
              ) : null}
            </form>
          </section>

          <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-0.5">
              <span className={summaryLabelClassName}>Task queue</span>
              <Badge variant="info">{state.tasks.length}</Badge>
            </div>

            {state.tasks.length > 0 ? (
              <ScrollArea className="min-h-0 h-full pr-1">
                <div className="grid gap-2" role="list" aria-label="Pending tasks">
                  {state.tasks.map((task) => {
                    const pomodoroBreakdown = getPomodoroBreakdown(
                      task.estimateMinutes,
                      pomodoroSettings,
                    );

                    return (
                      <article
                        key={task.id}
                        className={cn(
                          "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[var(--radius-medium)] border p-2.5 transition-colors",
                          task.id === state.selectedTaskId
                            ? "border-primary/40 bg-primary/10"
                            : "border-border/70 bg-muted/20",
                          task.completed && "border-emerald-400/20 bg-emerald-400/8",
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-9 w-9 rounded-full border border-border/70 px-0 text-muted-foreground hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200",
                            task.completed &&
                              "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                          )}
                          onClick={() => actions.toggleTaskCompleted(task.id)}
                          aria-label={task.completed ? "Mark task as pending" : "Mark task as done"}
                          title={task.completed ? "Mark task as pending" : "Mark task as done"}
                        >
                          {task.completed ? <CircleCheck size={18} /> : <Circle size={18} />}
                        </Button>

                        <button
                          type="button"
                          className="grid min-w-0 gap-1 text-left"
                          onClick={() => actions.selectTask(task.id)}
                        >
                          <strong
                            className={cn(
                              "truncate text-sm font-medium tracking-[-0.02em]",
                              task.completed && "text-muted-foreground line-through",
                            )}
                          >
                            {task.title}
                          </strong>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
                              <Clock3 size={12} aria-hidden="true" />
                              {task.estimateMinutes} min focus
                              {pomodoroBreakdown.breakMinutesTotal > 0
                                ? ` • ${pomodoroBreakdown.totalMinutesWithBreaks} min total`
                                : ""}
                            </span>
                            <PriorityChip priority={task.priority} />
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <PomodoroIndicator
                            taskMinutes={task.estimateMinutes}
                            settings={pomodoroSettings}
                            size="compact"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full border border-primary/25 bg-primary/10 px-0 text-primary hover:bg-primary/18 hover:text-primary disabled:border-border/70 disabled:bg-muted/30 disabled:text-muted-foreground"
                            onClick={() => void handleStartTask(task.id)}
                            disabled={task.completed}
                            aria-label={`Start ${task.title}`}
                            title={task.completed ? "Complete tasks cannot be started" : "Start task"}
                          >
                            <CirclePlay size={18} />
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="grid min-h-[180px] place-items-center rounded-[var(--radius-medium)] border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                <div className="grid gap-1">
                  <strong>No tasks yet.</strong>
                  <p className={emptyCopyClassName}>
                    Capture one task and keep the queue short.
                  </p>
                </div>
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

function parsePriority(value: string): WidgetPriority {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return null;
}

function PriorityOptionContent({ priority }: { priority: WidgetPriority }) {
  const presentation = getPriorityPresentation(priority);
  const Icon = priority === "high" ? CircleAlert : priority === "low" ? ArrowDown : Flag;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon size={13} className={cn("shrink-0", presentation.iconClassName)} aria-hidden="true" />
      <span className={cn("truncate", presentation.textClassName)}>{presentation.label}</span>
    </span>
  );
}

function PriorityChip({ priority }: { priority: WidgetPriority }) {
  const presentation = getPriorityPresentation(priority);
  const Icon = priority === "high" ? CircleAlert : priority === "low" ? ArrowDown : Flag;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.64rem] font-medium uppercase tracking-[0.12em]",
        presentation.chipClassName,
      )}
    >
      <Icon size={11} className={presentation.iconClassName} aria-hidden="true" />
      <span>{presentation.label}</span>
    </span>
  );
}

function getPriorityPresentation(priority: WidgetPriority) {
  if (priority === "high") {
    return {
      label: "High",
      chipClassName: "border-rose-400/20 bg-rose-400/10 text-rose-200",
      iconClassName: "text-rose-300",
      textClassName: "text-rose-200",
    };
  }

  if (priority === "medium") {
    return {
      label: "Medium",
      chipClassName: "border-sky-400/20 bg-sky-400/10 text-sky-200",
      iconClassName: "text-sky-300",
      textClassName: "text-sky-200",
    };
  }

  if (priority === "low") {
    return {
      label: "Low",
      chipClassName: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      iconClassName: "text-emerald-300",
      textClassName: "text-emerald-200",
    };
  }

  return {
    label: "Optional",
    chipClassName: "border-border/70 bg-muted/30 text-muted-foreground",
    iconClassName: "text-muted-foreground",
    textClassName: "text-muted-foreground",
  };
}
