import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { type BrandBloomProps, CENTRE_BLOOM_SIZE } from './BrandBloom.types';

type CssVars = CSSProperties & Record<`--${string}`, string>;

interface WebBrandBloomProps extends BrandBloomProps {
  className?: string;
  style?: CSSProperties;
}

/** The brand's light, absolutely placed inside a relative parent. */
export function BrandBloom({ placement, size, className, style }: WebBrandBloomProps) {
  const side = placement === 'centre' ? CENTRE_BLOOM_SIZE : size;
  const vars: CssVars = { ...style };
  if (side !== undefined) vars['--hg-bloom-size'] = `${side}px`;
  const mode = placement === 'page' ? 'page' : side === undefined ? 'fill' : 'art';
  return (
    <span
      aria-hidden="true"
      className={classNames('hg-brand-bloom', className)}
      data-mode={mode}
      style={vars}
    />
  );
}
