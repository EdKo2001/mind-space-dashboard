// Public endpoint URL only. Never put tokens or provider credentials in VITE_* variables.
export const API_ENDPOINT = import.meta.env.VITE_DASHBOARD_API_URL as
  string | undefined;

// Public preview mode, not a credential. The response marker also labels seeded data.
export const DB_DEMO_MODE = import.meta.env.VITE_DASHBOARD_DEMO === "1";
