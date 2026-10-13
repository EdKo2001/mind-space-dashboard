export type Period = "today" | "week";
export type Scenario = "normal" | "empty" | "error";
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
export type Dashboard = {
  source: "mock";
  capturedAt: string;
  period: Period;
  connected: number;
  reconnecting: number;
  peak: number;
  peakAt: string;
  voiceP95: number;
  failedPercent: number;
  spend: number;
  capacity: number;
  completed: number;
  avgAnswers: number;
  avgDuration: number;
  queueDepth: number;
  queueOldest: number;
  concurrency: { at: string; count: number }[];
  sessions: Session[];
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
const counts = [
  22, 18, 16, 20, 24, 19, 28, 40, 54, 68, 80, 89, 110, 125, 136, 142, 159, 173,
  184, 167, 150, 140, 132, 128,
];
function snapshot(period: Period, empty: boolean): Dashboard {
  const concurrency =
    period === "today"
      ? counts.map((count, hour) => ({
          at: new Date(
            Date.UTC(2026, 9, 13, hour + 5, hour === 18 ? 40 : 0),
          ).toISOString(),
          count: empty ? 0 : count,
        }))
      : [132, 151, 163, 178, 169, 171, 184].map((count, day) => ({
          at: new Date(Date.UTC(2026, 9, 7 + day, 23, 40)).toISOString(),
          count: empty ? 0 : count,
        }));
  return {
    source: "mock",
    capturedAt: "2026-10-14T04:45:00Z",
    period,
    connected: empty ? 0 : 128,
    reconnecting: empty ? 0 : 8,
    peak: empty ? 0 : 184,
    peakAt: "2026-10-13T23:40:00Z",
    voiceP95: empty ? 0 : 2.8,
    failedPercent: empty ? 0 : 1.4,
    spend: empty ? 0 : period === "today" ? 86.4 : 604.8,
    capacity: 250,
    completed: empty ? 0 : period === "today" ? 742 : 5194,
    avgAnswers: empty ? 0 : 24,
    avgDuration: empty ? 0 : 31,
    queueDepth: empty ? 0 : 18,
    queueOldest: empty ? 0 : 8,
    concurrency,
    sessions: empty ? [] : structuredClone(sessions),
  };
}
/** Local async fixture adapter. Replace with backend fetching when endpoints exist.
 * No HTTP requests, tracking, persistence, or real session actions. */
export function fetchDashboard(
  period: Period,
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
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      if (scenario === "error")
        reject(new Error("The mock request failed. No backend is connected."));
      else resolve(snapshot(period, scenario === "empty"));
    }, 650);
    signal.addEventListener("abort", abort, { once: true });
  });
}
