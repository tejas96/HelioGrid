import { classNames } from '../../primitives/class-names';
import type { LoadingBarsProps } from './LoadingBars.types';

interface WebLoadingBarsProps extends LoadingBarsProps {
  className?: string;
}

/**
 * The bars a list shows in its own place while its record loads. The region says it is busy and
 * carries the caller's name for the wait; the bars themselves are decoration.
 */
export function LoadingBars({ label, bars, className }: WebLoadingBarsProps) {
  return (
    <div
      className={classNames('hg-loading-bars', className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      {bars.map((size, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: bars of one size are alike and never reorder
        <span aria-hidden="true" className="hg-loading-bar" data-size={size} key={index} />
      ))}
    </div>
  );
}
