import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { ChartFrameBody } from './ChartFrameBody';
import { ChartProvenance } from './ChartProvenance';
import type { ChartFrameProps } from './Charts.types';
import { chartFrameReading } from './chart-state';

interface WebChartFrameProps extends ChartFrameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Shared chart shell: caption, provenance tier, legend, and the loading / empty / error /
 * not-enough-data states. Wrap a custom plot in this rather than inventing states for it.
 */
export function ChartFrame(props: WebChartFrameProps) {
  const {
    overline,
    title,
    value,
    legend,
    action,
    height = 200,
    words,
    children,
    className,
    style,
  } = props;
  const { state, onRetry, facts, stateNote, hasCaption, showsLegend } = chartFrameReading(props);
  /* The frame stays while a retried read reloads, so focus lands on it once *Try again* leaves. */
  const frame = useRef<HTMLElement>(null);

  return (
    <figure
      ref={frame}
      tabIndex={-1}
      className={classNames('hg-charts-frame', 'hg-focus-target', className)}
      style={style}
    >
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

      <ChartFrameBody
        state={state}
        height={height}
        note={stateNote}
        words={words}
        onRetry={onRetry}
        focusAfter={frame}
      >
        {children}
      </ChartFrameBody>

      {showsLegend ? <div className="hg-charts-legend-slot">{legend}</div> : null}
    </figure>
  );
}
