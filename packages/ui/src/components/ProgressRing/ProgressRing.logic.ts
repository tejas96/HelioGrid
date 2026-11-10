import { theme } from '@heliogrid/theme';
import type { ProgressRingSize } from './ProgressRing.types';

/** The ring's side and stroke, px/dp, from the spacing scale: 128 and 160 across, a 12 stroke. */
export const RING_SIDE: Readonly<Record<ProgressRingSize, number>> = {
  md: theme.spacing['sp-24'] + theme.spacing['sp-8'],
  lg: theme.spacing['sp-24'] + theme.spacing['sp-16'],
};
export const RING_STROKE = theme.spacing['sp-3'];

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
