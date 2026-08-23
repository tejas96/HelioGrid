import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { IndeterminateRailProps } from './PendingAction.types';

type RailVars = CSSProperties & Record<`--${string}`, string>;

interface WebIndeterminateRailProps extends IndeterminateRailProps {
  className?: string;
  style?: CSSProperties;
}

const asLength = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : value;

/**
 * The travelling segment. `width` is the rail; `thickness` its height.
 *
 * REDUCED MOTION IS READ, NOT IGNORED: IndeterminateRail.css swaps the travelling 34% segment for
 * a static dimmed full-width fill under `prefers-reduced-motion`, because a segment frozen at 34%
 * would read as a determinate third.
 */
export function IndeterminateRail({
  width = 22,
  thickness = 3,
  tone = 'var(--accent)',
  className,
  style,
}: WebIndeterminateRailProps) {
  const vars: RailVars = {
    '--hg-indeterminate-rail-width': asLength(width),
    '--hg-indeterminate-rail-thickness': `${thickness}px`,
    '--hg-indeterminate-rail-tone': tone,
  };
  return (
    <span
      aria-hidden="true"
      className={classNames('hg-indeterminate-rail', className)}
      style={{ ...vars, ...style }}
    >
      <span className="hg-indeterminate-rail-segment" />
    </span>
  );
}
