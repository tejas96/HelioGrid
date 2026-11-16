import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { RollingNumber } from '../RollingNumber';
import { ringShare } from './ProgressRing.logic';
import type { ProgressRingProps } from './ProgressRing.types';

type CssVars = CSSProperties & Record<`--${string}`, string>;

type WebProgressRingProps = ProgressRingProps & { className?: string };

/** The web half: a conic arc over a soft track, masked to a ring, its centre at the middle. */
export function ProgressRing(props: WebProgressRingProps) {
  const { share, size = 'md', onPanel = false, ink, className } = props;
  const vars: CssVars = { '--hg-ring-share': String(ringShare(share)) };
  if (ink !== undefined) vars['--hg-ring-ink'] = ink;
  const named = props.spokenName !== undefined;
  return (
    <div
      className={classNames('hg-ring', className)}
      data-size={size}
      data-on-panel={onPanel ? 'true' : undefined}
      data-ink={ink === undefined ? undefined : 'true'}
      {...(named ? { role: 'img', 'aria-label': props.spokenName } : {})}
      style={vars}
    >
      <span className="hg-ring-track" aria-hidden="true" />
      <span className="hg-ring-arc" aria-hidden="true" />
      <span className="hg-ring-centre" aria-hidden={named ? 'true' : undefined}>
        {named ? <Figure {...props} size={size} /> : props.children}
      </span>
    </div>
  );
}

function Figure({ value, caption, size }: WebProgressRingProps & { size: string }) {
  if (size === 'sm') return <span className="hg-ring-count">{value}</span>;
  return (
    <>
      <RollingNumber value={value ?? ''} variant={size === 'lg' ? 'display' : 'figure'} />
      <span className="hg-ring-caption">{caption}</span>
    </>
  );
}
