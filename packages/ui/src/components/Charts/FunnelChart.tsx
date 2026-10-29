import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame';
import { type FunnelStageDrawing, funnelScale, funnelStage } from './Charts.logic';
import type { ChartDatum, ChartWords, FunnelChartProps } from './Charts.types';
import { chartSlot } from './chart-palette';

interface WebFunnelChartProps extends FunnelChartProps {
  className?: string;
  style?: CSSProperties;
}

interface FunnelStageProps {
  stage: ChartDatum;
  index: number;
  drawn: FunnelStageDrawing;
  format: (n: number) => string;
  lowConversionBelow: number;
  carriedForward: ChartWords['carriedForward'];
}

/** One stage bar, plus the percentage carried forward from the stage above it. */
function FunnelStage({
  stage,
  index,
  drawn,
  format,
  lowConversionBelow,
  carriedForward,
}: FunnelStageProps) {
  const { conversion } = drawn;
  return (
    <div>
      <div className="hg-charts-funnel-row">
        <span className="hg-charts-funnel-label">{stage.label}</span>
        <span className="hg-charts-funnel-track">
          <span
            className="hg-charts-funnel-fill hg-charts-slot"
            data-slot={stage.color === undefined ? chartSlot(index) : undefined}
            style={{
              width: `${drawn.widthPercent}%`,
              opacity: drawn.opacity,
              ...(stage.color === undefined ? {} : { background: stage.color }),
            }}
          />
        </span>
        <span className="hg-charts-funnel-value">{format(stage.value)}</span>
      </div>
      {conversion === null ? null : (
        <div className="hg-charts-funnel-conversion">
          <span data-low={conversion < lowConversionBelow ? 'true' : undefined}>
            {carriedForward(conversion)}
          </span>
        </div>
      )}
    </div>
  );
}

/** Pipeline funnel; shows the carried-forward percentage between stages. */
export function FunnelChart({
  stages,
  format,
  minPoints = 2,
  lowConversionBelow,
  ...frame
}: WebFunnelChartProps) {
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const { insufficient, top, height } = funnelScale(stages, minPoints);

  return (
    <ChartFrame
      {...frame}
      height={height}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? frame.words.funnelInsufficient}
    >
      <div className="hg-charts-funnel">
        {stages.map((stage, i) => (
          <FunnelStage
            key={stage.label}
            stage={stage}
            index={i}
            drawn={funnelStage(stages, i, top)}
            format={fmt}
            lowConversionBelow={lowConversionBelow}
            carriedForward={frame.words.carriedForward}
          />
        ))}
      </div>
    </ChartFrame>
  );
}
