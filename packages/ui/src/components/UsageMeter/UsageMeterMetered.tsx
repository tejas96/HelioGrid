import type { CSSProperties, ReactNode, RefObject } from 'react';
import { classNames } from '../../primitives/class-names';
import { UsageMeterTrack } from './UsageMeterTrack';
import { meteredReading, type UsageMeterMeteredFacts } from './usage-meter-model';

export interface UsageMeterMeteredProps extends UsageMeterMeteredFacts {
  frame: RefObject<HTMLElement | null>;
  trackHeight: string;
  provenance: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The reporting meter: figure over denominator, the re-scaling track, BM-27's persistent
 * provenance line, and one status sentence carrying the whole billing situation in words.
 */
export function UsageMeterMetered({
  frame,
  words,
  label,
  value,
  limit,
  unit,
  period,
  bundleName,
  billing,
  thresholdPercent,
  graceDaysLeft,
  note,
  trackHeight,
  format,
  provenance,
  className,
  style,
}: UsageMeterMeteredProps) {
  const { scale, line, trackName, valueText } = meteredReading({
    words,
    label,
    value,
    limit,
    unit,
    period,
    bundleName,
    billing,
    thresholdPercent,
    graceDaysLeft,
    format,
  });

  return (
    <section
      ref={frame}
      tabIndex={-1}
      className={classNames('hg-usage-meter', 'hg-focus-target', className)}
      style={style}
    >
      <div className="hg-usage-meter-head">
        <span className="hg-usage-meter-label">{label}</span>
        <span className="hg-usage-meter-figure">
          <strong>{format(value)}</strong>
          <span className="hg-usage-meter-unit"> {words.ofLimit(format(limit), unit)}</span>
        </span>
      </div>

      <UsageMeterTrack
        scale={scale}
        height={trackHeight}
        accessibilityLabel={trackName}
        valueText={valueText}
        value={value}
        thresholdTitle={words.threshold(thresholdPercent)}
      />

      {/* Period, tier and bundle are the three things BM-27 requires beside the number, and they
          render as one persistent line rather than three loose spans. */}
      {provenance}

      {line !== null ? (
        <p className="hg-usage-meter-status" data-tone={line.tone}>
          {line.words}
        </p>
      ) : null}
      {note !== undefined ? <p className="hg-usage-meter-note">{note}</p> : null}
    </section>
  );
}
