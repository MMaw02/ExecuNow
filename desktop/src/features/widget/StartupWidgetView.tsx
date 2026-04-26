import {
  Circle,
  CircleCheck,
  CirclePlay,
  Clock3,
  GripHorizontal,
  Plus,
} from "lucide-react";
import type {
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from "react";
import { Badge } from "../../shared/components/ui/badge.tsx";
import { Button } from "../../shared/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "../../shared/components/ui/card.tsx";
import { Input } from "../../shared/components/ui/input.tsx";
import { ScrollArea } from "../../shared/components/ui/scroll-area.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../shared/components/ui/select.tsx";
import {
  emptyCopyClassName,
  summaryLabelClassName,
  validationTextClassName,
} from "../../shared/components/ui/styles.ts";
import { cn } from "../../shared/lib/cn.ts";
import { PomodoroIndicator } from "../pomodoro/PomodoroIndicator.tsx";
import type { PomodoroSettings } from "../pomodoro/pomodoro.types.ts";
import { getPomodoroBreakdown } from "../pomodoro/pomodoro.model.ts";
import { MIN_WIDGET_ESTIMATE_MINUTES } from "./widget.model.ts";
import { PriorityChip, PriorityOptionContent } from "./startup-widget.presentation.tsx";
import type { WidgetPriority, WidgetTask } from "./widget.types.ts";

export type StartupWidgetViewProps = {
  canAddTask: boolean;
  estimateInvalid: boolean;
  estimateValue: string;
  onEstimateChange(event: ChangeEvent<HTMLInputElement>): void;
  onHeaderMouseDown(event: MouseEvent<HTMLElement>): void;
  onOpenTasks(): void;
  onPriorityChange(value: string): void;
  onSelectTask(taskId: string): void;
  onStartTask(taskId: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  onTaskTitleChange(value: string): void;
  onToggleTaskCompleted(taskId: string): void;
  pomodoroSettings: PomodoroSettings;
  priority: WidgetPriority;
  selectedTaskId: string | null;
  taskTitle: string;
  tasks: WidgetTask[];
};

export function StartupWidgetView({
  canAddTask,
  estimateInvalid,
  estimateValue,
  onEstimateChange,
  onHeaderMouseDown,
  onOpenTasks,
  onPriorityChange,
  onSelectTask,
  onStartTask,
  onSubmit,
  onTaskTitleChange,
  onToggleTaskCompleted,
  pomodoroSettings,
  priority,
  selectedTaskId,
  taskTitle,
  tasks,
}: StartupWidgetViewProps) {
  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <Card className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 bg-popover/98 shadow-none">
        <CardHeader className="border-b border-border/70 bg-muted/10 px-3 py-3">
          <header
            className="grid cursor-grab grid-cols-[minmax(0,1fr)_auto] items-start gap-3 active:cursor-grabbing"
            onMouseDown={onHeaderMouseDown}
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
                onClick={onOpenTasks}
                data-widget-no-drag
              >
                Details
              </Button>
            </div>
          </header>
        </CardHeader>

        <CardContent className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden px-3 py-3">
          <section className="shrink-0">
            <form className="grid gap-2.5" onSubmit={onSubmit}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  value={taskTitle}
                  onChange={(event) => onTaskTitleChange(event.currentTarget.value)}
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
                    onChange={onEstimateChange}
                    placeholder="15 min"
                    aria-label="Time"
                  />
                </div>

                <div className="rounded-[var(--radius-small)] border border-border/70 bg-muted/20 px-3 py-2.5">
                  <Select value={priority ?? "optional"} onValueChange={onPriorityChange}>
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
              <Badge variant="info">{tasks.length}</Badge>
            </div>

            {tasks.length > 0 ? (
              <ScrollArea className="min-h-0 h-full pr-1">
                <div className="grid gap-2" role="list" aria-label="Pending tasks">
                  {tasks.map((task) => {
                    const pomodoroBreakdown = getPomodoroBreakdown(
                      task.estimateMinutes,
                      pomodoroSettings,
                    );

                    return (
                      <article
                        key={task.id}
                        className={cn(
                          "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[var(--radius-medium)] border p-2.5 transition-colors",
                          task.id === selectedTaskId
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
                          onClick={() => onToggleTaskCompleted(task.id)}
                          aria-label={task.completed ? "Mark task as pending" : "Mark task as done"}
                          title={task.completed ? "Mark task as pending" : "Mark task as done"}
                        >
                          {task.completed ? <CircleCheck size={18} /> : <Circle size={18} />}
                        </Button>

                        <button
                          type="button"
                          className="grid min-w-0 gap-1 text-left"
                          onClick={() => onSelectTask(task.id)}
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
                            onClick={() => onStartTask(task.id)}
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
