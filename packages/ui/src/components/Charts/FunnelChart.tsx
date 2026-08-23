import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame';
import type { ChartDatum, FunnelChartProps } from './Charts.types';
import { chartSlot } from './chart-palette';

interface WebFunnelChartProps extends FunnelChartProps {
  className?: string;
  style?: CSSProperties;
}

const INSUFFICIENT = 'A funnel needs at least two stages with recorded values.';
/** Below this, the carried-forward figure is called out. */
const LOW_CONVERSION = 40;

interface FunnelStageProps {
  stage: ChartDatum;
  index: number;
  top: number;
  /** The stage above, or null at the mouth of the funnel. */
  previous: number | null;
  format: (n: number) => string;
}

/** One stage bar, plus the percentage carried forward from the stage above it. */
function FunnelStage({ stage, index, top, previous, format }: FunnelStageProps) {
  const conversion =
    previous === null || previous === 0 ? null : Math.round(((stage.value || 0) / previous) * 100);
  return (
    <div>
      <div className="hg-charts-funnel-row">
        <span className="hg-charts-funnel-label">{stage.label}</span>
        <span className="hg-charts-funnel-track">
          <span
            className="hg-charts-funnel-fill hg-charts-slot"
            data-slot={stage.color === undefined ? chartSlot(index) : undefined}
            style={{
              width: `${Math.max(2, ((stage.value || 0) / top) * 100)}%`,
              opacity: 1 - index * 0.13,
              ...(stage.color === undefined ? {} : { background: stage.color }),
            }}
          />
        </span>
        <span className="hg-charts-funnel-value">{format(stage.value)}</span>
      </div>
      {conversion === null ? null : (
        <div className="hg-charts-funnel-conversion">
          <span data-low={conversion < LOW_CONVERSION ? 'true' : undefined}>
            {conversion}% carried forward
          </span>
        </div>
      )}
    </div>
  );
}

/** Pipeline funnel; shows the carried-forward percentage between stages. */
export function FunnelChart({ stages, format, minPoints = 2, ...frame }: WebFunnelChartProps) {
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const insufficient = stages.length < minPoints;
  const top = Math.max(1, ...stages.map((s) => s.value || 0));

  return (
    <ChartFrame
      {...frame}
      height={Math.max(160, stages.length * 56)}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? INSUFFICIENT}
    >
      <div className="hg-charts-funnel">
        {stages.map((stage, i) => (
          <FunnelStage
            key={stage.label}
            stage={stage}
            index={i}
            top={top}
            previous={i > 0 ? (stages[i - 1]?.value ?? 0) : null}
            format={fmt}
          />
        ))}
      </div>
    </ChartFrame>
  );
}
