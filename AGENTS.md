# MindSpace Dashboard

This directory is a standalone browser dashboard, not the Expo mobile application. Keep its package, TypeScript, lint, build and Git ownership independent of the parent checkout. Use React/TypeScript/Vite conventions here; Expo routing/install commands apply only to the mobile app.

- Preserve the selected dark operations concept and the one-page custom overview / PostHog analytics split.
- Keep all mock activity visibly labeled. Never imply real authentication, billing, connected services, AI, or analytics ingestion.
- Reuse the typed adapter in src/data/dashboard.ts and shared components/theme; replace the adapter when endpoints are supplied.
- No sensitive session content, persistence, telemetry, or credentials without explicit integration requirements.
- Use 45-minute paid and 10-minute trial types. Display unavailable measurements distinctly from zero.
- Before completion, run npm run check and npm run build; inspect browser interactions and responsive layouts.
- Repository: https://github.com/EdKo2001/mind-space-dashboard. Do not modify the mobile app or its repository to implement dashboard features.
