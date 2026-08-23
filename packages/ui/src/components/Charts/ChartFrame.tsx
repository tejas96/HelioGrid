import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ChartFrameBody } from './ChartFrameBody';
import { ChartProvenance } from './ChartProvenance';
import type { ChartFrameProps } from './Charts.types';
import { chartProvenanceFacts } from './chart-provenance';
import {
  CHART_EMPTY_TITLE,
  CHART_ERROR_MESSAGE,
  CHART_ERROR_TITLE,
  CHART_INSUFFICIENT_MESSAGE,
  chartNote,
} from './chart-state';

interface WebChartFrameProps extends ChartFrameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Shared chart shell: caption, provenance tier, legend, and the loading / empty / error /
 * not-enough-data states. Wrap a custom plot in this rather than inventing states for it.
 */
export function ChartFrame({
  overline,
  title,
  value,
  provenance,
  standing,
  source,
  projection,
  note,
  legend,
  action,
  state = 'ready',
  height = 200,
  insufficient = false,
  emptyTitle = CHART_EMPTY_TITLE,
  emptyMessage,
  insufficientMessage = CHART_INSUFFICIENT_MESSAGE,
  errorTitle = CHART_ERROR_TITLE,
  errorMessage = CHART_ERROR_MESSAGE,
  onRetry,
  children,
  className,
  style,
}: WebChartFrameProps) {
  /* One provenance line under the headline value — word first, dot second (F8-07). */
  const facts = chartProvenanceFacts({ provenance, standing, source, projection, note });
  const stateNote = chartNote({
    state,
    insufficient,
    emptyTitle,
    emptyMessage,
    insufficientMessage,
    errorTitle,
    errorMessage,
  });
  const hasCaption = Boolean(overline) || Boolean(title) || Boolean(value) || Boolean(action);

  return (
    <figure className={classNames('hg-charts-frame', className)} style={style}>
      {hasCaption ? (
        <figcaption className="hg-charts-caption">
          <div className="hg-charts-caption-head">
            {overline ? <div className="hg-charts-overline">{overline}</div> : null}
            {title ? <div className="hg-charts-title">{title}</div> : null}
            {value ? <div className="hg-charts-value">{value}</div> : null}
            <ChartProvenance facts={facts} />
          </div>
          {action}
        </figcaption>
      ) : null}

      <ChartFrameBody state={state} height={height} note={stateNote} onRetry={onRetry}>
        {children}
      </ChartFrameBody>

      {legend && stateNote === null && state !== 'loading' ? (
        <div className="hg-charts-legend-slot">{legend}</div>
      ) : null}
    </figure>
  );
}
