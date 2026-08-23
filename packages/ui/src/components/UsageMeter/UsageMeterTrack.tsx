import type { CSSProperties } from 'react';
import type { UsageScale } from './usage-meter-model';

type TrackVars = CSSProperties & Record<`--${string}`, string>;

interface UsageMeterTrackProps {
  scale: UsageScale;
  height: string;
  /** The track's accessible name. Spelled the package's cross-platform way (`Pressable.types.ts`)
   *  so both halves of `UsageMeterMetered` declare the same word for the same fact. */
  accessibilityLabel: string;
  valueText: string;
  value: number;
  limit: number;
  thresholdPercent: number;
}

/**
 * The track. M12-35 — overage accrues VISIBLY, so 100% is not the end of the scale: the track
 * re-scales, the beyond-bundle portion is its own lighter segment, and the bundle line is marked.
 * The 80% warning is a TICK, not a colour change alone (BM-34).
 */
export function UsageMeterTrack({
  scale,
  height,
  accessibilityLabel,
  valueText,
  value,
  limit,
  thresholdPercent,
}: UsageMeterTrackProps) {
  const vars: TrackVars = {
    '--hg-usage-meter-track-h': height,
    '--hg-usage-meter-used': `${scale.usedPct}%`,
    '--hg-usage-meter-over': `${scale.overPct}%`,
    '--hg-usage-meter-limit-mark': `${scale.limitMark}%`,
    '--hg-usage-meter-threshold': `${scale.threshold}%`,
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={Math.max(limit, value)}
      aria-label={accessibilityLabel}
      aria-valuetext={valueText}
      className="hg-usage-meter-track"
      style={vars}
    >
      <span className="hg-usage-meter-used" data-fill={scale.fill} />
      {scale.overPct > 0 ? <span className="hg-usage-meter-over" /> : null}
      {scale.threshold > 0 && scale.threshold < 100 ? (
        <span
          aria-hidden="true"
          title={`${thresholdPercent}% warning threshold`}
          className="hg-usage-meter-tick"
        />
      ) : null}
      {scale.overPct > 0 && scale.limitMark < 100 ? (
        <span aria-hidden="true" className="hg-usage-meter-bundle-mark" />
      ) : null}
    </div>
  );
}
