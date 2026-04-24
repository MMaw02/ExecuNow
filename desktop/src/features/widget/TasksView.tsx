import {
  Circle,
  CircleAlert,
  CircleCheck,
  CirclePlay,
  Clock3,
  Grip,
  Hash,
  PencilLine,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../shared/components/ui/badge.tsx";
import { Button } from "../../shared/components/ui/button.tsx";
import {
  eyebrowClassName,
  emptyCopyClassName,
  emptyPanelClassName,
  pageClassName,
  pageCopyClassName,
  pageHeaderClassName,
  pageTitleClassName,
  sectionLabelClassName,
} from "../../shared/components/ui/styles.ts";
import { cn } from "../../shared/lib/cn.ts";
import type { SessionTaskDraft } from "../session/session.types.ts";
import { TaskDialog } from "./TaskDialog.tsx";
import {
  filterWidgetTasks,
  type WidgetTaskFilter,
} from "./widget.model.ts";
import { useWidgetTasks } from "./useWidgetTasks.ts";
import type { WidgetPriority } from "./widget.types.ts";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; taskId: string }
  | null;

const FILTER_LABELS: Record<WidgetTaskFilter, string> = {
  all: "All Tasks",
  planned: "Planned",
  completed: "Completed",
};

type TasksViewProps = {
  onExecuteTask: (value: SessionTaskDraft) => void;
};

