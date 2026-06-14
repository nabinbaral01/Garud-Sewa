type Series = { name: string; color: string; values: number[] };

export default function LineChart({
  labels,
  series,
  height = 220,
  showLegend = false,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  showLegend?: boolean;
}) {
  const W = 720;
  const H = height;
  const pad = { top: 16, right: 16, bottom: 28, left: 30 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const n = labels.length;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  // round the axis max up to a "nice" number
  const axisMax = max <= 4 ? 4 : Math.ceil(max / 5) * 5;

  const x = (i: number) => pad.left + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => pad.top + innerH - (v / axisMax) * innerH;

  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => (axisMax / ticks) * i);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img">
        {/* horizontal grid + y labels */}
        {gridVals.map((gv, i) => {
          const gy = y(gv);
          return (
            <g key={i}>
              <line x1={pad.left} x2={W - pad.right} y1={gy} y2={gy} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.left - 6} y={gy + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
                {Math.round(gv)}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {labels.map((lb, i) => (
          <text key={lb + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
            {lb}
          </text>
        ))}

        {/* series */}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill="#fff" stroke={s.color} strokeWidth={2} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* legend */}
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-4 px-2">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.name} <span className="font-semibold text-[var(--ink)]">{s.values.reduce((a, b) => a + b, 0)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
