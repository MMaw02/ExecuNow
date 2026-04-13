import { Circle, CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { isWidgetDraftValid, MIN_WIDGET_ESTIMATE_MINUTES } from "./widget.model.ts";
import { useWidgetTasks } from "./useWidgetTasks.ts";
import type { WidgetPriority } from "./widget.types.ts";

export function TasksView() {
  const { state, selectedTask, actions } = useWidgetTasks();
  const [taskTitle, setTaskTitle] = useState("");
  const [estimateValue, setEstimateValue] = useState("");
  const [priority, setPriority] = useState<WidgetPriority>(null);

  useEffect(() => {
    setTaskTitle(selectedTask?.title ?? "");
    setEstimateValue(selectedTask ? String(selectedTask.estimateMinutes) : "");
    setPriority(selectedTask?.priority ?? null);
  }, [selectedTask]);

  const parsedEstimate =
    estimateValue.trim().length > 0 ? Number.parseInt(estimateValue, 10) : null;
  const estimateInvalid =
    estimateValue.trim().length > 0 &&
    (!Number.isFinite(parsedEstimate) ||
      (parsedEstimate ?? 0) < MIN_WIDGET_ESTIMATE_MINUTES);
  const canSave =
    selectedTask !== null &&
    !estimateInvalid &&
    isWidgetDraftValid(taskTitle, parsedEstimate);

  function handleEstimateChange(event: ChangeEvent<HTMLInputElement>) {
    setEstimateValue(event.currentTarget.value.replace(/\D+/g, ""));
  }

  function handleSave() {
    if (!selectedTask || parsedEstimate === null || !canSave) {
      return;
    }

    actions.updateTask(selectedTask.id, {
      title: taskTitle,
      estimateMinutes: parsedEstimate,
      priority,
    });
  }

  function handleDelete() {
    if (!selectedTask) {
      return;
    }

    actions.removeTask(selectedTask.id);
  }

  function handleToggleCompleted(taskId: string) {
    actions.toggleTaskCompleted(taskId);
  }

  return (
    <section className="page tasks-page">
      <header className="page-header page-header-tight">
        <p className="eyebrow">Tasks</p>
        <h1 className="page-title tasks-title">Task queue and details.</h1>
        <p className="page-copy">
          Revisa pendientes, corrige detalles y deja la siguiente tarea lista para abrirse en el widget.
        </p>
      </header>

      <section className="tasks-workbench">
        <div className="tasks-pane">
          <div className="section-heading">
            <span className="section-label">Queue</span>
            <p className="section-copy">El widget usa esta misma lista para capturar y arrancar rápido.</p>
          </div>

          <div className="tasks-scroll-list" role="list" aria-label="Task queue">
            {state.tasks.length > 0 ? (
              state.tasks.map((task) => (
                <article
                  key={task.id}
                  className={task.id === state.selectedTaskId ? "task-row-card active" : "task-row-card"}
                >
                  <button
                    type="button"
                    className={task.completed ? "task-row-toggle done" : "task-row-toggle"}
                    onClick={() => handleToggleCompleted(task.id)}
                  >
                    {task.completed ? <CircleCheck size={18} /> : <Circle size={18} />}
                  </button>
                  <button
                    type="button"
                    className="task-row-select"
                    onClick={() => actions.selectTask(task.id)}
                  >
                    <span className={task.completed ? "task-row-main completed" : "task-row-main"}>
                      <strong>{task.title}</strong>
                      <span>{task.estimateMinutes} min</span>
                    </span>
                    <span className="task-row-detail">
                      {task.priority ? priorityLabel(task.priority) : "No priority"}
                    </span>
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-panel tasks-empty">
                <strong>No tasks captured yet.</strong>
                <p className="empty-copy">Agrega tareas desde el widget y aquí quedarán listas para refinar.</p>
              </div>
            )}
          </div>
        </div>

        <div className="tasks-pane">
          <div className="section-heading">
            <span className="section-label">Details</span>
            <p className="section-copy">Mantén el editor simple: título arriba, detalles debajo.</p>
          </div>

          {selectedTask ? (
            <div className="tasks-detail-stack">
              <label className="field">
                <span className="field-label">Task</span>
                <input
                  className="text-input"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.currentTarget.value)}
                />
              </label>

              <div className="tasks-detail-grid">
                <label className="field">
                  <span className="field-label">Time (min)</span>
                  <input
                    className={estimateInvalid ? "text-input invalid" : "text-input"}
                    inputMode="numeric"
                    value={estimateValue}
                    onChange={handleEstimateChange}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Priority</span>
                  <select
                    className="widget-select"
                    value={priority ?? ""}
                    onChange={(event) => setPriority(parsePriority(event.currentTarget.value))}
                  >
                    <option value="">Optional</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
              </div>

              {estimateInvalid ? (
                <p className="validation-copy">
                  Time must be at least {MIN_WIDGET_ESTIMATE_MINUTES} minutes.
                </p>
              ) : null}

              <div className="tasks-detail-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    selectedTask && actions.toggleTaskCompleted(selectedTask.id)
                  }
                >
                  {selectedTask.completed ? "Mark pending" : "Mark done"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  Save details
                </button>
                <button
                  type="button"
                  className="ghost-button warning"
                  onClick={handleDelete}
                >
                  Remove task
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-panel tasks-empty">
              <strong>Select a task.</strong>
              <p className="empty-copy">El editor se activa cuando eliges una tarea del listado.</p>
            </div>
          )}
        </div>
      </section>
    </section>
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
