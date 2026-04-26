import assert from "node:assert/strict";
import test from "node:test";
import { createSessionWidgetSnapshotChannel } from "../features/session/session-widget.channel.ts";
import { SESSION_WIDGET_SNAPSHOT_STORAGE_KEY } from "../features/session/session-widget.storage.ts";

test("session widget channel bootstraps from storage and publishes live snapshot updates", async () => {
  const storage = new MemoryStorage();
  const fakeWindow = new FakeWindow(storage);
  const restoreWindow = installWindow(fakeWindow);
  const channel = createSessionWidgetSnapshotChannel(storage);
  const received: string[] = [];

  try {
    storage.setItem(
      SESSION_WIDGET_SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        view: "active",
        sessionTask: "Boot from storage",
        sessionDuration: 25,
        remainingSeconds: 1200,
        sessionPhase: "focus",
        isPaused: false,
        pauseUsed: false,
        strictBlocking: true,
      }),
    );

    const initialSnapshot = channel.readInitialSnapshot();
    const dispose = channel.subscribeSnapshot("session-widget", (snapshot) => {
      received.push(snapshot.sessionTask);
    });

    await channel.publishSnapshot(
      {
        ...initialSnapshot,
        sessionTask: "Live update",
      },
      "main",
    );
    dispose();

    assert.equal(initialSnapshot.sessionTask, "Boot from storage");
    assert.deepEqual(received, ["Live update"]);
  } finally {
    restoreWindow();
  }
});

test("session widget channel publishes control events and keeps structural snapshot persistence cheap", async () => {
  const storage = new MemoryStorage();
  const fakeWindow = new FakeWindow(storage);
  const restoreWindow = installWindow(fakeWindow);
  const channel = createSessionWidgetSnapshotChannel(storage);
  const receivedControls: string[] = [];

  try {
    const dispose = channel.subscribeControl("main", (payload) => {
      receivedControls.push(payload.control);
    });

    await channel.publishSnapshot(
      {
        view: "active",
        sessionTask: "Deep work",
        sessionDuration: 25,
        remainingSeconds: 1200,
        sessionPhase: "focus",
        isPaused: false,
        pauseUsed: false,
        strictBlocking: true,
      },
      "main",
    );
    const firstPersisted = storage.getItem(SESSION_WIDGET_SNAPSHOT_STORAGE_KEY);

    await channel.publishSnapshot(
      {
        view: "active",
        sessionTask: "Deep work",
        sessionDuration: 25,
        remainingSeconds: 1199,
        sessionPhase: "focus",
        isPaused: false,
        pauseUsed: false,
        strictBlocking: true,
      },
      "main",
    );
    const secondPersisted = storage.getItem(SESSION_WIDGET_SNAPSHOT_STORAGE_KEY);

    await channel.publishControl("toggle-pause", "session-widget");
    dispose();

    assert.equal(firstPersisted, secondPersisted);
    assert.deepEqual(receivedControls, ["toggle-pause"]);
  } finally {
    restoreWindow();
  }
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

class FakeWindow extends EventTarget {
  readonly localStorage: Storage;

  constructor(localStorage: Storage) {
    super();
    this.localStorage = localStorage;
  }
}

function installWindow(fakeWindow: FakeWindow) {
  const originalWindow = globalThis.window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow,
  });

  return () => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window }).window;
      return;
    }

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  };
}
