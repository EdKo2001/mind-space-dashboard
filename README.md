# MindSpace Dashboard

Standalone React + TypeScript + Vite operations dashboard. Defaults to clearly labeled local synthetic data. Optional API mode supports a configured backend contract; no production endpoint, authentication integration or PostHog connection has been supplied. No persistence or analytics collection.

## Run

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

`npm run check` runs strict TypeScript and lint. `npm run build` exports a static site to `dist/`. `npm run preview` serves that build locally.

## Ownership

- `src/data/dashboard.ts`: typed asynchronous mock adapter, fixed fixtures, cancellation, empty and error scenarios. Retained for default mock mode.
- `src/data/client.ts`: validated, abortable HTTP adapter and mock/API selection; public configuration in `src/data/config.ts`.
- `src/App.tsx`: single operations page, filters, refresh, session metadata dialog and unconnected PostHog placeholders.
- `src/components/`: reusable chart, vector icons and accessible native dialog.
- `src/theme.css`: shared dark theme tokens.

In mock mode, reporting period changes fetch another fixture. The selected timezone controls both calendar boundaries and display formatting. Sessions remain static; refresh does not invent activity or enforce a timer. Aggregated counts represent a fictional larger population; the table explicitly shows six illustrative rows. Missing latency/averages in the empty fixture display as unavailable, not measured zero.

## Planned boundaries

Backend: authoritative sessions, connection leases, 45-minute paid/10-minute trial limits, balances, accounting, technical summaries and private recap records.
Custom overview: concurrency, remaining time, response speed, queues, service health, spending and operational alerts.
PostHog: sanitized event trends, funnels, retention, feature usage and optional numeric feedback. No prompts, text, audio, notes or personal recap content. Links currently open an honest not-connected explanation.

No production provider, telemetry retention policy, commercial terms or latency target has been approved through this prototype. Alert thresholds and costs are examples.

Brand mark derives from the existing MindSpace supplied app artwork; no generated dashboard logo is adopted. See `public/BRANDING.md`.

## Reporting ranges

Today is calendar midnight to the mock snapshot (or current API request time) in the selected timezone, not a rolling 24-hour window. Last 7/30/90/360 days include today plus the preceding calendar dates. Changing timezone recomputes query boundaries as well as labels. Custom start/end dates are inclusive; historical end dates query up to the following midnight (exclusive), while today is capped at the snapshot. The fixture clock is fixed and visibly labeled; no live clock is implied. Mock custom ranges sample at most 366 points to keep chart rendering bounded.

`npm test` verifies calendar-day boundaries, DST, UTC/Chicago date rollover and invalid custom inputs. The mock adapter receives the resolved range query; the API adapter sends the same UTC start/end boundaries.

## Metric comparisons

Top metric cards show literal up/down arrows and calculated changes from adapter-provided baselines. In mock mode the baselines are synthetic; API mode uses supplied measurements or shows unavailable. Green means an improvement for the metric; red means deterioration. Higher session volume/peak is shown green; lower reconnects, latency, failures, and spend is green. Failure-rate changes use percentage points. Live gauges compare with a sample snapshot 15 minutes earlier; reporting metrics compare with the previous range at matched elapsed time. No change and missing baselines remain neutral; zero baselines show new activity without dividing by zero. Mock comparisons are illustrative, not measured results.

## Dynamic API and loading states

See [API_CONTRACT.md](API_CONTRACT.md). Configure a public endpoint with `VITE_DASHBOARD_API_URL`; leave it blank for mock mode. Initial requests show full-page skeletons; refresh preserves the previous snapshot with an updating indicator. Errors are retryable and stale data is explicitly marked. Optional polling every 15/60 seconds is off by default, skips hidden tabs and avoids overlapping requests. Reporting-query changes cancel obsolete requests and do not reuse old data under new labels.

Nullable measurements/collections render unavailable, separately from measured zero/empty. Health, alerts, forecasts and comparisons come from the adapter instead of static UI copy. Mock preview controls include slow loading, partial data, large chart values/gaps and failed refresh. Charts dynamically scale, use timestamp spacing and retain explicit gaps; empty/single-point and large-series cases are covered.

Run `npm test` for HTTP, response validation, timeout/cancellation, chart and date/trend tests. `tests/api-fixture.mjs` is a local synthetic QA service, not production.
