export type Sample = { at: string; count: number | null };
/** Sort, deduplicate, retain explicit gaps, and bound rendering without losing bucket peaks. */
export function chartSamples(input: Sample[], limit = 500): Sample[] {
  const byTime = new Map<number, Sample>();
  for (const point of input) {
    const t = Date.parse(point.at);
    if (
      Number.isFinite(t) &&
      (point.count === null ||
        (Number.isFinite(point.count) && point.count >= 0))
    )
      byTime.set(t, point);
  }
  const sorted = [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, p]) => p);
  if (sorted.length <= limit) return sorted;
  const output: Sample[] = [sorted[0]];
  const size = Math.ceil((sorted.length - 2) / (Math.floor(limit / 2) - 1));
  for (let i = 1; i < sorted.length - 1; i += size) {
    const bucket = sorted.slice(i, Math.min(i + size, sorted.length - 1));
    const gap = bucket.find((p) => p.count === null);
    const peak = bucket
      .filter((p) => p.count !== null)
      .sort((a, b) => b.count! - a.count!)[0];
    if (gap) output.push(gap);
    if (peak) output.push(peak);
  }
  output.push(sorted[sorted.length - 1]);
  return output.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
export function chartCeiling(
  samples: Sample[],
  capacity: number | null,
): number {
  const highest = Math.max(
    0,
    capacity ?? 0,
    ...samples.map((p) => p.count ?? 0),
  );
  if (highest === 0) return 5;
  const step = 10 ** Math.floor(Math.log10(highest)) * 0.5;
  return Math.ceil((highest * 1.15) / step) * step;
}
