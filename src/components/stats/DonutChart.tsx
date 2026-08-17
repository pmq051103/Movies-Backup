interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel: string;
  centerSublabel: string;
}

/**
 * Minimal SVG donut chart — no charting library needed for 1-3 segments.
 * Each segment is a <circle> stroke-dasharray slice, rotated into place.
 */
export default function DonutChart({ segments, centerLabel, centerSublabel }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-gray-800"
            strokeWidth="16"
          />
          {segments.map((s) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offsetAcc}
                strokeLinecap="butt"
              />
            );
            offsetAcc += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{centerLabel}</span>
          <span className="text-[11px] text-gray-500">{centerSublabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-gray-300">{s.label}</span>
            <span className="font-semibold text-white">{s.value}</span>
            <span className="text-xs text-gray-500">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
