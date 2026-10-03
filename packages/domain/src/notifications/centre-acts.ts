/**
 * The centre's two acts, decided once for both apps (`SCR-SHELL-03`): which type group the filter
 * bar has open, and how a Mark all read ended.
 */

/** One type group at a time: tapping the open one closes it, tapping another opens that one. */
export function nextOpenGroup<G extends string>(open: G | null, tapped: G): G | null {
  return open === tapped ? null : tapped;
}

/**
 * How Mark all read ended (`F6-07`, `F4-27`): how many it marked, refused with a reason the
 * screen says at the attempt, or not sent because one was already on its way.
 */
export type MarkAllOutcome =
  | { readonly kind: 'marked'; readonly count: number }
  | { readonly kind: 'failed' }
  | { readonly kind: 'busy' };
