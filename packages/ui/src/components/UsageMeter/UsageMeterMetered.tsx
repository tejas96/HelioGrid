import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import type { UsageBillingState } from './UsageMeter.types';
import { UsageMeterTrack } from './UsageMeterTrack';
import { usageScale, usageStatusLine } from './usage-meter-model';

export interface UsageMeterMeteredProps {
  label: string;
  value: number;
  limit: number;
  unit?: string;
  period?: string;
  bundleName?: string;
  billing: UsageBillingState;
  thresholdPercent: number;
  graceDaysLeft?: number;
  note?: string;
  trackHeight: string;
  format: (value: number) => string;
  provenance: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The reporting meter: figure over denominator, the re-scaling track, BM-27's persistent
 * provenance line, and one status sentence carrying the whole billing situation in words.
 */
export function UsageMeterMetered({
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
  const scale = usageScale(value, limit, thresholdPercent, billing);
  const line = usageStatusLine(billing, scale, format, unit, bundleName, graceDaysLeft);
  const unitSuffix = unit === undefined ? '' : ` ${unit}`;
  const beyond = scale.overage > 0 ? `, ${format(scale.overage)} beyond the bundle` : '';

  return (
    <section className={classNames('hg-usage-meter', className)} style={style}>
      <div className="hg-usage-meter-head">
        <span className="hg-usage-meter-label">{label}</span>
        <span className="hg-usage-meter-figure">
          <strong>{format(value)}</strong>
          <span className="hg-usage-meter-unit">
            {' of '}
            {format(limit)}
            {unitSuffix}
          </span>
        </span>
      </div>

      <UsageMeterTrack
        scale={scale}
        height={trackHeight}
        accessibilityLabel={`${label}${period === undefined ? '' : `, ${period}`}`}
        valueText={`${format(value)} of ${format(limit)}${unitSuffix}${beyond}`}
        value={value}
        limit={limit}
        thresholdPercent={thresholdPercent}
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
