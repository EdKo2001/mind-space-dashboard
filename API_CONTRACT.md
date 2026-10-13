# Dashboard API boundary (proposed version 1)

Default mode uses local synthetic fixtures. Optional API mode is enabled by `VITE_DASHBOARD_API_URL` (absolute HTTP(S) URL or same-origin path). The URL is public browser configuration; it must never contain a token. An actual production endpoint/authentication integration has not been supplied or accepted.

GET requests send `start`, `end` (UTC ISO boundaries, end exclusive for historical dates), and `timezone`. Today uses selected-timezone midnight to the request time. Requests are abortable, time out after12seconds, and use same-origin credentials only. No automatic fallback to fabricated mock data occurs when API mode fails. Cross-origin authentication, access control and production deployment are future integration work.

Minimum response:

```json
{
  "version": 1,
  "capturedAt": "2026-10-13T12:00:00.000Z",
  "range": {
    "start": "<exact requested start>",
    "end": "<exact requested end>"
  },
  "connected": 128,
  "concurrency": [{ "at": "<timestamp within requested range>", "count": 128 }],
  "sessions": []
}
```

Response fields:

- Measurements: `connected`, `reconnecting`, `peak`, `voiceP95` (seconds), `failedPercent` (0–100), `spend` (USD estimate), `capacity`, `completed`, `avgAnswers`, `avgDuration` (minutes), `queueDepth`, `queueOldest` (seconds), `forecast` (USD estimate). Missing/null means unavailable, never zero.
- `peakAt`: optional ISO timestamp.
- `comparisons`: optional object keyed by the six KPI names; each contains `previous` (number/null) and `label` (comparison window). The frontend derives direction and change; backend owns real baselines.
- `concurrency`: nullable array of timestamp/count objects. Explicit null counts are gaps; zero is a measured zero. The renderer sorts, deduplicates, bounds large series while keeping bucket peaks/gaps, scales to actual measurements/capacity, and supports single-point data. Missing collection is unavailable; empty collection is no returned points.
- `sessions`: nullable array. Required per row: opaque unique `id`, `type` (paid/trial), `remaining` (minutes,0–45 or0–10), `answers`, `status` (Connected/Reconnecting), `platform` (iOS/Android/Web), `latency` (seconds), `startedAt` (ISO). Current snapshot gauges and the returned row subset are distinct; this is not a pagination protocol.
- `health`: optional/null array of `{name,status}`; status Operational/Degraded/Delayed/Unknown. No statuses are invented in API mode.
- `alerts`: optional/null array of `{title,detail}`. Empty is no reported alerts; missing is unavailable.

The backend must provide only allowlisted technical metadata: no personal names, conversation text, prompts, audio, notes or recaps. The dashboard neither persists responses nor sends telemetry. Response version/range, numerical values, timestamps, row metadata and IDs are validated; errors keep the last same-query snapshot visibly stale. Changing the reporting query shows initial loading instead of mislabeling old data.

Manual refresh and opt-in15/60-second polling are supported. Polling skips hidden tabs and does not overlap requests. Session details resolve from the current snapshot and disappear if a session is removed. PostHog remains unconnected.

QA: `npm test` includes actual local HTTP calls and error/abort/timeout validation. `node tests/api-fixture.mjs` serves a synthetic changing HTTP fixture on5180; run Vite on5174 with `VITE_DASHBOARD_API_URL=http://127.0.0.1:5180/dashboard` for browser tests. This fixture is neither deployed nor a real backend; first requests are delayed, request3 fails, later results contain a single point.

## Backend coordination — October13

Reviewed the BE chat and actual sibling backend contract at `mindspace-backed/docs/dashboard-api.md`. Read-only localhost endpoint `http://127.0.0.1:3001/v1/dashboard` currently implements this version1 envelope. Our actual requestDashboard function successfully parsed its response. The internal local aggregate profile supplies persisted completed/average elapsed duration and API/database health, while presence, latency, costs, chart history and session rows remain null. Lifecycle diagnostics are not connection metrics. Allowlisted unavailable reasons are preserved as tooltips on unavailable KPI values. API mode caps ranges at366 calendar days, consistent with the backend367-elapsed-day DST allowance. Mock mode remains the default.

Backend local aggregate access is explicitly enabled under its Compose profile and supports exact localhost5173 origins. This is not production admin authentication. Its own identity/provider readiness remains separately unavailable. No backend files or default integration mode were changed by this UI milestone.

## PostgreSQL demo integration

`npm run dev:db-demo` starts port5175 with the public backend URL `/v1/dashboard/demo` and an explicit demo preview flag. Response `synthetic:true` becomes `source:db-demo`; the app preserves that disclosure after loading/refresh. The startup flag labels pending/error states before a response arrives. Existing API errors never fall back to local mocks. The operational `/v1/dashboard` endpoint stays separate and reports unavailable presence/voice/cost measurements. The seeded endpoint retains the same version1 and UTC range contract; synthetic current rows are frozen, while completions/history are filtered by requested instants.
