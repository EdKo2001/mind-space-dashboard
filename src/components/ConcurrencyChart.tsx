import { useState } from "react";
import type { Dashboard } from "../data/dashboard";
export function ConcurrencyChart({
  data,
  timezone,
}: {
  data: Dashboard;
  timezone: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const samples = data.concurrency,
    left = 48,
    top = 20,
    width = 852,
    height = 232;
  const x = (i: number) => left + (i * width) / (samples.length - 1);
  const y = (count: number) => top + height - (count / 300) * height;
  const line = samples
    .map((sample, i) => `${i ? "L" : "M"}${x(i)},${y(sample.count)}`)
    .join(" ");
  const area = `${line} L${x(samples.length - 1)},${y(0)} L${left},${y(0)} Z`;
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
  const selected =
    hover === null || hover >= samples.length
      ? samples.findIndex((sample) => sample.count === data.peak)
      : hover;
  return (
    <div className="chart">
      <svg
        viewBox="0 0 932 296"
        role="img"
        aria-label={`Sample concurrency chart. Peak ${data.peak}; capacity ${data.capacity}. ${data.granularity === "daily" ? "Sampled peaks." : "Hourly samples."}`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b7cff" stopOpacity=".3" />
            <stop offset="100%" stopColor="#8b7cff" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[0, 50, 100, 150, 200, 250, 300].map((value) => (
          <g key={value}>
            <line
              x1={left}
              x2={left + width}
              y1={y(value)}
              y2={y(value)}
              className="grid-line"
            />
            <text x={left - 13} y={y(value) + 4} textAnchor="end">
              {value}
            </text>
          </g>
        ))}
        {samples.map(
          (sample, i) =>
            (i % Math.ceil(samples.length / 7) === 0 ||
              i === samples.length - 1) && (
              <g key={sample.at}>
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1={top}
                  y2={y(0)}
                  className="grid-line vertical"
                />
                <text x={x(i)} y={280} textAnchor="middle">
                  {label(sample.at)}
                </text>
              </g>
            ),
        )}
        <path d={area} fill="url(#chart-fill)" />
        <line
          x1={left}
          x2={left + width}
          y1={y(data.capacity)}
          y2={y(data.capacity)}
          stroke="#afbad1"
          strokeDasharray="6 6"
        />
        <text x={left + width} y={y(data.capacity) - 10} textAnchor="end">
          Capacity {data.capacity}
        </text>
        <path
          d={line}
          fill="none"
          stroke="#9180ff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {selected >= 0 && (
          <g>
            <line
              x1={x(selected)}
              x2={x(selected)}
              y1={top + 36}
              y2={y(0)}
              stroke="#9180ff"
              strokeOpacity=".25"
            />
            <circle
              cx={x(selected)}
              cy={y(samples[selected].count)}
              r="5"
              fill="#9180ff"
              stroke="#bbb1ff"
              strokeWidth="2"
            />
            <text
              className="chart-callout"
              x={Math.min(x(selected) + 12, 800)}
              y={Math.max(y(samples[selected].count) - 18, 40)}
            >
              {samples[selected].count} · {label(samples[selected].at)}
            </text>
          </g>
        )}
        {samples.map((sample, i) => (
          <rect
            key={sample.at}
            x={x(i) - width / samples.length / 2}
            y={top}
            width={width / samples.length}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
    </div>
  );
}
