import assert from "node:assert/strict";
import test from "node:test";
import {
  addWebBlockEntry,
  createWebBlockEntry,
  normalizeWebBlockingSettings,
  removeWebBlockEntry,
} from "../features/blocking/web-blocking.model.ts";
import {
  readWebBlockingSettings,
  WEB_BLOCKING_SETTINGS_STORAGE_KEY,
  writeWebBlockingSettings,
} from "../features/blocking/web-blocking.storage.ts";

test("web blocking normalizes a full url into root and www hosts", () => {
  const result = createWebBlockEntry(
    "https://www.youtube.com/watch?v=abc123",
    new Date("2026-04-17T10:00:00.000Z"),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.entry.normalizedDomain, "youtube.com");
  assert.deepEqual(result.entry.derivedHosts, ["youtube.com", "www.youtube.com"]);
  assert.equal(result.entry.rawInput, "https://www.youtube.com/watch?v=abc123");
});

test("web blocking rejects duplicate normalized domains", () => {
  const initialResult = addWebBlockEntry(
    normalizeWebBlockingSettings(null),
    "youtube.com",
    new Date("2026-04-17T10:00:00.000Z"),
  );

  assert.equal(initialResult.ok, true);

  const duplicateResult = addWebBlockEntry(
    initialResult.settings,
    "https://www.youtube.com/watch?v=abc123",
    new Date("2026-04-17T10:01:00.000Z"),
  );

  assert.equal(duplicateResult.ok, false);
  assert.equal(duplicateResult.error, "This site is already armed for blocking.");
});

test("web blocking rejects localhost, ips, and path-only values", () => {
  assert.equal(createWebBlockEntry("localhost").ok, false);
  assert.equal(createWebBlockEntry("127.0.0.1").ok, false);
  assert.equal(createWebBlockEntry("youtube.com/feed").ok, false);
});

test("web blocking storage persists normalized entries", () => {
  const storage = new MemoryStorage();
  const settingsResult = addWebBlockEntry(
    normalizeWebBlockingSettings(null),
    "https://www.reddit.com/r/typescript",
    new Date("2026-04-17T11:00:00.000Z"),
  );

  assert.equal(settingsResult.ok, true);

  writeWebBlockingSettings(settingsResult.settings, storage);

  assert.deepEqual(readWebBlockingSettings(storage), {
    entries: [
      {
        ...settingsResult.entry,
        normalizedDomain: "reddit.com",
        derivedHosts: ["reddit.com", "www.reddit.com"],
      },
    ],
  });
});

test("web blocking storage falls back safely from invalid data", () => {
  const storage = new MemoryStorage();

  storage.setItem(
    WEB_BLOCKING_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      entries: [{ rawInput: "localhost", normalizedDomain: "localhost" }],
    }),
  );

  assert.deepEqual(readWebBlockingSettings(storage), {
    entries: [],
  });
});

test("web blocking entries can be removed by id", () => {
  const firstResult = addWebBlockEntry(
    normalizeWebBlockingSettings(null),
    "youtube.com",
    new Date("2026-04-17T10:00:00.000Z"),
  );
  const secondResult = addWebBlockEntry(
    firstResult.settings,
    "reddit.com",
    new Date("2026-04-17T10:01:00.000Z"),
  );

  assert.equal(secondResult.ok, true);

  const nextSettings = removeWebBlockEntry(secondResult.settings, firstResult.entry.id);

  assert.equal(nextSettings.entries.length, 1);
  assert.equal(nextSettings.entries[0]?.normalizedDomain, "reddit.com");
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
