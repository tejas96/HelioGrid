import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { PageEstimateProps } from './PagedDocument.types';
import { estimatePages } from './page-geometry';

interface WebPageEstimateProps extends PageEstimateProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * What goes in `RichText`'s `pageEstimate` slot. Nothing renders at zero characters — the editor
 * never prints "≈ 0 pages" — and `measured` (from `PagedDocument`'s `onCut`) drops the "≈",
 * because a counted page is not an estimate.
 */
export function PageEstimate({
  metrics,
  measured,
  max,
  className,
  style,
  ...opts
}: WebPageEstimateProps) {
  const e = estimatePages(metrics, opts);
  const n = measured !== undefined ? measured : e.pages;
  if (!n) return null;
  const overBy = max !== undefined && n > max ? n - max : null;
  const word = `${n} page${n === 1 ? '' : 's'}`;
  return (
    <span
      className={classNames('hg-page-estimate', className)}
      data-over={overBy !== null ? 'true' : undefined}
      style={style}
    >
      <span>{measured !== undefined ? word : `≈ ${word}`}</span>
      {overBy !== null && (
        <span>
          · {overBy} over the {max}-page limit
        </span>
      )}
      <span className="hg-page-estimate-basis">{e.basis}</span>
    </span>
  );
}
