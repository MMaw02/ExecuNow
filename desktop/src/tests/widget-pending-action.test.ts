import assert from "node:assert/strict";
import test from "node:test";
import {
  createWidgetPendingActionStore,
  parseWidgetPendingAction,
  WIDGET_PENDING_ACTION_STORAGE_KEY,
} from "../features/widget/widget.pending-action.ts";

test("widget pending action store persists and consumes actions only once", () => {
  const storage = new MemoryStorage();
  const store = createWidgetPendingActionStore(storage);

  store.setPendingAction({
    type: "start-task",
    payload: {
      title: "Ship changes",
      duration: 25,
    },
  });

  assert.deepEqual(store.consumePendingAction(), {
    type: "start-task",
    payload: {
      title: "Ship changes",
      duration: 25,
    },
  });
  assert.equal(store.consumePendingAction(), null);
  assert.equal(storage.getItem(WIDGET_PENDING_ACTION_STORAGE_KEY), null);
});

test("widget pending action parsing ignores invalid payloads", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    WIDGET_PENDING_ACTION_STORAGE_KEY,
    JSON.stringify({
      type: "start-task",
      payload: { title: 42, duration: "bad" },
    }),
  );

  const store = createWidgetPendingActionStore(storage);

  assert.equal(store.consumePendingAction(), null);
  assert.equal(parseWidgetPendingAction({ type: "open-tasks" })?.type, "open-tasks");
  assert.equal(parseWidgetPendingAction({ type: "unknown" }), null);
});

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }

  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.entries.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.entries.delete(key);
  }

  setItem(key: string, value: string) {
    this.entries.set(key, value);
  }
}
