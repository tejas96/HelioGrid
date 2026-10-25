import type { ShareFilterItem } from './ShareFilter.types';

/** Any part with a row draws at least this much of its ring, so a 2-of-405 part is still seen. */
export const MIN_ARC_SHARE = 0.04;

/** Under this share a bar segment holds its 10px floor, so a thin part is still seen. */
const THIN_SEGMENT_SHARE = 0.03;

/** Every part's count, together — the whole the shares are of. */
export function totalOf(items: readonly ShareFilterItem[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, item.count), 0);
}

/** The share of its ring a part's arc draws, 0–1: none for nothing, the floor for a little. */
export function arcShare(count: number, total: number): number {
  if (count <= 0 || total <= 0) return 0;
  return Math.max(MIN_ARC_SHARE, count / total);
}

/** A part with rows whose segment would draw thinner than its floor. */
export function isThinSegment(count: number, total: number): boolean {
  return count > 0 && total > 0 && count / total < THIN_SEGMENT_SHARE;
}

/** The parts the stacked bar draws: a part with no rows draws no segment. */
export function drawnSegments(items: readonly ShareFilterItem[]): readonly ShareFilterItem[] {
  return items.filter((item) => item.count > 0);
}
