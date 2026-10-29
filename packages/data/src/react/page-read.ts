import { allReads, type Read } from '@heliogrid/domain';

/**
 * **A settings page's read**: drawn once its own reads answered, while its other reads only fill
 * parts of it — so it stays ready though one of those is still out or got no answer. Until its own
 * reads answer, any read with no answer fails the page, and its retry asks each failed read again.
 */
export function pageRead<T>(own: Read<T>, others: readonly Read<unknown>[]): Read<T> {
  if (own.kind === 'ready') return own;
  const all = allReads([own, ...others]);
  // Never ready here: `own` is not.
  return all.kind === 'ready' ? own : all;
}
