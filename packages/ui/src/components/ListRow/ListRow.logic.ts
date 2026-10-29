import type { ListRowProps } from './ListRow.types';

/** The leading icon circle's side: 40 in the expressive row, 32 in the dense one. */
export function leadingCircleSize(density: NonNullable<ListRowProps['density']>): number {
  return density === 'expressive' ? 40 : 32;
}
