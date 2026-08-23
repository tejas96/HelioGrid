import type { CSSProperties } from 'react';

/** The bar geometry rides in as custom properties so the shimmer recipe stays in the stylesheet. */
type BarVars = CSSProperties & Record<`--${string}`, string>;

function bar(width: string, height: number): BarVars {
  return { '--hg-skeleton-w': width, '--hg-skeleton-h': `${height}px` };
}

const ROWS = ['row-1', 'row-2', 'row-3', 'row-4'] as const;

interface PanelSkeletonProps {
  /** The status region's accessible name. The reference hardcodes it; no prop carries it. */
  label?: string;
}

/**
 * `loading` — content is coming, and never a placeholder value presented as a real one. The bars
 * carry no numbers for exactly that reason.
 */
export function PanelSkeleton({ label = 'Loading' }: PanelSkeletonProps) {
  return (
    <div aria-label={label} className="hg-detail-panel-skeleton" role="status">
      <div className="hg-detail-panel-skeleton-pair">
        <div className="hg-detail-panel-skeleton-bar" style={bar('50%', 72)} />
        <div className="hg-detail-panel-skeleton-bar" style={bar('50%', 72)} />
      </div>
      <div className="hg-detail-panel-skeleton-bar" style={bar('40%', 12)} />
      {ROWS.map((row) => (
        <div className="hg-detail-panel-skeleton-bar" key={row} style={bar('100%', 40)} />
      ))}
    </div>
  );
}
