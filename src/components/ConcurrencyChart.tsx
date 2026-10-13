import { useMemo, useState } from "react";
import type { Dashboard } from "../data/dashboard";
import { chartSamples, chartCeiling } from "../data/chart";
export function ConcurrencyChart({
  data,
  timezone,
}: {
  data: Dashboard;
  timezone: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const samples = useMemo(
    () => chartSamples(data.concurrency ?? []),
    [data.concurrency],
  );
  const ceiling = chartCeiling(samples, data.capacity);
  const left = 55,
    top = 20,
    width = 835,
    height = 230;
  const first = samples.length ? Date.parse(samples[0].at) : 0,
    last = samples.length ? Date.parse(samples[samples.length - 1].at) : 0;
  const x = (i: number) =>
    first === last
      ? left + width / 2
      : left + ((Date.parse(samples[i].at) - first) / (last - first)) * width;
  const y = (value: number) => top + height - (value / ceiling) * height;
  const segments: number[][] = [];
  samples.forEach((p, i) => {
    if (p.count === null) return;
    if (i === 0 || samples[i - 1].count === null) segments.push([]);
    segments[segments.length - 1].push(i);
  });
  const label = (at: string) =>
    new Intl.DateTimeFormat(
      "en-US",
      data.granularity === "intraday"
        ? {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        : {
            timeZone: timezone,
            month: "short",
            day: "numeric",
            ...(data.range.calendarDays > 300
              ? { year: "2-digit" as const }
              : {}),
          },
    ).format(new Date(at));
  const peak = samples.reduce(
    (best, p, i) =>
      p.count !== null && (best < 0 || p.count > (samples[best].count ?? 0))
        ? i
        : best,
    -1,
  );
  const hoveredIndex = samples.findIndex(
    (point) => point.at === hover && point.count !== null,
  );
  const selected = hoveredIndex >= 0 ? hoveredIndex : peak;
  if (data.concurrency === null || !segments.length)
    return (
      <div className="empty-state chart-empty">
        <strong>
          {data.concurrency === null
            ? "Chart data unavailable"
            : "No measured chart points"}
        </strong>
        <p>
          {data.concurrency === null
            ? "The source has not supplied concurrency measurements."
            : "Zero activity and missing measurements are kept distinct."}
        </p>
      </div>
    );
  return (
    <div className="chart">
      <svg
        viewBox="0 0 950 298"
        role="img"
        aria-label={`Concurrency chart with ${samples.length} points. ${data.capacity === null ? "Capacity unavailable." : `Capacity ${data.capacity}.`} Gaps represent unavailable measurements.`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b7cff" stopOpacity=".3" />
            <stop offset="100%" stopColor="#8b7cff" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {Array.from({ length: 6 }, (_, i) => (ceiling * i) / 5).map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={left + width}
              y1={y(v)}
              y2={y(v)}
              className="grid-line"
            />
            <text x={left - 10} y={y(v) + 4} textAnchor="end">
              {new Intl.NumberFormat("en-US", {
                notation: v >= 10000 ? "compact" : "standard",
                maximumFractionDigits: 1,
              }).format(v)}
            </text>
          </g>
        ))}
        {samples.map(
          (p, i) =>
            (i % Math.max(1, Math.ceil(samples.length / 6)) === 0 ||
              i === samples.length - 1) && (
              <text key={p.at} x={x(i)} y={278} textAnchor="middle">
                {label(p.at)}
              </text>
            ),
        )}
        {data.capacity !== null && (
          <g>
            <line
              x1={left}
              x2={left + width}
              y1={y(data.capacity)}
              y2={y(data.capacity)}
              stroke="#afbad1"
              strokeDasharray="6 6"
            />
            <text x={left + width} y={y(data.capacity) - 9} textAnchor="end">
              Capacity {data.capacity}
            </text>
          </g>
        )}
        {segments.map((indices, index) => {
          const line = indices
            .map((i, j) => `${j ? "L" : "M"}${x(i)},${y(samples[i].count!)}`)
            .join(" ");
          return (
            <g key={index}>
              {indices.length > 1 && (
                <path
                  d={`${line} L${x(indices[indices.length - 1])},${y(0)} L${x(indices[0])},${y(0)} Z`}
                  fill="url(#chart-fill)"
                />
              )}
              <path d={line} fill="none" stroke="#9180ff" strokeWidth="3" />
              {indices.length === 1 && (
                <circle
                  cx={x(indices[0])}
                  cy={y(samples[indices[0]].count!)}
                  r="4"
                  fill="#9180ff"
                />
              )}
            </g>
          );
        })}
        {selected >= 0 && (
          <g>
            <circle
              cx={x(selected)}
              cy={y(samples[selected].count!)}
              r="5"
              fill="#9180ff"
            />
            <text
              className="chart-callout"
              x={Math.min(x(selected) + 12, 790)}
              y={Math.max(y(samples[selected].count!) - 16, 35)}
            >
              {samples[selected].count} · {label(samples[selected].at)}
            </text>
          </g>
        )}
        {samples.map((p, i) => (
          <rect
            key={p.at}
            x={x(i) - 10}
            y={top}
            width={20}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(p.at)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
    </div>
  );
}
