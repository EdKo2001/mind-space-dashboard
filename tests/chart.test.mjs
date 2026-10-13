import { test } from "node:test";
import assert from "node:assert/strict";
import { chartSamples, chartCeiling } from "../src/data/chart.ts";
test("Charts accept no data, one point, missing gaps, unsorted and duplicated timestamps", () => {
  assert.equal(chartCeiling([], null), 5);
  const p = chartSamples([
    { at: "2026-10-13T02:00Z", count: null },
    { at: "bad", count: 2 },
    { at: "2026-10-13T01:00Z", count: 1 },
    { at: "2026-10-13T01:00Z", count: 3 },
  ]);
  assert.deepEqual(
    p.map((p) => p.count),
    [3, null],
  );
  assert.ok(chartCeiling(p, 1800) > 1800);
  assert.equal(chartSamples([{ at: "2026-10-13T00:00Z", count: 0 }]).length, 1);
});
test("Large series bound DOM work while retaining the maximum and explicit gaps", () => {
  const data = Array.from({ length: 10000 }, (_, i) => ({
    at: new Date(1700000000000 + i * 1000).toISOString(),
    count: i === 5432 ? 100000 : i === 1000 ? null : i % 100,
  }));
  const result = chartSamples(data);
  assert.ok(result.length <= 500);
  assert.ok(result.some((p) => p.count === 100000));
  assert.ok(result.some((p) => p.count === null));
  assert.ok(chartCeiling(result, 250) > 100000);
});
