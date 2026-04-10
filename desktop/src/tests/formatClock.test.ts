import assert from "node:assert/strict";
import test from "node:test";
import { formatClock } from "../shared/utils/formatClock.ts";

test("formatClock pads minutes and seconds", () => {
  assert.equal(formatClock(65), "01:05");
});

test("formatClock never returns negative values", () => {
  assert.equal(formatClock(-5), "00:00");
});
