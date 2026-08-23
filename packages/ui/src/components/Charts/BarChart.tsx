import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame';
import type { BarChartProps, ChartDatum } from './Charts.types';
import { chartSlot, chartTicks } from './chart-palette';
import { useChartWidth } from './use-chart-width';

interface WebBarChartProps extends BarChartProps {
  className?: string;
  style?: CSSProperties;
}

/** A bar's fill: the datum's own colour, then the chart's, then its palette slot. */
function fill(datum: ChartDatum, color: string | undefined, index: number) {
  const own = datum.color ?? color;
  return {
    slot: own === undefined ? chartSlot(index) : undefined,
    style: own === undefined ? undefined : { background: own },
  };
}

/** Vertical or horizontal bars on --chart-gridline rules. */
export function BarChart({
  data,
  height = 200,
  format,
  minPoints = 1,
  color,
  gridlines = 4,
  horizontal = false,
  ...frame
}: WebBarChartProps) {
  const { ref, width } = useChartWidth();
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  /* Honesty is a product law: below `minPoints` real values the frame says so instead of
     drawing a confident-looking bar. A value that is not a real number is not a real value. */
  const real = data.filter((d) => typeof d.value === 'number' && !Number.isNaN(d.value));
  const insufficient = real.length < minPoints;
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  const ticks = chartTicks(max, gridlines);
  const rawGap = width / (data.length * 6);
  const gap = Math.max(4, Math.min(16, Number.isFinite(rawGap) && rawGap !== 0 ? rawGap : 8));

  return (
    <div ref={ref}>
      <ChartFrame {...frame} height={height} insufficient={insufficient}>
        {horizontal ? (
          <div className="hg-charts-bar-rows">
            {data.map((d, i) => {
              const paint = fill(d, color, i);
              return (
                <div key={d.label} className="hg-charts-bar-row">
                  <span className="hg-charts-bar-row-label">{d.label}</span>
                  <span className="hg-charts-bar-track">
                    <span
                      className="hg-charts-bar-fill hg-charts-slot"
                      data-slot={paint.slot}
                      style={{ width: `${((d.value || 0) / max) * 100}%`, ...paint.style }}
                    />
                  </span>
                  <span className="hg-charts-bar-row-value">{fmt(d.value)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hg-charts-bar-plot" style={{ height }}>
            <div aria-hidden="true" className="hg-charts-bar-grid">
              {ticks.map((tick) => (
                <span key={tick} className="hg-charts-bar-rule" />
              ))}
            </div>
            <div className="hg-charts-bar-columns" style={{ gap }}>
              {data.map((d, i) => {
                const paint = fill(d, color, i);
                return (
                  <div
                    key={d.label}
                    className="hg-charts-bar-column"
                    title={`${d.label}: ${fmt(d.value)}`}
                  >
                    <span
                      className="hg-charts-bar-bar hg-charts-slot"
                      data-slot={paint.slot}
                      style={{ height: `${((d.value || 0) / max) * 100}%`, ...paint.style }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="hg-charts-bar-axis">
              {data.map((d) => (
                <span key={d.label} className="hg-charts-bar-tick">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </ChartFrame>
    </div>
  );
}
