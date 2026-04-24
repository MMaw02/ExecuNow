import assert from "node:assert/strict";
import test from "node:test";
import {
  prepareBlockingForSession,
  releaseBlockingAfterSession,
  type SessionBlockingRuntime,
} from "../features/session/session-blocking.ts";
import {
  writeWebBlockingSettings,
} from "../features/blocking/web-blocking.storage.ts";
import type { SessionState } from "../features/session/session.types.ts";

test("strict session applies blocking before start when domains exist", async () => {
  const storage = new MemoryStorage();
  const applyCalls: string[][] = [];

  writeWebBlockingSettings(
    {
      entries: [
        {
          id: "youtube",
          rawInput: "youtube.com",
          normalizedDomain: "youtube.com",
          derivedHosts: ["youtube.com", "www.youtube.com"],
          createdAt: "2026-04-17T10:00:00.000Z",
        },
      ],
    },
    storage,
  );

  const result = await prepareBlockingForSession(
    createSessionState({ strictBlocking: true }),
    {
      apply(domains) {
        applyCalls.push(domains);

        return Promise.resolve({
          applied: true,
          provider: "hosts",
          blockedDomains: domains,
          blockedHosts: ["youtube.com", "www.youtube.com"],
        });
      },
      clear() {
        return Promise.resolve();
      },
    },
    storage,
  );

  assert.deepEqual(applyCalls, [["youtube.com"]]);
  assert.equal(result.ok, true);
  assert.equal(result.applied, true);
});

test("strict session fails cleanly when the runtime rejects apply", async () => {
  const storage = new MemoryStorage();

  writeWebBlockingSettings(
    {
      entries: [
        {
          id: "youtube",
          rawInput: "youtube.com",
          normalizedDomain: "youtube.com",
          derivedHosts: ["youtube.com", "www.youtube.com"],
          createdAt: "2026-04-17T10:00:00.000Z",
        },
      ],
    },
    storage,
  );

  const result = await prepareBlockingForSession(
    createSessionState({ strictBlocking: true }),
    {
      apply() {
        return Promise.reject(new Error("UAC denied"));
      },
      clear() {
        return Promise.resolve();
      },
    },
    storage,
  );

  assert.deepEqual(result, {
    ok: false,
    error: "UAC denied",
  });
});

test("relaxed sessions skip the blocking runtime entirely", async () => {
  let applyCalled = false;

  const result = await prepareBlockingForSession(
    createSessionState({ strictBlocking: false }),
    createRuntime({
      apply() {
        applyCalled = true;
        return Promise.resolve({
          applied: true,
          provider: "hosts",
          blockedDomains: ["youtube.com"],
          blockedHosts: ["youtube.com", "www.youtube.com"],
        });
      },
    }),
  );

  assert.equal(applyCalled, false);
  assert.deepEqual(result, {
    ok: true,
    applied: false,
    result: null,
  });
});

test("releasing blocking clears the runtime after a session", async () => {
  let clearCalled = false;

  const result = await releaseBlockingAfterSession(
    createRuntime({
      clear() {
        clearCalled = true;
        return Promise.resolve();
      },
    }),
  );

  assert.equal(clearCalled, true);
  assert.deepEqual(result, { ok: true });
});

test("releasing blocking reports clear failures", async () => {
  const result = await releaseBlockingAfterSession(
    createRuntime({
      clear() {
        return Promise.reject(new Error("hosts restore failed"));
      },
    }),
  );

  assert.deepEqual(result, {
    ok: false,
    error: "hosts restore failed",
  });
});

function createRuntime(overrides: Partial<SessionBlockingRuntime>): SessionBlockingRuntime {
  return {
    apply() {
      return Promise.resolve({
        applied: false,
        provider: "hosts",
        blockedDomains: [],
        blockedHosts: [],
      });
    },
    clear() {
      return Promise.resolve();
    },
    ...overrides,
  };
}

function createSessionState(overrides: Partial<SessionState>): SessionState {
  return {
    view: "today",
    taskTitle: "Draft walkthrough",
    selectedDuration: 25,
    strictBlocking: true,
    sessionTask: "",
    sessionDuration: 25,
    remainingSeconds: 1500,
    isPaused: false,
    pauseUsed: false,
    sessionResult: null,
    failureReason: "",
    stats: {
      completed: 0,
      incomplete: 0,
      abandoned: 0,
      focusMinutes: 0,
    },
    history: [],
    ...overrides,
  };
}

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
