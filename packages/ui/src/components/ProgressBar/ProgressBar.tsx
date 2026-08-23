import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ProgressBarProps } from './ProgressBar.types';

/** Dynamic geometry rides in as a custom property so the values stay in ProgressBar.css. */
type RailVars = CSSProperties & Record<`--${string}`, string>;

interface WebProgressBarProps extends ProgressBarProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Linear progress. 6px pill track; fill accent, or brand gradient for AI work.
 *
 * IT IS A DRAWING, NOT AN OPERATION. No label, no indeterminate form, no "n of m", no stage, no
 * cancel, no destination — so anything that has those (an import, a solar-access run, a render)
 * takes OperationProgress, which draws with this. UsageMeter owns the billing meter.
 */
export function ProgressBar({
  value = 0,
  gradient = false,
  className,
  style,
}: WebProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const vars: RailVars = { '--hg-progress-bar-value': `${pct}%` };
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={classNames('hg-progress-bar', className)}
      style={style}
    >
      <div
        className="hg-progress-bar-fill"
        data-gradient={gradient ? 'true' : undefined}
        style={vars}
      />
    </div>
  );
}
