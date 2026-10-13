import { useEffect, useState } from "react";
import type { ReactNode, FormEvent } from "react";
import { loadDashboard } from "./data/client";
import { API_ENDPOINT, DB_DEMO_MODE } from "./data/config";
import type { Dashboard, Scenario } from "./data/dashboard";
import { Icon } from "./components/Icon";
import type { IconName } from "./components/Icon";
import { ConcurrencyChart } from "./components/ConcurrencyChart";
import { Modal } from "./components/Modal";
import {
  dateInZone,
  FIXTURE_NOW,
  PERIODS,
  resolveDateRange,
} from "./data/date-range";
import type { Period } from "./data/date-range";
import { metricTrend } from "./data/trend";
import type { Comparison } from "./data/dashboard";
import "./App.css";
const money = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: value > 9999 ? "compact" : "standard",
      }).format(value);
const number = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        notation: value > 9999 ? "compact" : "standard",
        maximumFractionDigits: 1,
      }).format(value);
function Panel({
  title,
  icon,
  aside,
  children,
  className = "",
}: {
  title: string;
  icon: IconName;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>
          <Icon name={icon} />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
function Metric({
  label,
  value,
  icon,
  detail,
  tone = "",
  comparison,
  reason,
  current,
  higherIsBetter = true,
  unit = "percent",
}: {
  label: string;
  value: string;
  icon: IconName;
  detail: string;
  tone?: string;
  comparison: Comparison;
  reason?: string;
  current: number | null;
  higherIsBetter?: boolean;
  unit?: "percent" | "points";
}) {
  const trend = metricTrend(current, comparison.previous, higherIsBetter, unit);
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-label">
        <Icon name={icon} />
        <span>{label}</span>
      </div>
      <strong
        title={
          current === null
            ? (reason ?? "Unavailable")
            : current.toLocaleString("en-US")
        }
      >
        {value}
      </strong>
      <span className="metric-detail">{detail}</span>
      <div className={`metric-trend ${trend.tone}`}>
        <Icon
          name={trend.direction === "flat" ? "minus" : trend.direction}
          size={15}
        />
        <span className="sr-only">
          {trend.direction === "up"
            ? "Increase"
            : trend.direction === "down"
              ? "Decrease"
              : ""}{" "}
        </span>
        <span>{trend.text}</span>
      </div>
      <span className="metric-comparison">{comparison.label}</span>
    </div>
  );
}
function Status({ status }: { status: string }) {
  return (
    <span className={`status ${status.toLowerCase()}`}>
      <span className="dot" />
      {status}
    </span>
  );
}
export default function App() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [custom, setCustom] = useState({
    startDate: "2026-10-07",
    endDate: "2026-10-13",
  });
  const [editingRange, setEditingRange] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    data?.sessions?.find((session) => session.id === selectedId) ?? null;
  const [autoRefresh, setAutoRefresh] = useState(0);
  const [analytics, setAnalytics] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState<string | null>(null);
  const [clock, setClock] = useState(() =>
    API_ENDPOINT ? new Date().toISOString() : FIXTURE_NOW,
  );
  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(
      API_ENDPOINT,
      { period, timezone, ...custom },
      scenario,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setSelectedId((id) =>
          result.sessions?.some((session) => session.id === id) ? id : null,
        );
        setLoading(false);
        setError(null);
        setReceivedAt(new Date().toISOString());
        if (API_ENDPOINT) setClock(new Date().toISOString());
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load sample data.",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [period, timezone, custom, scenario, revision]);
  const reload = () => {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  };
  useEffect(() => {
    if (!autoRefresh || loading) return;
    const timer = setInterval(() => {
      if (!document.hidden) reload();
    }, autoRefresh * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, loading]);
  const changePeriod = (value: Period) => {
    if (value === "custom") {
      setEditingRange(true);
      setRangeError(null);
      return;
    }
    setEditingRange(false);
    setData(null);
    setLoading(true);
    setError(null);
    setPeriod(value);
  };
  const changeScenario = (value: Scenario) => {
    if (value !== "refresh-error") setData(null);
    setLoading(true);
    setError(null);
    setScenario(value);
  };
  const time = (at: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(at));
  const sessions =
    data?.sessions?.filter(
      (session) =>
        (filter === "All statuses" || session.status === filter) &&
        session.id.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  const rangeLabel = data?.range.label ?? PERIODS[period];
  const applyCustom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dates = {
      startDate: String(form.get("startDate")),
      endDate: String(form.get("endDate")),
    };
    try {
      const range = resolveDateRange(
        { period: "custom", timezone, ...dates },
        clock,
      );
      if (API_ENDPOINT && range.calendarDays > 366)
        throw new Error("Choose 366 calendar days or fewer for this backend.");
    } catch (error) {
      setRangeError(error instanceof Error ? error.message : "Invalid range");
      return;
    }
    setData(null);
    setLoading(true);
    setError(null);
    setRangeError(null);
    setCustom(dates);
    setPeriod("custom");
    setEditingRange(false);
  };
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#main" aria-label="MindSpace operations">
          <img src="/brand-mark.svg" width="30" height="30" alt="" />
          <span>MindSpace</span>
        </a>
        <span className="header-divider" />
        <span className="workspace-name">Operations</span>
        <div className="header-actions">
          <span className="demo-badge">
            <span className="dot" />
            {DB_DEMO_MODE || data?.source === "db-demo" ? "DB DEMO" : API_ENDPOINT ? "API MODE" : "MOCK DATA"}
          </span>
          <button
            className="button posthog-button"
            onClick={() => setAnalytics("PostHog")}
          >
            Open PostHog
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </header>
      <main id="main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">MINDSPACE / OPERATIONS</div>
            <h1>A clear view of every session.</h1>
            <p>Live operations, performance, and spend — in one place.</p>
          </div>
          <div className="toolbar">
            <label className="select-wrap">
              <span className="sr-only">Reporting period</span>
              <select
                value={editingRange ? "custom" : period}
                onChange={(event) => changePeriod(event.target.value as Period)}
              >
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="360days">Last 360 days</option>
                <option value="custom">Custom range…</option>
              </select>
            </label>
            <label className="select-wrap timezone">
              <span className="sr-only">Display timezone</span>
              <select
                value={timezone}
                onChange={(event) => {
                  setData(null);
                  setLoading(true);
                  setError(null);
                  setTimezone(event.target.value);
                }}
              >
                <option value="America/Chicago">America/Chicago</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
            <button
              className="icon-button"
              aria-label="Refresh dashboard"
              disabled={loading}
              onClick={reload}
            >
              <Icon name="refresh" />
            </button>
          </div>
        </div>
        {editingRange && (
          <form className="custom-range" onSubmit={applyCustom}>
            <label>
              Start date
              <input
                type="date"
                required
                max={dateInZone(clock, timezone)}
                name="startDate"
                defaultValue={custom.startDate}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                required
                max={dateInZone(clock, timezone)}
                name="endDate"
                defaultValue={custom.endDate}
              />
            </label>
            <button className="button primary" type="submit">
              Apply range
            </button>
            <button
              className="button"
              type="button"
              onClick={() => setEditingRange(false)}
            >
              Cancel
            </button>
            <p>
              Inclusive calendar dates in {timezone}. Today ends at the latest
              request time.
            </p>
            {rangeError && (
              <p role="alert" className="rose">
                {rangeError}
              </p>
            )}
          </form>
        )}
        <div className="sample-notice" role="status" aria-live="polite">
          <span>
            <span className="dot" />
            {DB_DEMO_MODE || data?.source === "db-demo"
              ? "PostgreSQL demo · all session metrics are synthetic · fetched through the API."
              : API_ENDPOINT
              ? "API mode · measurements supplied by the configured endpoint."
              : "Mock mode · all sessions and metrics are synthetic."}
          </span>
          <span>
            {loading
              ? data
                ? "Refreshing… previous snapshot remains visible"
                : "Loading dashboard…"
              : error
                ? data
                  ? "Refresh failed · previous snapshot is stale"
                  : "Dashboard unavailable"
                : `${data?.source !== "mock" ? "Snapshot" : "Fixture"} · ${new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric", year: "numeric" }).format(new Date(data?.capturedAt ?? "2026-10-14T04:45:00Z"))}`}
            {data && !loading && !error
              ? ` · ${time(data.capturedAt)} ${timezone === "UTC" ? "UTC" : "CT"}`
              : ""}
          </span>
        </div>
        {error && (
          <div role="alert" className="error-state">
            <Icon name="warning" />
            <div>
              <strong>Couldn’t load the dashboard</strong>
              <p>
                {error}
                {data ? " Previous data is shown below and marked stale." : ""}
              </p>
            </div>
            <button className="button" onClick={reload}>
              Retry request
            </button>
          </div>
        )}
        {!data && loading && (
          <div className="loading-state" role="status">
            <div className="skeleton-metrics">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="skeleton" key={i} />
              ))}
            </div>
            <div className="primary-grid">
              <div className="skeleton skeleton-chart" />
              <div className="skeleton skeleton-chart" />
            </div>
            <div className="secondary-grid">
              <div className="skeleton skeleton-table" />
              <div className="skeleton skeleton-table" />
            </div>
            <p>Loading operations…</p>
          </div>
        )}
        {data && (
          <div
            className={
              loading
                ? "dashboard fetching"
                : error
                  ? "dashboard stale"
                  : "dashboard"
            }
            aria-busy={loading}
          >
            <div className="metrics">
              <Metric
                label="Connected sessions"
                comparison={data.comparisons.connected}
                reason={data.unavailable.connected}
                current={data.connected}
                higherIsBetter={true}
                unit="percent"
                value={number(data.connected)}
                icon="users"
                detail="Current snapshot"
              />
              <Metric
                label="Reconnecting"
                comparison={data.comparisons.reconnecting}
                reason={data.unavailable.reconnecting}
                current={data.reconnecting}
                higherIsBetter={false}
                unit="percent"
                value={number(data.reconnecting)}
                icon="refresh"
                detail="Included in open sessions"
                tone="amber"
              />
              <Metric
                label="Peak concurrency"
                comparison={data.comparisons.peak}
                reason={data.unavailable.peak}
                current={data.peak}
                higherIsBetter={true}
                unit="percent"
                value={number(data.peak)}
                icon="chart"
                detail={
                  data.peakAt === null
                    ? "Peak time unavailable"
                    : `${rangeLabel} · ${new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric" }).format(new Date(data.peakAt!))} ${time(data.peakAt)}`
                }
              />
              <Metric
                label="Voice response p95"
                comparison={data.comparisons.voiceP95}
                reason={data.unavailable.voiceP95}
                current={data.voiceP95}
                higherIsBetter={false}
                unit="percent"
                value={
                  data.voiceP95 === null ? "—" : `${data.voiceP95.toFixed(1)}s`
                }
                icon="clock"
                detail="Speech end → audible reply"
              />
              <Metric
                label="Failed requests"
                comparison={data.comparisons.failedPercent}
                reason={data.unavailable.failedPercent}
                current={data.failedPercent}
                higherIsBetter={false}
                unit="points"
                value={
                  data.failedPercent === null
                    ? "—"
                    : `${data.failedPercent.toFixed(1)}%`
                }
                icon="warning"
                detail={`${rangeLabel} · excludes interruptions`}
                tone="rose"
              />
              <Metric
                label="AI spend"
                comparison={data.comparisons.spend}
                reason={data.unavailable.spend}
                current={data.spend}
                higherIsBetter={false}
                unit="percent"
                value={money(data.spend)}
                icon="money"
                detail={`${rangeLabel} · estimated USD`}
              />
            </div>
            <div className="primary-grid">
              <Panel
                title="Concurrent sessions"
                icon="activity"
                className="concurrency-panel"
                aside={<span className="panel-caption">{rangeLabel}</span>}
              >
                <div className="chart-meta">
                  <div className="chart-summary">
                    <strong>{number(data.connected)}</strong>
                    <span>
                      connected now{" "}
                      <span className="subtle">
                        / {number(data.capacity)} capacity
                      </span>
                    </span>
                  </div>
                  <div className="legend">
                    <span>
                      <i />
                      {data.granularity === "intraday"
                        ? "Connected sessions"
                        : "Sampled peaks"}
                    </span>
                    <span>
                      <i className="dashed" />
                      Capacity
                    </span>
                  </div>
                </div>
                <ConcurrencyChart data={data} timezone={timezone} />
                <div className="chart-footer">
                  <span>
                    {data.granularity === "intraday"
                      ? "Intraday samples"
                      : "Sampled peaks"}{" "}
                    · {timezone}
                  </span>
                  <span>
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: timezone,
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }).format(new Date(data.range.start))}{" "}
                    →{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: timezone,
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }).format(new Date(data.range.end))}
                  </span>
                </div>
              </Panel>
              <Panel
                title="System health"
                icon="server"
                aside={
                  <span className="pill">
                    {data.source === "mock"
                      ? "Mock statuses"
                      : "Reported statuses"}
                  </span>
                }
              >
                <div className="health-rows">
                  {data.health?.map((service, index) => (
                    <div className="health-row" key={index}>
                      <span>
                        <Icon name="server" size={17} />
                        {service.name}
                      </span>
                      <Status status={service.status} />
                    </div>
                  ))}
                </div>
                {data.health === null && (
                  <div className="empty-state compact">
                    <strong>Service health unavailable</strong>
                  </div>
                )}
                <div className="queue-stats">
                  <div>
                    <span>Queue depth</span>
                    <strong>
                      {number(data.queueDepth)}
                      <small> requests</small>
                    </strong>
                  </div>
                  <div>
                    <span>Oldest waiting</span>
                    <strong>
                      {number(data.queueOldest)}
                      <small> seconds</small>
                    </strong>
                  </div>
                </div>
                <p className="health-note">
                  {data.source === "mock"
                    ? "Illustrative statuses · no services are connected."
                    : data.source === "db-demo"
                      ? "API and PostgreSQL are connected. AI and voice remain unavailable; session metrics are synthetic."
                      : "Service status from the latest API snapshot."}
                </p>
              </Panel>
            </div>
            <div className="secondary-grid">
              <div className="session-column">
                <Panel
                  title="Active sessions"
                  icon="users"
                  aside={
                    <span className="panel-caption">
                      {data.connected === null || data.reconnecting === null
                        ? "—"
                        : number(data.connected + data.reconnecting)}{" "}
                      open · {data.sessions?.length ?? "—"} loaded rows
                    </span>
                  }
                >
                  <div className="session-toolbar">
                    <label className="search-input">
                      <Icon name="search" size={17} />
                      <input
                        aria-label="Search session ID"
                        placeholder="Search session ID…"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </label>
                    <label className="select-wrap">
                      <span className="sr-only">Session status</span>
                      <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                      >
                        <option>All statuses</option>
                        <option>Connected</option>
                        <option>Reconnecting</option>
                      </select>
                    </label>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Session ID</th>
                          <th>Type</th>
                          <th>Time remaining</th>
                          <th>Answers</th>
                          <th>Status</th>
                          <th>
                            <span className="sr-only">Details</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session.id}>
                            <td>
                              <button
                                className="session-id"
                                onClick={() => setSelectedId(session.id)}
                              >
                                {session.id}
                              </button>
                            </td>
                            <td>
                              {session.type === "paid" ? "Paid" : "Trial"}{" "}
                              <span className="subtle">
                                ({session.type === "paid" ? "45" : "10"}m)
                              </span>
                            </td>
                            <td>
                              <div
                                className={`remaining ${session.remaining <= 1 ? "rose" : session.remaining <= 5 ? "amber" : ""}`}
                              >
                                <span>{session.remaining}m</span>
                                <div
                                  className="time-track"
                                  role="meter"
                                  aria-label={`Time remaining for ${session.id}`}
                                  aria-valuemin={0}
                                  aria-valuemax={
                                    session.type === "paid" ? 45 : 10
                                  }
                                  aria-valuenow={session.remaining}
                                >
                                  <i
                                    style={{
                                      width: `${(session.remaining / (session.type === "paid" ? 45 : 10)) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>{session.answers}</td>
                            <td>
                              <Status status={session.status} />
                            </td>
                            <td>
                              <button
                                className="icon-button row-action"
                                aria-label={`View ${session.id}`}
                                onClick={() => setSelectedId(session.id)}
                              >
                                <Icon name="chevron" size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sessions.length === 0 && (
                    <div className="empty-state">
                      <Icon name="users" size={26} />
                      <strong>
                        {(data.sessions?.length ?? 0)
                          ? "No matching sessions"
                          : data.sessions === null
                            ? "Session data unavailable"
                            : "No session rows returned"}
                      </strong>
                      <p>
                        {(data.sessions?.length ?? 0)
                          ? "Try another ID or status."
                          : data.sessions === null
                            ? "The source has not supplied session rows."
                            : "No session rows were returned for this snapshot."}
                      </p>
                      {(data.sessions?.length ?? 0) > 0 && (
                        <button
                          className="button"
                          onClick={() => {
                            setSearch("");
                            setFilter("All statuses");
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                  <div className="table-footer">
                    <span>
                      Showing {sessions.length} of{" "}
                      {data.sessions?.length ?? "—"} loaded rows
                    </span>
                    <span>Read-only view</span>
                  </div>
                </Panel>
                <Panel
                  title="Recent completions"
                  icon="check"
                  aside={<span className="panel-caption">{rangeLabel}</span>}
                >
                  <div className="completion-stats">
                    <div>
                      <span>Completed sessions</span>
                      <strong>{number(data.completed)}</strong>
                    </div>
                    <div>
                      <span>Average answers / session</span>
                      <strong>{number(data.avgAnswers)}</strong>
                    </div>
                    <div>
                      <span>Average duration</span>
                      <strong>
                        {number(data.avgDuration)}
                        <small>{data.avgDuration === null ? "" : " min"}</small>
                      </strong>
                    </div>
                  </div>
                </Panel>
              </div>
              <div className="side-column">
                <Panel
                  title="Attention needed"
                  icon="warning"
                  aside={
                    <span className="pill">
                      {data.alerts === null
                        ? "Unavailable"
                        : `${data.alerts.length} alerts`}
                    </span>
                  }
                >
                  {data.alerts?.map((alert, index) => (
                    <div className="alert-rows" key={index}>
                      <div className="alert-item">
                        <span className="alert-icon amber">
                          <Icon name="warning" size={17} />
                        </span>
                        <div>
                          <strong>{alert.title}</strong>
                          <p>{alert.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!data.alerts?.length && (
                    <div className="empty-state compact">
                      <strong>
                        {data.alerts === null
                          ? "Alert data unavailable"
                          : "No reported alerts"}
                      </strong>
                    </div>
                  )}
                  <div className="spend-forecast">
                    <span>Monthly AI spend forecast</span>
                    <strong>
                      {money(data.forecast)}
                      <span>estimate</span>
                    </strong>
                    <p>
                      {data.forecast === null
                        ? "No forecast supplied."
                        : data.source !== "api"
                          ? "Illustrative daily run rate × 30 days."
                          : "Estimate supplied by the API."}
                    </p>
                  </div>
                </Panel>
                <Panel
                  title="Go deeper with PostHog"
                  icon="chart"
                  className="analytics-panel"
                >
                  <p>Explore product trends beyond live operations.</p>
                  <div className="analytics-links">
                    {[
                      "Funnels",
                      "Retention",
                      "Feature usage",
                      "Feedback trends",
                    ].map((name) => (
                      <button key={name} onClick={() => setAnalytics(name)}>
                        {name}
                        <Icon name="arrow" size={15} />
                      </button>
                    ))}
                  </div>
                  <span className="analytics-note">
                    <span className="dot" />
                    Not connected · sanitized events planned
                  </span>
                </Panel>
              </div>
            </div>
          </div>
        )}
        <footer>
          <div>
            <strong>MindSpace Operations</strong>
            <span>No session content stored by this dashboard</span>
          </div>
          <div className="preview-controls">
            <label htmlFor="auto-refresh">Auto refresh</label>
            <select
              id="auto-refresh"
              value={autoRefresh}
              onChange={(event) => setAutoRefresh(Number(event.target.value))}
            >
              <option value={0}>Off</option>
              <option value={15}>Every 15s</option>
              <option value={60}>Every 60s</option>
            </select>
            {!API_ENDPOINT && (
              <>
                <label htmlFor="scenario">Preview state</label>
                <select
                  id="scenario"
                  value={scenario}
                  onChange={(event) =>
                    changeScenario(event.target.value as Scenario)
                  }
                >
                  <option value="normal">Sample data</option>
                  <option value="empty">Empty</option>
                  <option value="error">Initial error</option>
                  <option value="slow">Slow loading</option>
                  <option value="partial">Partial data</option>
                  <option value="large">Large scale + gaps</option>
                  <option value="refresh-error">Refresh failure</option>
                </select>
              </>
            )}
            <span>
              {receivedAt && !loading && !error
                ? `Fetched ${time(receivedAt)}`
                : API_ENDPOINT
                  ? "API adapter"
                  : "Mock adapter"}
            </span>
          </div>
        </footer>
      </main>
      {selected && (
        <Modal title={selected.id} onClose={() => setSelectedId(null)}
          eyebrow={data?.source === "db-demo" ? "POSTGRESQL DEMO · SYNTHETIC SESSION" : data?.source === "api" ? "API SESSION METADATA" : "SAMPLE DATA · NO BACKEND CONNECTED"}>
          <div className="detail-grid">
            {[
              [
                "Session type",
                selected.type === "paid"
                  ? "Paid · 45 minutes"
                  : "Trial · 10 minutes",
              ],
              ["Connection", selected.status],
              ["Remaining time", `${selected.remaining} minutes`],
              [
                "Elapsed time",
                `${(selected.type === "paid" ? 45 : 10) - selected.remaining} minutes`,
              ],
              ["Completed answers", String(selected.answers)],
              ["Voice p95", `${number(selected.latency)}s`],
              ["Platform", selected.platform],
              ["Started", `${time(selected.startedAt)} · ${timezone}`],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="modal-note">
            Technical metadata only. Personal recaps and conversation content do
            not belong in this operations view.
          </p>
        </Modal>
      )}
      {analytics && (
        <Modal
          title={
            analytics === "PostHog" ? "Product analytics in PostHog" : analytics
          }
          onClose={() => setAnalytics(null)}
        >
          <p className="modal-description">
            PostHog isn’t connected yet. Once a project is configured, this will
            open the corresponding analytics dashboard.
          </p>
          <ul className="analytics-list">
            <li>Signup → trial → paid funnels and drop-offs</li>
            <li>Retention and returning-user cohorts</li>
            <li>Voice, text, scheduling, and avatar feature usage</li>
            <li>Historical session metrics and optional numeric feedback</li>
          </ul>
          <p className="modal-note">
            Only allowlisted technical events and numeric measurements are
            planned. No prompts, audio, notes, conversation text, or personal
            recaps.
          </p>
          <button className="button primary" onClick={() => setAnalytics(null)}>
            Got it
          </button>
        </Modal>
      )}
    </>
  );
}
