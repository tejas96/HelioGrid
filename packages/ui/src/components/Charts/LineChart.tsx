import type { CSSProperties } from 'react';
import { ChartFrame } from './ChartFrame';
import type { LineChartProps } from './Charts.types';
import { CHART_GRIDLINE_VAR, CHART_GROUND_VAR, chartVar } from './ChartTokens';
import { chartTicks } from './chart-palette';
import { lineGeometry, lineSetDrawing, longestSeries, toLineSeries } from './chart-series';
import { useChartWidth } from './use-chart-width';

interface WebLineChartProps extends LineChartProps {
  className?: string;
  style?: CSSProperties;
}

/** Trend line with a soft area wash on single series; last point carries the dot. */
export function LineChart({
  series,
  height = 200,
  format: _format,
  minPoints = 2,
  area = true,
  gridlines = 4,
  ...frame
}: WebLineChartProps) {
  const { ref, width } = useChartWidth();
  const sets = toLineSeries(series);
  /* A line with one point cannot show a trend, so the frame says so instead of drawing one. */
  const insufficient = longestSeries(sets) < minPoints;
  const geo = lineGeometry(sets, width, height);
  const axis = sets[0]?.points ?? [];

  return (
    <div ref={ref}>
      <ChartFrame {...frame} height={height} insufficient={insufficient}>
        <div className="hg-charts-line-plot" style={{ height }}>
          <svg
            width="100%"
            height={geo.height}
            viewBox={`0 0 ${geo.width} ${geo.height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={frame.title ?? frame.words.lineChart}
            className="hg-charts-line-svg"
          >
            <title>{frame.title ?? frame.words.lineChart}</title>
            {chartTicks(geo.height, gridlines).map((offset) => (
              <line
                key={offset}
                x1="0"
                x2={geo.width}
                y1={offset}
                y2={offset}
                stroke={CHART_GRIDLINE_VAR}
                strokeWidth="1"
              />
            ))}
            {sets.map((set, si) => {
              const drawn = lineSetDrawing(set, si, geo, area && sets.length === 1);
              const stroke = set.color ?? chartVar(si);
              return (
                <g key={drawn.key}>
                  {drawn.area === null ? null : (
                    <polygon points={drawn.area} fill={stroke} opacity="0.08" />
                  )}
                  <polyline
                    points={drawn.points}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {drawn.end === null ? null : (
                    <circle
                      cx={drawn.end.x}
                      cy={drawn.end.y}
                      r={4}
                      fill={CHART_GROUND_VAR}
                      stroke={stroke}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="hg-charts-line-axis">
            {axis.map((point) => (
              <span key={String(point.x)} className="hg-charts-line-tick">
                {point.x}
              </span>
            ))}
          </div>
        </div>
      </ChartFrame>
    </div>
  );
}
