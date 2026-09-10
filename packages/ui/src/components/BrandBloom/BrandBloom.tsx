import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { BLOOM_GEOMETRY, type BrandBloomProps } from './BrandBloom.types';

type CssVars = CSSProperties & Record<`--${string}`, string>;

interface WebBrandBloomProps extends BrandBloomProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * `--glow-brand` as atmosphere behind a page or a mark — iridescence that never carries
 * information. Absolutely positioned inside a relative parent; field mode turns the token to
 * `none` and the bloom disappears with it.
 */
export function BrandBloom({ placement, size, className, style }: WebBrandBloomProps) {
  const geometry = placement === undefined ? null : BLOOM_GEOMETRY[placement];
  const vars: CssVars = { ...style };
  if (geometry !== null) {
    vars['--hg-bloom-w'] = `${geometry.width}px`;
    vars['--hg-bloom-h'] = `${geometry.height}px`;
    if (geometry.top !== null) vars['--hg-bloom-top'] = `${geometry.top}px`;
    if (geometry.left !== null) vars['--hg-bloom-left'] = `${geometry.left}px`;
  } else if (size !== undefined) {
    vars['--hg-bloom-w'] = `${size}px`;
    vars['--hg-bloom-h'] = `${size}px`;
  }
  const mode =
    geometry === null
      ? size === undefined
        ? 'fill'
        : 'art'
      : geometry.top === null
        ? 'art'
        : geometry.left === null
          ? 'centred'
          : 'placed';
  return (
    <span
      aria-hidden="true"
      className={classNames('hg-brand-bloom', className)}
      data-mode={mode}
      style={vars}
    />
  );
}
