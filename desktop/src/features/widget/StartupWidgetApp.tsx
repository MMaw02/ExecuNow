import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChevronDown, Circle, CircleCheck, Clock3, Flag, GripHorizontal } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import {
  consumeSelectedWidgetTask,
  isWidgetDraftValid,
  MIN_WIDGET_ESTIMATE_MINUTES,
} from "./widget.model.ts";
import {
  bringMainWindowToFront,
  setPendingWidgetAction,
  toWidgetTransferPayload,
} from "./widget.events.ts";
import { useWidgetTasks } from "./useWidgetTasks.ts";
import type { WidgetPriority } from "./widget.types.ts";

export function StartupWidgetApp() {
  const { state, selectedTask, actions } = useWidgetTasks();
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
  const canStartSelectedTask = Boolean(selectedTask && !selectedTask.completed);

  function handleEstimateChange(event: ChangeEvent<HTMLInputElement>) {
    setEstimateValue(event.currentTarget.value.replace(/\D+/g, ""));
  }

  function handleHeaderMouseDown(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;

    if (target.closest("button, input, select")) {
      return;
    }

    void getCurrentWindow().startDragging();
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

  async function handleStartTask() {
    if (!selectedTask || selectedTask.completed) {
      return;
    }

    const { task, nextState } = consumeSelectedWidgetTask(state);

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
    <main className="widget-root">
      <section className="widget-shell">
        <header className="widget-header">
          <button
            type="button"
            className="widget-header-link left"
            onClick={handleOpenTasks}
          >
            Details Task
          </button>
          <div
            className="widget-drag-handle"
            data-tauri-drag-region
            onMouseDown={handleHeaderMouseDown}
          >
            <GripHorizontal size={16} aria-hidden="true" />
            <strong className="widget-brand">TaskCapture</strong>
          </div>
          <button
            type="button"
            className="widget-header-link right"
            onClick={handleStartTask}
            disabled={!canStartSelectedTask}
          >
            Start Task
          </button>
        </header>

        <div
          className="widget-drag-bar"
          data-tauri-drag-region
          onMouseDown={handleHeaderMouseDown}
          role="presentation"
        >
          <GripHorizontal size={16} aria-hidden="true" />
        </div>

        <form className="widget-capture-form" onSubmit={handleSubmit}>
          <div className="widget-capture-row">
            <input
              className="text-input widget-capture-input"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.currentTarget.value)}
              placeholder="Capture quick task..."
            />
            <button type="submit" className="widget-add-button-primary" disabled={!canAddTask}>
              Add
            </button>
          </div>

          <div className="widget-option-row">
            <div className="widget-option-field">
              <span className="widget-option-icon" aria-hidden="true">
                <Clock3 size={14} />
              </span>
              <input
                className={
                  estimateInvalid
                    ? "text-input compact invalid widget-inline-input"
                    : "text-input compact widget-inline-input"
                }
                inputMode="numeric"
                value={estimateValue}
                onChange={handleEstimateChange}
                placeholder="15 min"
                aria-label="Time"
              />
            </div>

            <div className="widget-option-field">
              <span className="widget-option-icon" aria-hidden="true">
                <Flag size={14} />
              </span>
              <span className="widget-select-wrap">
                <select
                  className="widget-select widget-select-muted widget-inline-select"
                  value={priority ?? ""}
                  onChange={(event) => setPriority(parsePriority(event.currentTarget.value))}
                  aria-label="Priority"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="">Optional</option>
                </select>
                <ChevronDown size={14} className="widget-select-icon" aria-hidden="true" />
              </span>
            </div>
          </div>

          {estimateInvalid ? (
            <p className="validation-copy">
              The estimate must be at least {MIN_WIDGET_ESTIMATE_MINUTES} minutes.
            </p>
          ) : null}
        </form>

        <section className="widget-queue-section">
          <div className="widget-section-heading">
            <span className="widget-section-label">Task queue</span>
            <span className="widget-counter">{state.tasks.length}</span>
          </div>

          <div className="widget-task-list" role="list" aria-label="Pending tasks">
            {state.tasks.length > 0 ? (
              state.tasks.map((task) => (
                <article
                  key={task.id}
                  className={task.id === state.selectedTaskId ? "widget-task-row active" : "widget-task-row"}
                >
                  <button
                    type="button"
                    className={task.completed ? "widget-task-toggle done" : "widget-task-toggle"}
                    onClick={() => actions.toggleTaskCompleted(task.id)}
                    aria-label={task.completed ? "Mark task as pending" : "Mark task as done"}
                    title={task.completed ? "Mark task as pending" : "Mark task as done"}
                  >
                    {task.completed ? <CircleCheck size={18} /> : <Circle size={18} />}
                  </button>

                  <button
                    type="button"
                    className="widget-task-select"
                    onClick={() => actions.selectTask(task.id)}
                  >
                    <span className={task.completed ? "widget-task-main completed" : "widget-task-main"}>
                      <strong>{task.title}</strong>
                      <span>
                        {task.estimateMinutes} min
                        {task.priority ? ` • ${priorityLabel(task.priority)}` : ""}
                      </span>
                    </span>
                  </button>
                </article>
              ))
            ) : (
              <div className="widget-empty-state slim">
                <strong>No tasks yet.</strong>
                <p className="support">Capture one task and keep the queue short.</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function parsePriority(value: string): WidgetPriority {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return null;
}

function priorityLabel(priority: Exclude<WidgetPriority, null>) {
  if (priority === "high") {
    return "High";
  }

  if (priority === "medium") {
    return "Medium";
  }

  return "Low";
}
