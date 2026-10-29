import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame';
import { ChartLegend } from './ChartLegend';
import { chartLegendItems, donutCentre, donutDrawing } from './Charts.logic';
import type { DonutChartProps } from './Charts.types';
import { CHART_TRACK_VAR, chartVar } from './ChartTokens';

interface WebDonutChartProps extends DonutChartProps {
  className?: string;
  style?: CSSProperties;
}

/** Composition donut with a centred total and a value legend. */
export function DonutChart({
  data,
  size = 168,
  thickness = 22,
  format,
  centerLabel,
  centerValue,
  minPoints = 1,
  ...frame
}: WebDonutChartProps) {
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const { total, insufficient, radius, circumference, segments } = donutDrawing(
    data,
    size,
    thickness,
    minPoints,
  );
  const label = frame.title ?? frame.words.donutChart;

  return (
    <ChartFrame
      {...frame}
      height={size}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? frame.words.donutInsufficient}
    >
      <div className="hg-charts-donut">
        <div className="hg-charts-donut-ring" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            role="img"
            aria-label={label}
            className="hg-charts-donut-svg"
          >
            <title>{label}</title>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={CHART_TRACK_VAR}
              strokeWidth={thickness}
            />
            {segments.map((segment) => (
              <circle
                key={segment.datum.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.datum.color ?? chartVar(segment.index)}
                strokeWidth={thickness}
                strokeDasharray={`${segment.length} ${circumference}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="hg-charts-donut-center">
            <div>
              <div className="hg-charts-donut-total">{donutCentre(centerValue, total, fmt)}</div>
              {centerLabel ? <div className="hg-charts-donut-label">{centerLabel}</div> : null}
            </div>
          </div>
        </div>
        <ChartLegend className="hg-charts-donut-legend" items={chartLegendItems(data, fmt)} />
      </div>
    </ChartFrame>
  );
}
