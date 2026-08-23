import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { LogoTileProps, WordmarkProps } from './Wordmark.types';

/**
 * Per-instance numbers (the caller's `size`, `radius`) ride into Wordmark.css as custom
 * properties rather than as loose inline declarations — the values stay in the stylesheet.
 */
type CssVars = CSSProperties & Record<`--${string}`, string>;

interface WebWordmarkProps extends WordmarkProps {
  className?: string;
  style?: CSSProperties;
}

interface WebLogoTileProps extends LogoTileProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The HelioGrid wordmark. Geist Bold, −0.03em, iridescence on "Grid" only. No logo mark
 * exists — none was ever provided, and one is not invented here. This is the one place the
 * brand gradient is allowed to fill type; everywhere else it stays atmosphere.
 */
export function Wordmark({ size = 22, tone = 'default', className, style }: WebWordmarkProps) {
  const vars: CssVars = { '--hg-wordmark-size': `${size}px`, ...style };
  if (tone === 'mono') {
    return (
      <span className={classNames('hg-wordmark', className)} data-tone={tone} style={vars}>
        HelioGrid
      </span>
    );
  }
  return (
    <span className={classNames('hg-wordmark', className)} data-tone={tone} style={vars}>
      Helio<span className="hg-wordmark-grid">Grid</span>
    </span>
  );
}

/** Gradient app tile — the rail/launcher mark. Radius follows the density, never a circle. */
export function LogoTile({ size = 40, radius = 12, className, style }: WebLogoTileProps) {
  const vars: CssVars = {
    '--hg-logo-tile-size': `${size}px`,
    '--hg-logo-tile-radius': `${radius}px`,
    '--hg-logo-tile-type': `${Math.round(size * 0.45)}px`,
    ...style,
  };
  return (
    <span
      aria-label="HelioGrid"
      role="img"
      className={classNames('hg-logo-tile', className)}
      style={vars}
    >
      H
    </span>
  );
}
