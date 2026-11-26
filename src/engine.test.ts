import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  dayNumber,
  endDate,
  firstBrokenDate,
  isDayComplete,
  localDateString,
  prettyDate,
  weekdayIndex,
} from "./engine.ts";

test("local date uses the journey timezone, not UTC", () => {
  const evening = new Date("2026-11-27T01:30:00Z");
  assert.equal(localDateString(evening, "America/New_York"), "2026-11-26");
  assert.equal(localDateString(evening, "UTC"), "2026-11-27");
});

test("adding days stays on the calendar", () => {
  assert.equal(addDays("2026-11-26", 1), "2026-11-27");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-11-09", 74), "2027-01-22");
});

test("day number is the calendar position", () => {
  assert.equal(dayNumber("2026-11-09", "2026-11-09"), 1);
  assert.equal(dayNumber("2026-11-09", "2026-11-26"), 18);
  assert.equal(endDate("2026-11-09", 75), "2027-01-22");
});

test("pretty dates do not slip to the previous day", () => {
  assert.equal(prettyDate("2026-11-26"), "Thu, Nov 26");
});

test("weekday of a calendar date is stable", () => {
  assert.equal(weekdayIndex("2026-11-09"), 1);
  assert.equal(weekdayIndex("2026-11-26"), 4);
});

test("a hard miss is a past unfinished day, not today", () => {
  const days = {
    "2026-11-09": { done: { a: true } },
  };
  assert.equal(firstBrokenDate("2026-11-09", "2026-11-09", ["a"], days), null);
  assert.equal(firstBrokenDate("2026-11-09", "2026-11-10", ["a"], days), null);
  assert.equal(firstBrokenDate("2026-11-09", "2026-11-11", ["a"], days), "2026-11-10");
  assert.equal(isDayComplete(["a", "b"], { done: { a: true } }), false);
  assert.equal(isDayComplete(["a"], { done: { a: true } }), true);
});
