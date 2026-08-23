import type { CSSProperties } from 'react';
import type { SheetDensity } from './Sheet.types';

/** The bar geometry rides in as custom properties so the shimmer recipe stays in Sheet.css. */
type BarVars = CSSProperties & Record<`--${string}`, string>;

function bar(width: string, height: number): BarVars {
  return { '--hg-skeleton-w': width, '--hg-skeleton-h': `${height}px` };
}

interface SheetSkeletonProps {
  /** Sets the row gap — 16 expressive, 12 functional, the same ladder as the sheet's padding. */
  density?: SheetDensity;
  /** The status region's accessible name. The reference hardcodes it; no prop carries it. */
  label?: string;
}

/**
 * `loading` — content is coming, and never a placeholder value presented as a real one. The bars
 * carry no numbers for exactly that reason.
 */
export function SheetSkeleton({ density = 'expressive', label = 'Loading' }: SheetSkeletonProps) {
  return (
    <div aria-label={label} className="hg-sheet-skeleton" data-density={density} role="status">
      <div className="hg-sheet-skeleton-bar" style={bar('62%', 20)} />
      <div className="hg-sheet-skeleton-pair">
        <div className="hg-sheet-skeleton-bar" style={bar('50%', 68)} />
        <div className="hg-sheet-skeleton-bar" style={bar('50%', 68)} />
      </div>
      <div className="hg-sheet-skeleton-bar" style={bar('100%', 14)} />
      <div className="hg-sheet-skeleton-bar" style={bar('76%', 14)} />
    </div>
  );
}
