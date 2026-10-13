import { test } from "node:test";
import assert from "node:assert/strict";
import { metricTrend } from "../src/data/trend.ts";
test("Direction stays literal while health colors reflect the metric meaning", () => {
  assert.deepEqual(metricTrend(120, 100, true), {
    direction: "up",
    tone: "positive",
    text: "+20.0%",
  });
  assert.deepEqual(metricTrend(120, 100, false), {
    direction: "up",
    tone: "negative",
    text: "+20.0%",
  });
  assert.deepEqual(metricTrend(80, 100, false), {
    direction: "down",
    tone: "positive",
    text: "−20.0%",
  });
  assert.equal(metricTrend(80, 100, true).tone, "negative");
});
test("Rate changes are percentage points; missing and zero baselines are explicit", () => {
  assert.equal(metricTrend(1.4, 1.1, false, "points").text, "+0.3 pp");
  assert.equal(metricTrend(0, 0, true).text, "No change");
  assert.equal(metricTrend(10, 0, true).text, "New activity");
  assert.equal(metricTrend(null, 10, true).text, "Comparison unavailable");
  assert.equal(metricTrend(10, null, true).tone, "neutral");
});
