# Static dashboard checkpoint — October 13, 2026

Implemented the selected dark operations overview as a standalone React/TypeScript/Vite project. All data, service health and alerts are synthetic; the adapter simulates asynchronous fetching only. No endpoints, account access, persistence, billing, session enforcement, AI, microphone or analytics integration.

Verified locally:

- Strict TypeScript and Oxlint: npm run check PASS.
- Static export: npm run build PASS (dist output).
- Local HTTP response: 200.
- Browser: session search, no-match state/clear, reconnecting filter, session technical metadata dialog/open/close, PostHog not-connected dialog, reporting-period fixture changes, Chicago/UTC formatting (including date rollover), refresh/loading, empty and persistent mock failure/retry, recovery to normal fixture.
- Responsive browser: desktop default 1280px, 375×667, 320×568 stress and 440×956; document width equals viewport after hidden-label positioning repair. Narrow timezone selector gets its own row. Session table intentionally scrolls horizontally; values retain readable sizing.
- Screenshots: desktop.jpg, mobile-320.jpg, mobile-375.jpg, mobile-440.jpg. Browser captures are actual rendered app evidence, not the earlier generated concepts.

Parent mobile app: npm run check and npm run export:web PASS (16 routes). Expo Doctor 20/21 retains existing expo57.0.27/router57.0.25 vs expected57.0.28/57.0.26 drift; no mobile package changes. Parent TypeScript/ESLint exclude the standalone dashboard to preserve package independence.

Not verified: production deployment, actual services/data, authentication, PostHog ingestion, cross-browser matrix, native/physical devices, assistive-technology audit or 200% text matrix. No production acceptance claim.

## October 13 reporting range update

Added Last 30/90/360 days and Custom range. Today now resolves selected-timezone midnight → sample snapshot; presets count inclusive calendar dates. Custom form Apply/Cancel retains committed selection, rejects reversed/invalid/future dates, and uses inclusive end dates. Date-specific Chicago offsets correctly yield 23/25-hour DST days. Mock fetching and charts receive actual query boundaries; long-range ticks and endpoints include years when needed. Current-session cards remain the current snapshot independently of historical aggregates.

`npm run check`, `npm test` (4 cases), and `npm run build` PASS. Browser verified all new presets, custom reversed-date error, Oct1–3 Apply, Cancel retention, Chicago Today00:00–23:45 and UTC Today00:00–04:45. Responsive custom form and updated screenshot evidence: date-range-desktop.jpg, date-range-mobile.jpg. No real fetching or analytics integration.

## October 13 metric comparison indicators

Added reusable direction/change calculation, vector up/down/minus icons, metric-specific green/red colors and comparison labels to all six KPI cards. Values derive from typed mock baselines rather than hardcoded percentage strings. Zero/missing baselines and unchanged values remain explicit/neutral; failure-rate changes use percentage points. Today comparisons use yesterday at the same elapsed time; historical/custom ranges use matched prior ranges. Current gauges use a snapshot15minutes earlier.

Typecheck/lint, six unit tests and static build PASS. Browser inspected actual desktop colors/directions, normal/empty comparison text, and375px layout without document overflow. Screenshots: metric-trends-desktop.jpg and metric-trends-mobile.jpg. All metrics/comparisons remain synthetic; no live backend/analytics changed.

## October13 dynamic API/loading checkpoint

- Added opt-in HTTP adapter with public endpoint configuration, strict version/range/measurement validation,12-second timeout, cancellation, HTTP/JSON errors and nullable fields. Default remains mock; API failure never falls back to fabricated data. Source mode, snapshot time, loading and stale refresh state are visible.
- Initial skeletons cover KPI/chart/health/table/alert regions. Refresh retains the previous same-query snapshot, marks failed refresh stale and offers Retry. Query changes discard obsolete requests and show loading; optional15/60-second foreground polling avoids overlapping requests. Partial data is unavailable rather than zero. Session details resolve against the latest snapshot.
- Health/alerts/forecast come from the adapter, including Unknown/null states. Backend reasons for unavailable KPI measurements are allowlisted and retained in tooltips. Large quantities compact visually with full-value titles.
- Chart uses actual timestamp spacing, dynamic capacity/axis scaling, sorted/deduplicated points, explicit gaps, empty/single-point rendering and bounded large-series peak-preserving sampling.
- Local strict check,12 tests and static build PASS. Tests include actual HTTP changing snapshots, invalid responses/ranges,503/abort/timeout,10K-point chart/gaps, dates/DST/trends. Browser: initial slow skeleton, partial/empty states, failed refresh retaining old data, recovery, above300 capacity/values, single-point chart, rapid obsolete query cancellation and automatic HTTP refresh (1504→1510 via local synthetic fixture). Narrow375px actual viewport/document widths match after selecting the active tab. Screenshots loading-skeleton.jpg, stale-refresh.jpg, api-single-point.jpg, dynamic-partial-mobile.jpg.
- Coordinated with BE chat at the user's explicit authorization. Read its actual contract and parsed live GET3001/v1/dashboard through this project's real adapter: measured completed=0, null presence/latency/cost/history/session rows and API/PostgreSQL health preserved. No lifecycle count substituted for connection presence. Compatible with internal version1 local aggregate envelope; production admin identity, provider measurements, sensitive session data and default frontend wiring remain unconnected. Mock preview is preserved.
- No parent mobile/backend files changed. No production service or PostHog ingestion acceptance claimed. Local fixture is synthetic and disposable; no real-user content is used.

## October13 PostgreSQL demo integration

- User-authorized seeded database/API display test uses the separate backend `/v1/dashboard/demo`. `npm run dev:db-demo` starts http://127.0.0.1:5175 with an explicit startup disclosure. Response synthetic:true is retained as source db-demo. Mock mode remains the default for ordinary dev.
- Backend demo schema has66 synthetic sessions/721 hourly samples. UI shows6 frozen current rows and SQL-derived completion/history metrics. Operational backend storage remains empty of customer accounts; real AI/voice/queues/forecast are unconfigured. No private content, identity or billing integration.
- Check,13 tests and build PASS. Live backend smoke parsed Today/7/30-day responses through this actual HTTP adapter; canonical UTC boundaries and synthetic marker preserved.
- Browser verified reporting-period requests (Today2 completions,7days14,30days60), Refresh, search, reconnecting filter, paid/trial detail and corrected source disclosure. SQL edit DEMO-061 answers14→77 appeared after Refresh and in its detail dialog, then restored14. Float artifacts in trial latency discovered visually and fixed using the shared number formatter.
- Desktop1440×900 and narrow375×667 inspected; session table intentionally scrolls horizontally. Screenshots: `db-demo/desktop.png`, `db-demo/mobile.png`, `db-demo/mobile-detail.png`, `db-demo/database-change.png`. Browser tab retained as deliverable; viewport override reset.
- Docker read-only error recovered with a volume-preserving restart; backend reran27 real PostgreSQL tests successfully. No production deployment/auth/provider/PostHog/native acceptance claimed.
