import { classNames } from '../../primitives/class-names';
import type { LoadingBarSize, LoadingBarsProps } from './LoadingBars.types';

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
    'data-sizes': sizesOf(bars),
  };
  // biome-ignore lint/suspicious/noArrayIndexKey: bars of one size are alike and never reorder
  const drawn = bars.map((size, index) => <Bar key={index} size={size} />);
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

/** A list drawn in one shape spaces its bars as that shape asks; a mixed list keeps the default. */
function sizesOf(bars: readonly LoadingBarSize[]): 'line' | 'option' | undefined {
  if (bars.every((size) => size === 'line')) return 'line';
  if (bars.every((size) => size === 'option')) return 'option';
  return undefined;
}

function Bar({ size }: { size: LoadingBarSize }) {
  if (size === 'line') {
    return (
      <span aria-hidden="true" className="hg-loading-line">
        <span className="hg-loading-line-mark" />
        <span className="hg-loading-line-bar" />
      </span>
    );
  }
  if (size === 'option') {
    return (
      <span aria-hidden="true" className="hg-loading-option">
        <span className="hg-loading-option-mark" />
        <span className="hg-loading-option-text">
          <span className="hg-loading-option-title">
            <span />
          </span>
          <span className="hg-loading-option-description">
            <span className="hg-loading-option-line">
              <span />
            </span>
            <span className="hg-loading-option-line">
              <span />
            </span>
          </span>
        </span>
      </span>
    );
  }
  return <span aria-hidden="true" className="hg-loading-bar" data-size={size} />;
}
