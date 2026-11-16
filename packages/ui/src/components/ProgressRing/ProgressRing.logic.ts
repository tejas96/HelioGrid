import { theme } from '@heliogrid/theme';
import type { ProgressRingSize } from './ProgressRing.types';

const sp = theme.spacing;

/** The ring's side, px/dp, from the spacing scale. The web half's `ProgressRing.css` holds the same. */
export const RING_SIDE: Readonly<Record<ProgressRingSize, number>> = {
  face: sp['sp-12'],
  sm: sp['sp-12'] + sp['sp-2'],
  dial: sp['sp-16'],
  md: sp['sp-24'] + sp['sp-8'],
  run: sp['sp-24'] + sp['sp-8'] + sp['sp-1'],
  lg: sp['sp-24'] + sp['sp-16'],
};

/** The ring's stroke: thin enough at each side to leave its centre open. */
export const RING_STROKE: Readonly<Record<ProgressRingSize, number>> = {
  face: sp['sp-1'],
  sm: sp['sp-1'] + 1,
  dial: sp['sp-1'] + sp['sp-0-5'],
  md: sp['sp-3'],
  run: sp['sp-2'] + sp['sp-0-5'],
  lg: sp['sp-3'],
};

/** A share held between 0 and 1, so a figure past its whole still draws a closed ring. */
export function ringShare(share: number): number {
  if (!Number.isFinite(share)) return 0;
  return Math.min(1, Math.max(0, share));
}

/** The circle a ring of this side and stroke draws, and the length its share fills. */
export interface RingArc {
  readonly radius: number;
  readonly length: number;
  readonly arc: number;
}

export function ringArcOf(side: number, stroke: number, share: number): RingArc {
  const radius = (side - stroke) / 2;
  const length = 2 * Math.PI * radius;
  return { radius, length, arc: length * ringShare(share) };
}

/** How much of a count is done, 0–1; nothing to count is nothing done. */
export function doneShare(done: number, total: number): number {
  return total > 0 ? done / total : 0;
}
