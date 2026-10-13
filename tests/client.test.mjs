import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { mockSnapshot } from "../src/data/dashboard.ts";
import { parseDashboard, requestDashboard } from "../src/data/client.ts";
import { FIXTURE_NOW } from "../src/data/date-range.ts";
const query = { period: "today", timezone: "America/Chicago" };
const payload = () => ({ ...mockSnapshot(query, false), version: 1 });
test("Missing measurements stay unavailable; malformed numbers/ranges fail explicitly", () => {
  const p = payload();
  delete p.spend;
  delete p.sessions;
  delete p.health;
  delete p.comparisons;
  const parsed = parseDashboard(p, query, FIXTURE_NOW);
  assert.equal(parsed.spend, null);
  assert.equal(parsed.sessions, null);
  assert.equal(parsed.health, null);
  assert.equal(parsed.comparisons.spend.previous, null);
  assert.throws(() =>
    parseDashboard({ ...payload(), voiceP95: "2.8" }, query, FIXTURE_NOW),
  );
  assert.throws(() =>
    parseDashboard(
      { ...payload(), range: { start: FIXTURE_NOW, end: FIXTURE_NOW } },
      query,
      FIXTURE_NOW,
    ),
  );
  assert.throws(() =>
    parseDashboard({ ...payload(), failedPercent: 101 }, query, FIXTURE_NOW),
  );
});
test("Actual HTTP adapter sends UTC boundaries and accepts changing snapshots", async (t) => {
  let revision = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    assert.equal(url.searchParams.get("start"), "2026-10-13T05:00:00.000Z");
    assert.equal(url.searchParams.get("timezone"), "America/Chicago");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ...payload(), connected: ++revision }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const endpoint = `http://127.0.0.1:${server.address().port}/dashboard`;
  const signal = new AbortController().signal;
  assert.equal(
    (await requestDashboard(endpoint, query, signal, fetch, FIXTURE_NOW))
      .connected,
    1,
  );
  assert.equal(
    (await requestDashboard(endpoint, query, signal, fetch, FIXTURE_NOW))
      .connected,
    2,
  );
});
test("HTTP failures, aborts, and timeouts remain retryable", async () => {
  await assert.rejects(
    requestDashboard(
      "http://localhost/api",
      query,
      new AbortController().signal,
      async () => new Response("", { status: 503 }),
      FIXTURE_NOW,
    ),
    /503/,
  );
  const hanging = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      if (signal.aborted) reject(new DOMException("Aborted", "AbortError"));
      else
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
    });
  await assert.rejects(
    requestDashboard(
      "http://localhost/api",
      query,
      new AbortController().signal,
      hanging,
      FIXTURE_NOW,
      10,
    ),
    /timed out/,
  );
  const c = new AbortController();
  c.abort();
  await assert.rejects(
    requestDashboard(
      "http://localhost/api",
      query,
      c.signal,
      hanging,
      FIXTURE_NOW,
    ),
    { name: "AbortError" },
  );
});

test("Backend unavailable reasons are allowlisted; lifecycle diagnostics never become presence", () => {
  const p = {
    ...payload(),
    connected: null,
    reconnecting: null,
    unavailable: {
      connected: "Presence is not configured",
      privateContent: "Never expose",
    },
    diagnostics: { activeSessions: 42 },
  };
  const parsed = parseDashboard(p, query, FIXTURE_NOW);
  assert.equal(parsed.connected, null);
  assert.equal(parsed.unavailable.connected, "Presence is not configured");
  assert.equal(parsed.unavailable.privateContent, undefined);
  assert.throws(
    () =>
      parseDashboard(
        p,
        {
          period: "custom",
          timezone: "America/Chicago",
          startDate: "2024-01-01",
          endDate: "2026-10-13",
        },
        FIXTURE_NOW,
      ),
    /366/,
  );
});

test("Database demo responses keep the synthetic marker instead of appearing as live metrics", () => {
  const parsed = parseDashboard({ ...payload(), synthetic: true, profile: "db-demo-v1" }, query, FIXTURE_NOW);
  assert.equal(parsed.source, "db-demo");
  assert.equal(parseDashboard(payload(), query, FIXTURE_NOW).source, "api");
});
