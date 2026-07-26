'use client';
import type { CSSProperties } from 'react';
import './BloomLayer.css';

/**
 * Composition allowlist: size. The ambient --glow-brand radial backdrop
 * (login.md §2 layer 2 / whatyousell.md §2): atmosphere, never information.
 * Parent provides the positioning context (position: relative + overflow: hidden).
 */
export interface BloomLayerProps {
  /** Disc diameter in px — spec uses 520 mobile / 860 desktop on auth screens. */
  size?: number;
}

export function BloomLayer({ size = 220 }: BloomLayerProps) {
  return (
    <span
      className="ui-bloom"
      aria-hidden
      /* --ui-bloom-size carries DATA (the diameter prop), not a visual constant */
      style={{ '--ui-bloom-size': `${size}px` } as CSSProperties}
    />
  );
}
