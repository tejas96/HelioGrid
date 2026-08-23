import type { CSSProperties } from 'react';
import { ChartFrame } from './ChartFrame';
import type { LineChartProps } from './Charts.types';
import { CHART_GRIDLINE_VAR, CHART_SURFACE_VAR, chartVar } from './ChartTokens';
import { chartTicks } from './chart-palette';
import { lineGeometry, longestSeries, toLineSeries } from './chart-series';
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
            aria-label={frame.title ?? 'Line chart'}
            className="hg-charts-line-svg"
          >
            <title>{frame.title ?? 'Line chart'}</title>
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
              const points = set.points
                .map((p, i) => `${geo.x(i, set.points.length)},${geo.y(p.y)}`)
                .join(' ');
              const stroke = set.color ?? chartVar(si);
              const last = set.points[set.points.length - 1];
              return (
                <g key={set.name === undefined || set.name === '' ? `series-${si}` : set.name}>
                  {area && sets.length === 1 ? (
                    <polygon
                      points={`${geo.pad},${geo.height} ${points} ${geo.width - geo.pad},${geo.height}`}
                      fill={stroke}
                      opacity="0.08"
                    />
                  ) : null}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {last === undefined ? null : (
                    <circle
                      cx={geo.x(set.points.length - 1, set.points.length)}
                      cy={geo.y(last.y)}
                      r={4}
                      fill={CHART_SURFACE_VAR}
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
