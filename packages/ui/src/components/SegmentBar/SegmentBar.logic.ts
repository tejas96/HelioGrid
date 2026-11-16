import type { SegmentBarPart, SegmentBarSegment } from './SegmentBar.types';

/** Under this share a part draws at the bar's floor, so a 2-of-405 part is still seen. */
const THIN_SHARE = 0.03;

/**
 * Each part's share of the whole, 0–1. With none counted, every part takes an even share when
 * `keepEmpty`, else none.
 */
export function segmentSharesOf(
  parts: readonly { readonly count: number }[],
  keepEmpty: boolean,
): readonly number[] {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.count), 0);
  if (total === 0) return parts.map(() => (keepEmpty && parts.length > 0 ? 1 / parts.length : 0));
  return parts.map((part) => Math.max(0, part.count) / total);
}

/** A part's strength when the bar fades: the first full, each later a step lighter, never under a quarter. */
export function fadedOpacityOf(index: number): number {
  return Math.max(0.25, 1 - index * 0.15);
}

/** The segments the bar draws, in order: a part with no share draws none. */
export function segmentsOf(
  parts: readonly SegmentBarPart[],
  keepEmpty: boolean,
  fade: boolean,
): readonly SegmentBarSegment[] {
  const shares = segmentSharesOf(parts, keepEmpty);
  return parts
    .map((part, index) => ({ part, share: shares[index] ?? 0 }))
    .filter(({ share }) => share > 0)
    .map(({ part, share }, drawn) => ({
      key: part.key,
      share,
      thin: share < THIN_SHARE,
      ink: part.ink,
      opacity: fade ? fadedOpacityOf(drawn) : 1,
    }));
}
