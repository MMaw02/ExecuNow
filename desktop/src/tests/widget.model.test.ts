import assert from "node:assert/strict";
import test from "node:test";
import {
  filterWidgetTasks,
  consumeSelectedWidgetTask,
  createWidgetTask,
  createEmptyWidgetState,
  insertWidgetTask,
  normalizeWidgetState,
  toggleWidgetTaskCompleted,
  updateWidgetTask,
} from "../features/widget/widget.model.ts";

test("widget tasks are normalized by priority and most recent time", () => {
  const normalized = normalizeWidgetState({
    tasks: [
      createWidgetTask(
        {
          title: "Low priority follow-up",
          estimateMinutes: 15,
          priority: "low",
          tag: "Operations",
        },
        { id: "low", createdAt: "2026-04-11T08:00:00.000Z" },
      ),
      createWidgetTask(
        {
          title: "High priority brief",
          estimateMinutes: 20,
          priority: "high",
          tag: "Strategy",
        },
        { id: "high", createdAt: "2026-04-11T07:00:00.000Z" },
      ),
      createWidgetTask(
        {
          title: "Medium priority review",
          estimateMinutes: 25,
          priority: "medium",
          tag: "Product",
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

test("widget tasks normalize missing tag values from older storage", () => {
  const normalized = normalizeWidgetState({
    tasks: [
      {
        id: "legacy",
        title: "Legacy task",
        estimateMinutes: 25,
        priority: "medium",
        completed: false,
        createdAt: "2026-04-11T07:00:00.000Z",
      },
    ],
  });

  assert.equal(normalized.tasks[0]?.tag, null);
});

test("inserting a widget task selects it immediately", () => {
  const emptyState = createEmptyWidgetState();
  const nextTask = createWidgetTask(
    {
      title: "Capture daily priorities",
      estimateMinutes: 25,
      priority: "medium",
      tag: "Operations",
    },
    { id: "task-1", createdAt: "2026-04-11T10:00:00.000Z" },
  );

  const nextState = insertWidgetTask(emptyState, nextTask);

  assert.equal(nextState.tasks.length, 1);
  assert.equal(nextState.selectedTaskId, "task-1");
  assert.equal(nextState.tasks[0]?.tag, "Operations");
});

test("completed widget tasks move after pending tasks", () => {
  const firstTask = createWidgetTask(
    {
      title: "First task",
      estimateMinutes: 25,
      priority: "high",
      tag: "Strategy",
    },
    { id: "first", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const secondTask = createWidgetTask(
    {
      title: "Second task",
      estimateMinutes: 15,
      priority: "medium",
      tag: "Operations",
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
      tag: "Strategy",
    },
    { id: "first", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const secondTask = createWidgetTask(
    {
      title: "Second task",
      estimateMinutes: 15,
      priority: "medium",
      tag: "Operations",
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

test("updating a widget task keeps it selected and stores the tag", () => {
  const firstTask = createWidgetTask(
    {
      title: "Inbox cleanup",
      estimateMinutes: 15,
      priority: "low",
      tag: "Admin",
    },
    { id: "first", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const secondTask = createWidgetTask(
    {
      title: "Quarterly review",
      estimateMinutes: 25,
      priority: "medium",
      tag: "Finance",
    },
    { id: "second", createdAt: "2026-04-11T11:00:00.000Z" },
  );

  const nextState = updateWidgetTask(
    {
      tasks: [firstTask, secondTask],
      selectedTaskId: "first",
    },
    "first",
    {
      title: "Quarterly review follow-up",
      estimateMinutes: 30,
      priority: "high",
      tag: "Strategy",
    },
  );

  assert.equal(nextState.selectedTaskId, "first");
  assert.equal(nextState.tasks[0]?.id, "first");
  assert.equal(nextState.tasks[0]?.tag, "Strategy");
  assert.equal(nextState.tasks[0]?.estimateMinutes, 30);
});

test("task filters split planned and completed tasks for the inventory", () => {
  const pendingTask = createWidgetTask(
    {
      title: "Pending task",
      estimateMinutes: 25,
      priority: "high",
      tag: "Strategy",
    },
    { id: "pending", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const completedTask = {
    ...createWidgetTask(
      {
        title: "Completed task",
        estimateMinutes: 15,
        priority: "low",
        tag: "Admin",
      },
      { id: "completed", createdAt: "2026-04-11T09:00:00.000Z" },
    ),
    completed: true,
  };

  assert.deepEqual(
    filterWidgetTasks([pendingTask, completedTask], "planned").map((task) => task.id),
    ["pending"],
  );
  assert.deepEqual(
    filterWidgetTasks([pendingTask, completedTask], "completed").map((task) => task.id),
    ["completed"],
  );
  assert.deepEqual(
    filterWidgetTasks([pendingTask, completedTask], "all").map((task) => task.id),
    ["pending", "completed"],
  );
});
