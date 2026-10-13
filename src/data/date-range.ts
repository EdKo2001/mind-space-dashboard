export type Period =
  "today" | "week" | "30days" | "90days" | "360days" | "custom";
export type RangeQuery = {
  period: Period;
  timezone: string;
  startDate?: string;
  endDate?: string;
};
export type DateRange = {
  start: string;
  end: string;
  label: string;
  calendarDays: number;
};
export const FIXTURE_NOW = "2026-10-14T04:45:00Z";
export const PERIODS: Record<Period, string> = {
  today: "Today",
  week: "Last 7 days",
  "30days": "Last 30 days",
  "90days": "Last 90 days",
  "360days": "Last 360 days",
  custom: "Custom range",
};
export function dateInZone(instant: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
function validDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
  );
}
// Convert calendar midnight, resolving the offset for that specific date (including DST).
function midnight(date: string, timezone: string): number {
  const wall = Date.parse(`${date}T00:00:00Z`);
  let instant = wall;
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 4; i++) {
    const p = format.formatToParts(new Date(instant));
    const value = (key: string) =>
      Number(p.find((item) => item.type === key)!.value);
    const represented = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    );
    const correction = wall - represented;
    if (correction === 0) return instant;
    instant += correction;
  }
  throw new Error("Unable to resolve calendar midnight in this timezone.");
}
export function resolveDateRange(
  query: RangeQuery,
  now = FIXTURE_NOW,
): DateRange {
  const today = dateInZone(now, query.timezone);
  const days = {
    today: 1,
    week: 7,
    "30days": 30,
    "90days": 90,
    "360days": 360,
  };
  const startDate =
    query.period === "custom"
      ? (query.startDate ?? "")
      : shiftDate(today, -(days[query.period] - 1));
  const endDate = query.period === "custom" ? (query.endDate ?? "") : today;
  if (!validDate(startDate) || !validDate(endDate))
    throw new Error("Choose valid start and end dates.");
  if (startDate > endDate)
    throw new Error("Start date must be on or before end date.");
  if (endDate > today)
    throw new Error("End date cannot be after the sample snapshot date.");
  const calendarDays =
    Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1;
  return {
    start: new Date(midnight(startDate, query.timezone)).toISOString(),
    end: new Date(
      Math.min(
        midnight(shiftDate(endDate, 1), query.timezone),
        Date.parse(now),
      ),
    ).toISOString(),
    label:
      query.period === "custom"
        ? `${startDate} – ${endDate}`
        : PERIODS[query.period],
    calendarDays,
  };
}
