import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveDateRange, FIXTURE_NOW } from "../src/data/date-range.ts";

test("Today is calendar midnight to now in the selected timezone", () => {
  const chicago = resolveDateRange({
    period: "today",
    timezone: "America/Chicago",
  });
  assert.equal(chicago.start, "2026-10-13T05:00:00.000Z");
  assert.equal(chicago.end, new Date(FIXTURE_NOW).toISOString());
  const utc = resolveDateRange({ period: "today", timezone: "UTC" });
  assert.equal(utc.start, "2026-10-14T00:00:00.000Z");
  assert.equal(utc.calendarDays, 1);
});
test("Calendar presets include today and exactly the requested number of dates", () => {
  for (const [period, days] of [
    ["week", 7],
    ["30days", 30],
    ["90days", 90],
    ["360days", 360],
  ]) {
    const range = resolveDateRange({ period, timezone: "America/Chicago" });
    assert.equal(range.calendarDays, days);
    assert.equal(range.end, new Date(FIXTURE_NOW).toISOString());
  }
});
test("Custom end date is inclusive and DST days keep their actual length", () => {
  for (const [date, hours, now] of [
    ["2026-03-08", 23, "2026-03-10T12:00:00Z"],
    ["2026-11-01", 25, "2026-11-03T12:00:00Z"],
  ]) {
    const range = resolveDateRange(
      {
        period: "custom",
        timezone: "America/Chicago",
        startDate: date,
        endDate: date,
      },
      now,
    );
    assert.equal(
      (Date.parse(range.end) - Date.parse(range.start)) / 3600000,
      hours,
    );
  }
});
test("Custom input rejects invalid dates, reversed ranges, future dates", () => {
  for (const [startDate, endDate] of [
    ["2026-02-30", "2026-03-01"],
    ["2026-10-13", "2026-10-12"],
    ["2026-10-13", "2026-10-14"],
  ]) {
    assert.throws(() =>
      resolveDateRange({
        period: "custom",
        timezone: "America/Chicago",
        startDate,
        endDate,
      }),
    );
  }
});
