import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { GRID, HELIO, PRODUCT_NAME } from './Wordmark.name';
import type { LogoTileProps, ProductMarkProps, WordmarkProps } from './Wordmark.types';

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
 * The HelioGrid wordmark: Geist, tightly tracked, the logo gradient on "Grid" only — the one place
 * the gradient fills type.
 */
export function Wordmark({ size = 22, tone = 'default', className, style }: WebWordmarkProps) {
  const vars: CssVars = { '--hg-wordmark-size': `${size}px`, ...style };
  if (tone === 'mono') {
    return (
      <span className={classNames('hg-wordmark', className)} data-tone={tone} style={vars}>
        {PRODUCT_NAME}
      </span>
    );
  }
  return (
    <span className={classNames('hg-wordmark', className)} data-tone={tone} style={vars}>
      {HELIO}
      <span className="hg-wordmark-grid">{GRID}</span>
    </span>
  );
}

/** The product mark: the logo gradient on a disc, a sun drawn on it. A caller's radius squares it. */
export function LogoTile({ size = 40, radius, className, style }: WebLogoTileProps) {
  const vars: CssVars = {
    '--hg-logo-tile-size': `${size}px`,
    '--hg-logo-tile-radius': radius === undefined ? '50%' : `${radius}px`,
    ...style,
  };
  return (
    <span
      aria-label={PRODUCT_NAME}
      role="img"
      className={classNames('hg-logo-tile', className)}
      style={vars}
    >
      <svg
        aria-hidden="true"
        className="hg-logo-tile-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <ShellGlyphMarks name="sun" />
      </svg>
    </span>
  );
}

export function ProductMark({ size = 32 }: ProductMarkProps) {
  return (
    <span className="hg-product-mark" data-size={size}>
      <LogoTile size={size} />
      <Wordmark size={size === 32 ? 17 : 20} />
    </span>
  );
}
