import { classNames } from '../../primitives/class-names';
import type { LoadingBarsProps } from './LoadingBars.types';

type WebLoadingBarsProps = LoadingBarsProps & {
  className?: string;
};

/**
 * The bars a list shows in its own place while its record loads. The region says it is busy and
 * carries the caller's name for the wait; the bars themselves are decoration. Inside a region the
 * caller already made busy, the bars are decoration alone.
 */
export function LoadingBars({ label, bars, className, inBusyRegion }: WebLoadingBarsProps) {
  const frame = {
    className: classNames('hg-loading-bars', className),
    'data-sizes': bars.every((size) => size === 'line') ? 'line' : undefined,
  };
  const drawn = bars.map((size, index) =>
    size === 'line' ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: bars of one size are alike and never reorder
      <span aria-hidden="true" className="hg-loading-line" key={index}>
        <span className="hg-loading-line-mark" />
        <span className="hg-loading-line-bar" />
      </span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: bars of one size are alike and never reorder
      <span aria-hidden="true" className="hg-loading-bar" data-size={size} key={index} />
    ),
  );
  if (inBusyRegion) {
    return (
      <div {...frame} aria-hidden="true">
        {drawn}
      </div>
    );
  }
  return (
    <div {...frame} role="status" aria-busy="true" aria-label={label}>
      {drawn}
    </div>
  );
}
