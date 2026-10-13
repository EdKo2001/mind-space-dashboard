# MindSpace Dashboard

Standalone React + TypeScript + Vite operations dashboard. Local static preview only; all session data and service statuses are synthetic. No authentication, backend, persistence, analytics collection, personal recaps, or PostHog integration.

## Run

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

`npm run check` runs strict TypeScript and lint. `npm run build` exports a static site to `dist/`. `npm run preview` serves that build locally.

## Ownership

- `src/data/dashboard.ts`: typed asynchronous mock adapter, fixed fixtures, cancellation, empty and error scenarios. Replace `fetchDashboard` when real endpoints are supplied.
- `src/App.tsx`: single operations page, filters, refresh, session metadata dialog and unconnected PostHog placeholders.
- `src/components/`: reusable chart, vector icons and accessible native dialog.
- `src/theme.css`: shared dark theme tokens.

Reporting period changes fetch another fixture. The selected timezone controls both calendar boundaries and display formatting. Sessions remain static; refresh does not invent activity or enforce a timer. Aggregated counts represent a fictional larger population; the table explicitly shows six illustrative rows. Missing latency/averages in the empty fixture display as unavailable, not measured zero.

## Planned boundaries

Backend: authoritative sessions, connection leases, 45-minute paid/10-minute trial limits, balances, accounting, technical summaries and private recap records.
Custom overview: concurrency, remaining time, response speed, queues, service health, spending and operational alerts.
PostHog: sanitized event trends, funnels, retention, feature usage and optional numeric feedback. No prompts, text, audio, notes or personal recap content. Links currently open an honest not-connected explanation.

No production provider, telemetry retention policy, commercial terms or latency target has been approved through this prototype. Alert thresholds and costs are examples.

Brand mark derives from the existing MindSpace supplied app artwork; no generated dashboard logo is adopted. See `public/BRANDING.md`.

## Reporting ranges

Today is calendar midnight to the mock snapshot in the selected timezone, not a rolling 24-hour window. Last 7/30/90/360 days include today plus the preceding calendar dates. Changing timezone recomputes query boundaries as well as labels. Custom start/end dates are inclusive; historical end dates query up to the following midnight (exclusive), while today is capped at the snapshot. The fixture clock is fixed and visibly labeled; no live clock is implied. Long custom ranges sample at most 366 points to keep chart rendering bounded.

`npm test` verifies calendar-day boundaries, DST, UTC/Chicago date rollover and invalid custom inputs. The mock adapter receives the resolved range query; a future backend should consume the same UTC start/end boundaries.
