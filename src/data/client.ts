import { fetchDashboard } from "./dashboard.ts";
import type { Dashboard, MetricKey, Scenario, Session } from "./dashboard.ts";
import { resolveDateRange } from "./date-range.ts";
import type { RangeQuery } from "./date-range.ts";

const keys: MetricKey[] = [
  "connected",
  "reconnecting",
  "peak",
  "voiceP95",
  "failedPercent",
  "spend",
];
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid dashboard response.");
  return value as Record<string, unknown>;
}
function numeric(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new Error("Invalid numeric dashboard measurement.");
  return value;
}
function text(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Invalid dashboard text field.");
  return value;
}
function timestamp(value: unknown): string {
  const s = text(value);
  if (!Number.isFinite(Date.parse(s)))
    throw new Error("Invalid dashboard timestamp.");
  return s;
}
function list<T>(value: unknown, parse: (item: unknown) => T): T[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) throw new Error("Invalid dashboard collection.");
  return value.map(parse);
}
export function parseDashboard(
  value: unknown,
  query: RangeQuery,
  now: string,
): Dashboard {
  const raw = record(value);
  if (raw.version !== 1)
    throw new Error("Unsupported dashboard response version.");
  const range = resolveDateRange(query, now);
  if (range.calendarDays > 366)
    throw new Error(
      "The backend supports up to 366 calendar days per request.",
    );
  const echoed = record(raw.range);
  if (
    timestamp(echoed.start) !== range.start ||
    timestamp(echoed.end) !== range.end
  )
    throw new Error("Dashboard response does not match the requested range.");
  const comparisons = raw.comparisons == null ? {} : record(raw.comparisons);
  const comparison = (key: MetricKey) => {
    const item = comparisons[key] == null ? null : record(comparisons[key]);
    return {
      previous: numeric(item?.previous),
      label: item ? text(item.label) : "Comparison unavailable",
    };
  };
  const fields = Object.fromEntries(
    [
      ...keys,
      "capacity",
      "completed",
      "avgAnswers",
      "avgDuration",
      "queueDepth",
      "queueOldest",
    ].map((key) => [key, numeric(raw[key])]),
  ) as Pick<
    Dashboard,
    | MetricKey
    | "capacity"
    | "completed"
    | "avgAnswers"
    | "avgDuration"
    | "queueDepth"
    | "queueOldest"
  >;
  const sessions = list(raw.sessions, (value) => {
    const s = record(value),
      type = text(s.type),
      status = text(s.status),
      platform = text(s.platform);
    if (
      !["paid", "trial"].includes(type) ||
      !["Connected", "Reconnecting"].includes(status) ||
      !["iOS", "Android", "Web"].includes(platform)
    )
      throw new Error("Invalid session metadata.");
    const remaining = numeric(s.remaining),
      answers = numeric(s.answers),
      latency = numeric(s.latency);
    if (
      remaining === null ||
      remaining > (type === "paid" ? 45 : 10) ||
      answers === null ||
      latency === null
    )
      throw new Error("Invalid session measurements.");
    return {
      id: text(s.id),
      type,
      status,
      platform,
      remaining,
      answers,
      latency,
      startedAt: timestamp(s.startedAt),
    } as Session;
  });
  if (sessions && new Set(sessions.map((s) => s.id)).size !== sessions.length)
    throw new Error("Duplicate session IDs in dashboard response.");
  if (fields.failedPercent !== null && fields.failedPercent > 100)
    throw new Error("Invalid failed-request percentage.");
  return {
    ...fields,
    source: raw.synthetic === true ? "db-demo" : "api",
    unavailable: Object.fromEntries(
      Object.entries(raw.unavailable == null ? {} : record(raw.unavailable))
        .filter(([key]) =>
          [
            ...keys,
            "concurrency",
            "sessions",
            "capacity",
            "avgAnswers",
            "avgDuration",
            "queueDepth",
            "queueOldest",
            "forecast",
          ].includes(key),
        )
        .map(([key, value]) => [key, text(value)]),
    ),
    capturedAt: timestamp(raw.capturedAt),
    range,
    granularity: range.calendarDays === 1 ? "intraday" : "daily",
    peakAt: raw.peakAt == null ? null : timestamp(raw.peakAt),
    comparisons: Object.fromEntries(
      keys.map((k) => [k, comparison(k)]),
    ) as Dashboard["comparisons"],
    concurrency: list(raw.concurrency, (value) => {
      const s = record(value);
      const at = timestamp(s.at);
      if (
        Date.parse(at) < Date.parse(range.start) ||
        Date.parse(at) > Date.parse(range.end)
      )
        throw new Error("Chart point outside the requested range.");
      return { at, count: numeric(s.count) };
    }),
    sessions,
    health: list(raw.health, (value) => {
      const h = record(value),
        status = text(h.status);
      if (!["Operational", "Degraded", "Delayed", "Unknown"].includes(status))
        throw new Error("Invalid service status.");
      return { name: text(h.name), status } as NonNullable<
        Dashboard["health"]
      >[number];
    }),
    alerts: list(raw.alerts, (value) => {
      const a = record(value);
      return { title: text(a.title), detail: text(a.detail) };
    }),
    forecast: numeric(raw.forecast),
  };
}
export async function requestDashboard(
  endpoint: string,
  query: RangeQuery,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  now = new Date().toISOString(),
  timeoutMs = 12000,
): Promise<Dashboard> {
  const url = new URL(
    endpoint,
    typeof location === "undefined" ? undefined : location.origin,
  );
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Dashboard endpoint must use HTTP or HTTPS.");
  const range = resolveDateRange(query, now);
  if (range.calendarDays > 366)
    throw new Error(
      "The backend supports up to 366 calendar days per request.",
    );
  url.searchParams.set("start", range.start);
  url.searchParams.set("end", range.end);
  url.searchParams.set("timezone", query.timezone);
  const controller = new AbortController();
  const aborted = () => controller.abort();
  signal.addEventListener("abort", aborted, { once: true });
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetcher(url, {
      signal: controller.signal,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`Dashboard request failed (${response.status}).`);
    return parseDashboard(await response.json(), query, now);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error("Dashboard response was not valid JSON.");
    if (timedOut)
      throw new Error("Dashboard request timed out. Try refreshing again.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", aborted);
  }
}
export function loadDashboard(
  endpoint: string | undefined,
  query: RangeQuery,
  scenario: Scenario,
  signal: AbortSignal,
): Promise<Dashboard> {
  return endpoint
    ? requestDashboard(endpoint, query, signal)
    : fetchDashboard(query, scenario, signal);
}
