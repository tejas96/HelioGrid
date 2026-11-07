import type { CSSProperties } from 'react';
import { RollingNumber } from '../RollingNumber';
import { ringShare } from './ProgressRing.logic';
import type { ProgressRingProps } from './ProgressRing.types';

type CssVars = CSSProperties & Record<`--${string}`, string>;

/** The web half: a conic arc over a soft track, masked to a ring, the figure rolling at its centre. */
export function ProgressRing({
  share,
  value,
  caption,
  spokenName,
  size = 'md',
  onPanel = false,
}: ProgressRingProps) {
  const vars: CssVars = { '--hg-ring-share': String(ringShare(share)) };
  return (
    <div
      className="hg-ring"
      data-size={size}
      data-on-panel={onPanel ? 'true' : undefined}
      role="img"
      aria-label={spokenName}
      style={vars}
    >
      <span className="hg-ring-track" aria-hidden="true" />
      <span className="hg-ring-arc" aria-hidden="true" />
      <span className="hg-ring-centre" aria-hidden="true">
        <RollingNumber value={value} variant={size === 'lg' ? 'display' : 'figure'} />
        <span className="hg-ring-caption">{caption}</span>
      </span>
    </div>
  );
}
