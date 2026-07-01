"use client";

/** Lightweight inline SVG area sparkline — no chart library, 60fps, tiny bundle. */
export function Sparkline({
  data,
  width = 560,
  height = 120,
  className,
  stroke = "var(--brand-500)",
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  stroke?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1]![0].toFixed(1)},${height - pad} L${points[0]![0].toFixed(1)},${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" role="img" aria-label="Trend">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1]![0]} cy={points[points.length - 1]![1]} r={3.5} fill={stroke} />
    </svg>
  );
}
