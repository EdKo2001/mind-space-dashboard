export type Trend = {
  direction: "up" | "down" | "flat";
  tone: "positive" | "negative" | "neutral";
  text: string;
};
export function metricTrend(
  current: number | null,
  previous: number | null,
  higherIsBetter: boolean,
  unit: "percent" | "points" = "percent",
): Trend {
  if (
    current === null ||
    previous === null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  )
    return {
      direction: "flat",
      tone: "neutral",
      text: "Comparison unavailable",
    };
  const difference = current - previous;
  if (difference === 0)
    return { direction: "flat", tone: "neutral", text: "No change" };
  const direction = difference > 0 ? "up" : "down";
  const tone = difference > 0 === higherIsBetter ? "positive" : "negative";
  if (previous === 0 && unit === "percent")
    return { direction, tone, text: "New activity" };
  const change =
    unit === "points" ? difference : (difference / Math.abs(previous)) * 100;
  return {
    direction,
    tone,
    text: `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}${unit === "points" ? " pp" : "%"}`,
  };
}
