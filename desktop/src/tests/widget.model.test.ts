import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeSelectedWidgetTask,
  createWidgetTask,
  createEmptyWidgetState,
  insertWidgetTask,
  normalizeWidgetState,
  toggleWidgetTaskCompleted,
} from "../features/widget/widget.model.ts";

test("widget tasks are normalized by priority and most recent time", () => {
  const normalized = normalizeWidgetState({
    tasks: [
      createWidgetTask(
        {
          title: "Low priority follow-up",
          estimateMinutes: 15,
          priority: "low",
        },
        { id: "low", createdAt: "2026-04-11T08:00:00.000Z" },
      ),
      createWidgetTask(
        {
          title: "High priority brief",
          estimateMinutes: 20,
          priority: "high",
        },
        { id: "high", createdAt: "2026-04-11T07:00:00.000Z" },
      ),
      createWidgetTask(
        {
          title: "Medium priority review",
          estimateMinutes: 25,
          priority: "medium",
        },
        { id: "medium", createdAt: "2026-04-11T09:00:00.000Z" },
      ),
    ],
    selectedTaskId: "missing",
  });

  assert.deepEqual(
    normalized.tasks.map((task) => task.id),
    ["high", "medium", "low"],
  );
  assert.equal(normalized.selectedTaskId, "high");
});

test("inserting a widget task selects it immediately", () => {
  const emptyState = createEmptyWidgetState();
  const nextTask = createWidgetTask(
    {
      title: "Capture daily priorities",
      estimateMinutes: 25,
      priority: "medium",
    },
    { id: "task-1", createdAt: "2026-04-11T10:00:00.000Z" },
  );

  const nextState = insertWidgetTask(emptyState, nextTask);

  assert.equal(nextState.tasks.length, 1);
  assert.equal(nextState.selectedTaskId, "task-1");
});

test("completed widget tasks move after pending tasks", () => {
  const firstTask = createWidgetTask(
    {
      title: "First task",
      estimateMinutes: 25,
      priority: "high",
    },
    { id: "first", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const secondTask = createWidgetTask(
    {
      title: "Second task",
      estimateMinutes: 15,
      priority: "medium",
    },
    { id: "second", createdAt: "2026-04-11T09:00:00.000Z" },
  );

  const nextState = toggleWidgetTaskCompleted(
    {
      tasks: [firstTask, secondTask],
      selectedTaskId: "first",
    },
    "first",
  );

  assert.deepEqual(
    nextState.tasks.map((entry) => entry.id),
    ["second", "first"],
  );
  assert.equal(nextState.tasks[1]?.completed, true);
});

test("starting from the widget consumes the selected task and advances selection", () => {
  const firstTask = createWidgetTask(
    {
      title: "First task",
      estimateMinutes: 25,
      priority: "high",
    },
    { id: "first", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const secondTask = createWidgetTask(
    {
      title: "Second task",
      estimateMinutes: 15,
      priority: "medium",
    },
    { id: "second", createdAt: "2026-04-11T09:00:00.000Z" },
  );
  const initialState = {
    tasks: [firstTask, secondTask],
    selectedTaskId: "first",
  };

  const { task, nextState } = consumeSelectedWidgetTask(initialState);

  assert.equal(task?.id, "first");
  assert.deepEqual(
    nextState.tasks.map((entry) => entry.id),
    ["second"],
  );
  assert.equal(nextState.selectedTaskId, "second");
});
