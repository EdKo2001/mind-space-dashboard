import { FIXTURE_NOW, resolveDateRange } from "./date-range.ts";
import type { DateRange, RangeQuery } from "./date-range.ts";
export type Scenario =
  "normal" | "empty" | "error" | "slow" | "partial" | "large" | "refresh-error";
export type Session = {
  id: string;
  type: "paid" | "trial";
  remaining: number;
  answers: number;
  status: "Connected" | "Reconnecting";
  platform: "iOS" | "Android" | "Web";
  latency: number;
  startedAt: string;
};
export type MetricKey =
  | "connected"
  | "reconnecting"
  | "peak"
  | "voiceP95"
  | "failedPercent"
  | "spend";
export type Comparison = { previous: number | null; label: string };
export type Dashboard = {
  comparisons: Record<MetricKey, Comparison>;
  source: "mock" | "api" | "db-demo";
  unavailable: Record<string, string>;
  health:
    | {
        name: string;
        status: "Operational" | "Degraded" | "Delayed" | "Unknown";
      }[]
    | null;
  alerts: { title: string; detail: string }[] | null;
  forecast: number | null;
  capturedAt: string;
  range: DateRange;
  granularity: "intraday" | "daily";
  connected: number | null;
  reconnecting: number | null;
  peak: number | null;
  peakAt: string | null;
  voiceP95: number | null;
  failedPercent: number | null;
  spend: number | null;
  capacity: number | null;
  completed: number | null;
  avgAnswers: number | null;
  avgDuration: number | null;
  queueDepth: number | null;
  queueOldest: number | null;
  concurrency: { at: string; count: number | null }[] | null;
  sessions: Session[] | null;
};
const sessions: Session[] = [
  {
    id: "S-7F3A9C",
    type: "paid",
    remaining: 18,
    answers: 28,
    status: "Connected",
    platform: "iOS",
    latency: 2.6,
    startedAt: "2026-10-14T04:18:00Z",
  },
  {
    id: "S-K4D2M1",
    type: "paid",
    remaining: 7,
    answers: 32,
    status: "Connected",
    platform: "Android",
    latency: 2.8,
    startedAt: "2026-10-14T04:07:00Z",
  },
  {
    id: "S-P9V8Q2",
    type: "trial",
    remaining: 3,
    answers: 12,
    status: "Reconnecting",
    platform: "Web",
    latency: 3.9,
    startedAt: "2026-10-14T04:38:00Z",
  },
  {
    id: "S-M6Z1T4",
    type: "paid",
    remaining: 1,
    answers: 40,
    status: "Connected",
    platform: "iOS",
    latency: 2.1,
    startedAt: "2026-10-14T04:01:00Z",
  },
  {
    id: "S-L3X7N9",
    type: "trial",
    remaining: 6,
    answers: 8,
    status: "Connected",
    platform: "iOS",
    latency: 1.8,
    startedAt: "2026-10-14T04:41:00Z",
  },
  {
    id: "S-H8C2D5",
    type: "paid",
    remaining: 20,
    answers: 26,
    status: "Reconnecting",
    platform: "Android",
    latency: 4.1,
    startedAt: "2026-10-14T04:20:00Z",
  },
];
export function mockSnapshot(query: RangeQuery, empty: boolean): Dashboard {
  const range = resolveDateRange(query);
  const start = Date.parse(range.start),
    end = Date.parse(range.end);
  const intraday = range.calendarDays === 1;
  const sampleCount = intraday ? 24 : Math.min(range.calendarDays, 366);
  const concurrency = Array.from({ length: sampleCount }, (_, i) => ({
    at: new Date(start + ((end - start) * i) / (sampleCount - 1)).toISOString(),
    count: empty
      ? 0
      : intraday
        ? Math.round(20 + 164 * Math.sin((i / 23) * Math.PI) ** 2)
        : 130 + ((i * 17) % 55),
  }));
  // The current fixture's final intraday sample matches the current connection snapshot.
  if (intraday && end === Date.parse(FIXTURE_NOW) && !empty)
    concurrency[sampleCount - 1].count = 128;
  const peak = Math.max(...concurrency.map((sample) => sample.count));
  const dayEquivalent = (end - start) / 86400000;
  return {
    comparisons: {
      connected: {
        previous: empty ? 0 : 114,
        label: "vs snapshot 15 min earlier",
      },
      reconnecting: {
        previous: empty ? 0 : 5,
        label: "vs snapshot 15 min earlier",
      },
      peak: {
        previous: empty ? 0 : Math.round(peak / 1.06),
        label:
          query.period === "today"
            ? "vs yesterday at the same time"
            : "vs previous range · matched time",
      },
      voiceP95: {
        previous: empty ? null : 3.4,
        label:
          query.period === "today"
            ? "vs yesterday at the same time"
            : "vs previous range · matched time",
      },
      failedPercent: {
        previous: empty ? null : 1.1,
        label:
          query.period === "today"
            ? "vs yesterday at the same time"
            : "vs previous range · matched time",
      },
      spend: {
        previous: empty
          ? 0
          : Number(((86.4 * dayEquivalent) / 1.12).toFixed(2)),
        label:
          query.period === "today"
            ? "vs yesterday at the same time"
            : "vs previous range · matched time",
      },
    },
    health: [
      { name: "API gateway", status: "Operational" },
      { name: "Voice service", status: "Operational" },
      { name: "AI inference", status: "Degraded" },
      { name: "Queue system", status: "Delayed" },
    ],
    alerts: empty
      ? []
      : [
          {
            title: "Inference latency elevated",
            detail:
              "Sample voice p95 is 2.8s against an illustrative 2.0s target.",
          },
          {
            title: "A session has 1 minute left",
            detail: "Sample remaining time is shown in the session table.",
          },
        ],
    forecast: empty ? 0 : 2592,
    unavailable: {},
    source: "mock",
    capturedAt: FIXTURE_NOW,
    range,
    granularity: intraday ? "intraday" : "daily",
    connected: empty ? 0 : 128,
    reconnecting: empty ? 0 : 8,
    peak,
    peakAt: concurrency.find((sample) => sample.count === peak)!.at,
    voiceP95: empty ? null : 2.8,
    failedPercent: empty ? null : 1.4,
    spend: empty ? 0 : Number((86.4 * dayEquivalent).toFixed(2)),
    capacity: 250,
    completed: empty ? 0 : Math.round(742 * dayEquivalent),
    avgAnswers: empty ? null : 24,
    avgDuration: empty ? null : 31,
    queueDepth: empty ? 0 : 18,
    queueOldest: empty ? 0 : 8,
    concurrency,
    sessions: empty ? [] : structuredClone(sessions),
  };
}
/** Local async fixture adapter. Replace with backend fetching when endpoints exist.
 * No HTTP requests, tracking, persistence, or real session actions. */
