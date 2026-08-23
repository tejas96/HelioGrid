import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { BandChip } from './BandChip';
import type { BandSpec } from './BandedFigure.types';

export interface BandedLineProps {
  label: string;
  shown: string;
  unit?: string;
  band: BandSpec | null;
  /** The band's remedy, or the host's override of it. */
  move?: ReactNode;
  /** The whole read-out — label, figure, band word and remedy as ONE announcement. Spelled the
   *  package's cross-platform way (`Pressable.types.ts`), so the web half's `aria-label` and the
   *  native half's `accessibilityLabel` are visibly the same declaration and not two dialects. */
  accessibilityLabel: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The `line` variant — a figure and its band in a row, inside a panel. `role="group"` is what
 * carries the read-out: the label, the figure, the band's word and the remedy are announced as
 * one thing rather than four fragments.
 */
export function BandedLine({
  label,
  shown,
  unit,
  band,
  move,
  accessibilityLabel,
  className,
  style,
}: BandedLineProps) {
  /* `group` rather than a landmark: a panel must not gain a region per line, and the read-out
     joins the label, the figure, the band's word and the remedy into one announcement. */
  return (
    // biome-ignore lint/a11y/useSemanticElements: fieldset is for form controls.
    <div
      role="group"
      aria-label={accessibilityLabel}
      className={classNames('hg-banded-line', className)}
      style={style}
    >
      <span className="hg-banded-line-label">{label}</span>
      <span className="hg-banded-line-value">
        {shown}
        {unit !== undefined ? ` ${unit}` : ''}
      </span>
      {band !== null ? <BandChip band={band} size={12} /> : null}
      {move !== undefined && move !== null ? (
        <span className="hg-banded-line-remedy">{move}</span>
      ) : null}
    </div>
  );
}
