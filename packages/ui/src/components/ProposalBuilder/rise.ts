import type { CSSProperties } from 'react';
import { riseOrder as staggerPlace } from '../ProposalBlocks/ProposalBlocks.logic';

type RiseVars = CSSProperties & Record<'--i', string>;

/**
 * A part's place in the stagger as the stylesheet reads it — the delay itself is the stylesheet's,
 * from the motion tokens (`F7-51`), and the cap is the theme's `stagger.maxItems`.
 */
export function riseOrder(order: number): RiseVars {
  return { '--i': String(staggerPlace(order)) };
}