export function TasksView({ onExecuteTask }: TasksViewProps) {
  const { state, actions } = useWidgetTasks();
  const [activeFilter, setActiveFilter] = useState<WidgetTaskFilter>("all");
  const [dialogState, setDialogState] = useState<DialogState>(null);

  const visibleTasks = useMemo(
    () => filterWidgetTasks(state.tasks, activeFilter),
    [activeFilter, state.tasks],
  );
  const taskCounts = useMemo(
    () => ({
      all: state.tasks.length,
      planned: state.tasks.filter((task) => !task.completed).length,
      completed: state.tasks.filter((task) => task.completed).length,
    }),
    [state.tasks],
  );
  const editingTask =
    dialogState?.mode === "edit"
      ? state.tasks.find((task) => task.id === dialogState.taskId) ?? null
      : null;
  const isDialogOpen =
    dialogState?.mode === "create" ||
    (dialogState?.mode === "edit" && editingTask !== null);

  function closeDialog() {
    setDialogState(null);
  }

  function handleExecuteTask(taskId: string) {
    const task = actions.consumeTask(taskId);

    if (!task || task.completed) {
      return;
    }

    onExecuteTask({
      title: task.title,
      duration: task.estimateMinutes,
    });
  }

  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-2">
            <p className={eyebrowClassName}>Tasks</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={pageTitleClassName}>Task Inventory</h1>
              <Badge variant="info" className="px-3 py-1 text-[0.72rem]">
                {taskCounts.all}
              </Badge>
            </div>
            <p className={pageCopyClassName}>
              Tune the queue. Start the next block fast.
            </p>
          </div>

          <Button className="h-11 min-w-[148px]" onClick={() => setDialogState({ mode: "create" })}>
            <Plus size={16} />
            New Task
          </Button>
        </div>
      </header>

      <section className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-border">
          <div
            className="flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Task inventory filters"
          >
            {(Object.keys(FILTER_LABELS) as WidgetTaskFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter}
                className={cn(
                  "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeFilter === filter
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActiveFilter(filter)}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{FILTER_LABELS[filter]}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                      activeFilter === filter
                        ? "bg-primary/14 text-primary"
                        : "bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {taskCounts[filter]}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {visibleTasks.length > 0 ? (
          <div className="grid gap-3" role="list" aria-label="Task inventory">
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                className={cn(
                  "grid gap-3 rounded-[var(--radius-large)] border px-4 py-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5",
                  task.completed
                    ? "border-emerald-400/16 bg-emerald-400/5"
                    : "border-border bg-card/84",
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-full border border-border bg-muted/20 px-0 hover:border-primary/30 hover:bg-primary/8 hover:text-foreground",
                    task.completed &&
                      "border-emerald-400/28 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/36 hover:bg-emerald-400/14 hover:text-emerald-200",
                  )}
                  onClick={() => actions.toggleTaskCompleted(task.id)}
                  aria-label={task.completed ? "Mark task as pending" : "Mark task as done"}
                  title={task.completed ? "Mark task as pending" : "Mark task as done"}
                >
                  {task.completed ? <CircleCheck size={18} /> : <Circle size={18} />}
                </Button>

                <div className="grid min-w-0 gap-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <PrioritySignal priority={task.priority} />
                    <PriorityPill priority={task.priority} />
                    <strong
                      className={cn(
                        "truncate text-lg font-semibold tracking-[-0.03em] text-foreground",
                        task.completed && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.85rem] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={13} />
                      {formatRelativeCreatedAt(task.createdAt)}
                    </span>
                    {task.tag ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Hash size={13} />
                        {task.tag}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-0.5 text-left sm:justify-items-end sm:text-right">
                  <span className={sectionLabelClassName}>Estimated</span>
                  <strong className="text-lg font-semibold tracking-[-0.05em] text-foreground">
                    {task.estimateMinutes}m
                  </strong>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-primary/16 text-primary hover:bg-primary/22 disabled:border-border/70 disabled:bg-muted/30 disabled:text-muted-foreground"
                    onClick={() => handleExecuteTask(task.id)}
                    disabled={task.completed}
                    aria-label={`Execute ${task.title}`}
                    title={task.completed ? "Completed tasks cannot be started" : "Execute task"}
                  >
                    <CirclePlay size={19} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-border bg-muted/16"
                    onClick={() => setDialogState({ mode: "edit", taskId: task.id })}
                    aria-label={`Edit ${task.title}`}
                    title={`Edit ${task.title}`}
                  >
                    <PencilLine size={15} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={emptyPanelClassName}>
            <div className="grid gap-1">
              <strong>
                {activeFilter === "completed"
                  ? "No completed tasks yet."
                  : activeFilter === "planned"
                    ? "No planned tasks."
                    : "No tasks captured yet."}
              </strong>
              <p className={emptyCopyClassName}>
                {activeFilter === "all"
                  ? "Add one task and keep the queue tight."
                  : "Change the filter or add a task."}
              </p>
            </div>
          </div>
        )}
      </section>

      <TaskDialog
        mode={dialogState?.mode === "edit" ? "edit" : "create"}
        open={isDialogOpen}
        task={editingTask}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
        onSubmit={(value) => {
          if (dialogState?.mode === "edit" && editingTask) {
            actions.updateTask(editingTask.id, value);
          } else if (dialogState?.mode === "create") {
            actions.addTask(value);
          }

          closeDialog();
        }}
      />
    </section>
  );
}

function PriorityPill({ priority }: { priority: WidgetPriority }) {
  const { label, className } = getPriorityPresentation(priority);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[calc(var(--radius-small)-1px)] px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em]",
        className,
      )}
    >
      {label}
    </span>
  );
}

function PrioritySignal({ priority }: { priority: WidgetPriority }) {
  const { tone } = getPriorityPresentation(priority);
  const Icon = priority === "high" ? CircleAlert : priority === "medium" ? Grip : Circle;

  return <Icon size={16} className={tone} aria-hidden="true" />;
}

function getPriorityPresentation(priority: WidgetPriority) {
  if (priority === "high") {
    return {
      label: "High",
      className: "bg-orange-500/14 text-orange-300",
      tone: "text-orange-300",
    };
  }

  if (priority === "medium") {
    return {
      label: "Med",
      className: "bg-sky-400/14 text-sky-300",
      tone: "text-sky-300",
    };
  }

  if (priority === "low") {
    return {
      label: "Low",
      className: "bg-emerald-400/14 text-emerald-300",
      tone: "text-emerald-300",
    };
  }

  return {
    label: "Optional",
    className: "bg-muted/30 text-muted-foreground",
    tone: "text-muted-foreground",
  };
}

function formatRelativeCreatedAt(value: string) {
  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return "Created recently";
  }

  const deltaMinutes = Math.round((createdAt.getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, "day");
}