export function fetchDashboard(
  query: RangeQuery,
  scenario: Scenario,
  signal: AbortSignal,
): Promise<Dashboard> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(
      () => {
        signal.removeEventListener("abort", abort);
        if (scenario === "error" || scenario === "refresh-error")
          reject(
            new Error("The mock request failed. No backend is connected."),
          );
        else {
          try {
            const result = mockSnapshot(query, scenario === "empty");
            if (scenario === "partial") {
              result.voiceP95 = null;
              result.spend = null;
              result.peak = null;
              result.peakAt = null;
              result.capacity = null;
              result.health = null;
              result.alerts = null;
              result.forecast = null;
              result.sessions = null;
              result.avgAnswers = null;
              result.concurrency = null;
            }
            if (scenario === "large") {
              result.connected = 1540;
              result.capacity = 1800;
              result.peak = 2300;
              result.concurrency = [
                { at: result.range.start, count: 450 },
                {
                  at: new Date(
                    (Date.parse(result.range.start) +
                      Date.parse(result.range.end)) /
                      2,
                  ).toISOString(),
                  count: null,
                },
                { at: result.range.end, count: 2300 },
              ];
              result.peakAt = result.range.end;
            }
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      },
      scenario === "slow" ? 2500 : 650,
    );
    signal.addEventListener("abort", abort, { once: true });
  });
}
