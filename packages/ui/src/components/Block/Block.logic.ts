import type { TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import type { BlockFrameProps } from './Block.types';
import { blockCount } from './Block.types';

/** The grid's floor per column and its gutter, when the caller names neither. */
export const BLOCK_GRID_MIN = 320;
export const BLOCK_GRID_GAP = 20;

/** The count beside the heading, grouped in the market's digits — whole items, never a fraction. */
export function shownCountOf(
  count: number | undefined,
  countMax: number | undefined,
  market: MarketFormat,
): string | null {
  return blockCount(count, countMax, (n) => market.number(n, { maximumFractionDigits: 0 }));
}

/** "6 sites" — the count as a reader hears it; the bare numeral when it has no label. */
export function spokenCountOf(shownCount: string, countLabel: TranslatedText | undefined): string {
  return countLabel !== undefined ? `${shownCount} ${countLabel}` : shownCount;
}

/**
 * **What the header draws**, or `null` when it has nothing at all. The title row draws for a
 * title, a count OR a badge — the heading is the optional part: it used to render inside the
 * `title` branch, so an overline-only block (`overline="AGENT CALLS"`, `count={6}` — the
 * `SCR-M07-01` / `M13-10` shape) drew an empty row and dropped the numeral.
 */
export function blockHeaderOf(
  parts: Pick<BlockFrameProps, 'overline' | 'title' | 'meta' | 'action' | 'badge'> & {
    shownCount: string | null;
  },
): { titleRow: boolean } | null {
  const titleRow =
    parts.title !== undefined || parts.shownCount !== null || parts.badge !== undefined;
  if (
    parts.overline === undefined &&
    !titleRow &&
    parts.meta === undefined &&
    parts.action === undefined
  ) {
    return null;
  }
  return { titleRow };
}
