import assert from "node:assert/strict";
import test from "node:test";
import { createWidgetTask } from "../features/widget/widget.model.ts";
import {
  buildStartTaskTransition,
  createStartupWidgetDraftState,
  parseWidgetPrioritySelection,
  sanitizeStartupWidgetEstimateInput,
} from "../features/widget/useStartupWidgetController.ts";

test("startup widget draft state accepts a valid quick-capture task", () => {
  const draft = createStartupWidgetDraftState({
    estimateValue: "25",
    taskTitle: "Draft proposal",
  });

  assert.equal(draft.canAddTask, true);
  assert.equal(draft.estimateInvalid, false);
  assert.equal(draft.parsedEstimate, 25);
});

test("startup widget draft state blocks estimates below the minimum", () => {
  const draft = createStartupWidgetDraftState({
    estimateValue: "3",
    taskTitle: "Tiny task",
  });

  assert.equal(draft.canAddTask, false);
  assert.equal(draft.estimateInvalid, true);
});

test("startup widget start transition consumes the task and creates a handoff action", () => {
  const firstTask = createWidgetTask(
    {
      title: "Review pipeline",
      estimateMinutes: 25,
      priority: "high",
      tag: "Operations",
    },
    { id: "first", createdAt: "2026-04-11T10:00:00.000Z" },
  );
  const secondTask = createWidgetTask(
    {
      title: "Clean notes",
      estimateMinutes: 15,
      priority: "low",
      tag: "Admin",
    },
    { id: "second", createdAt: "2026-04-11T09:00:00.000Z" },
  );

  const transition = buildStartTaskTransition(
    {
      tasks: [firstTask, secondTask],
      selectedTaskId: "first",
    },
    "first",
  );

  assert.deepEqual(transition.pendingAction, {
    type: "start-task",
    payload: {
      title: "Review pipeline",
      duration: 25,
    },
  });
  assert.deepEqual(
    transition.nextState.tasks.map((task) => task.id),
    ["second"],
  );
});

test("startup widget start transition ignores completed tasks and sanitizes inputs", () => {
  const completedTask = {
    ...createWidgetTask(
      {
        title: "Done already",
        estimateMinutes: 25,
        priority: "medium",
        tag: "Strategy",
      },
      { id: "done", createdAt: "2026-04-11T10:00:00.000Z" },
    ),
    completed: true,
  };

  const transition = buildStartTaskTransition(
    {
      tasks: [completedTask],
      selectedTaskId: "done",
    },
    "done",
  );

  assert.equal(transition.pendingAction, null);
  assert.equal(sanitizeStartupWidgetEstimateInput("2h 5m"), "25");
  assert.equal(parseWidgetPrioritySelection("optional"), null);
});
