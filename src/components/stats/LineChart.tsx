import { useRef, useState } from 'react';

interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  points: LineChartPoint[];
}

/**
 * Minimal SVG area/line chart — no charting library needed for a
 * single daily-count series. Scales to the max value in the series.
 * Hovering a data point shows its exact count in a tooltip.
 */
export default function LineChart({ points }: LineChartProps) {
  const width = 600;
  const height = 180;
  // Left padding is wider than the others — it's where the Y-axis value
  // labels (0 / max / in-between) live, so the plot area starts after them
  // instead of the labels overlapping the first data point.
  const padLeft = 34;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 16;

  const plotLeft = padLeft;
  const plotRight = width - padRight;
  const plotTop = padTop;
  const plotBottom = height - padBottom;

  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...points.map((p) => p.value), 1);
  const yFor = (v: number) => plotBottom - (v / max) * (plotBottom - plotTop);

  // Y-axis: baseline (0) + 3 evenly-spaced gridlines up to max.
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: Math.round(max * f),
    y: plotBottom - f * (plotBottom - plotTop),
  }));

  const gridlines = yTicks.map((t) => (
    <line
      key={t.y}
      x1={plotLeft}
      x2={plotRight}
      y1={t.y}
      y2={t.y}
      stroke="currentColor"
      className="text-gray-800"
      strokeDasharray="4 4"
    />
  ));

  const yAxisLabels = yTicks.map((t) => (
    <text
      key={`y-${t.y}`}
      x={plotLeft - 8}
      y={t.y}
      dy="3"
      fontSize="9"
      textAnchor="end"
      className="fill-gray-600"
    >
      {t.value}
    </text>
  ));

  const gradientDef = (
    <defs>
      <linearGradient id="statsAreaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </linearGradient>
    </defs>
  );

  // A single-day range (e.g. "Hôm nay") only has one bucket — there's no
  // second point to draw a line to, so a normal line/area chart would
  // just show a lone dot in the corner. Draw a flat reference line
  // spanning the full plot width instead, centered dot + label, so it
  // still reads as a chart rather than looking broken.
  if (points.length <= 1) {
    const point = points[0];
    const y = point ? yFor(point.value) : plotBottom;
    const midX = (plotLeft + plotRight) / 2;

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {gridlines}
        {yAxisLabels}
        {gradientDef}
        {point && (
          <>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={y}
              y2={y}
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={point.value > 0 ? 1 : 0.35}
              strokeDasharray={point.value > 0 ? undefined : '4 4'}
            />
            <circle
              cx={midX}
              cy={y}
              r={point.value > 0 ? 5 : 3}
              fill="#ef4444"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(0)}
              onMouseMove={() => setHovered(0)}
              onMouseLeave={() => setHovered(null)}
            />
            <text x={midX} y={height + 4} fontSize="9" textAnchor="middle" className="fill-gray-600">
              {point.label}
            </text>
            {hovered === 0 && (
              <g pointerEvents="none">
                <rect
                  x={midX - 4}
                  y={y - 4}
                  width="8"
                  height="8"
                  fill="#fff"
                  opacity="0.9"
                  rx="1.5"
                />
                <text
                  x={midX}
                  y={y - 9}
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="middle"
                  className="fill-white"
                >
                  {point.value}
                </text>
              </g>
            )}
          </>
        )}
      </svg>
    );
  }

  const stepX = (plotRight - plotLeft) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = plotLeft + i * stepX;
    const y = yFor(p.value);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1]?.x ?? 0},${plotBottom} L${coords[0]?.x ?? 0},${plotBottom} Z`;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left;
    const viewX = (relX / rect.width) * width;
    const idx = Math.round((viewX - plotLeft) / stepX);
    setHovered(Math.max(0, Math.min(points.length - 1, idx)));
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
    >
      {gridlines}
      {yAxisLabels}
      {gradientDef}

      <path d={areaPath} fill="url(#statsAreaFill)" />
      <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c, i) => (
        <circle
          key={c.label}
          cx={c.x}
          cy={c.y}
          r={hovered === i ? 7 : c.value > 0 ? 4 : 2.5}
          fill={hovered === i ? '#f87171' : '#ef4444'}
          className="cursor-pointer"
          style={{ transition: 'r 0.15s ease' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {hovered !== null && coords[hovered] && (
        <g pointerEvents="none">
          <rect
            x={coords[hovered].x - 5}
            y={coords[hovered].y - 5}
            width="10"
            height="10"
            fill="#fff"
            opacity="0.9"
            rx="2"
          />
          <text
            x={coords[hovered].x}
            y={coords[hovered].y - 11}
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            className="fill-white"
          >
            {coords[hovered].value}
          </text>
        </g>
      )}

      {coords.map((c) => (
        <text
          key={`${c.label}-label`}
          x={c.x}
          y={height + 4}
          fontSize="9"
          textAnchor="middle"
          className="fill-gray-600"
        >
          {c.label}
        </text>
      ))}
    </svg>
  );
}
