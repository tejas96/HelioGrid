import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame';
import { ChartLegend } from './ChartLegend';
import type { DonutChartProps } from './Charts.types';
import { CHART_TRACK_VAR, chartVar } from './ChartTokens';

interface WebDonutChartProps extends DonutChartProps {
  className?: string;
  style?: CSSProperties;
}

const INSUFFICIENT = 'Nothing to split yet — this needs at least one recorded value.';

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
  const total = data.reduce((n, d) => n + (d.value || 0), 0);
  const insufficient = data.filter((d) => d.value > 0).length < minPoints || total <= 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const label = frame.title ?? 'Donut chart';
  let offset = 0;

  return (
    <ChartFrame
      {...frame}
      height={size}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? INSUFFICIENT}
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
            {data.map((d, i) => {
              const fraction = (d.value || 0) / (total || 1);
              const segment = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color ?? chartVar(i)}
                  strokeWidth={thickness}
                  strokeDasharray={`${fraction * circumference} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += fraction * circumference;
              return segment;
            })}
          </svg>
          <div className="hg-charts-donut-center">
            <div>
              <div className="hg-charts-donut-total">
                {centerValue === undefined || centerValue === null ? fmt(total) : centerValue}
              </div>
              {centerLabel ? <div className="hg-charts-donut-label">{centerLabel}</div> : null}
            </div>
          </div>
        </div>
        <ChartLegend
          className="hg-charts-donut-legend"
          items={data.map((d) => ({ label: d.label, color: d.color, value: fmt(d.value) }))}
        />
      </div>
    </ChartFrame>
  );
}
