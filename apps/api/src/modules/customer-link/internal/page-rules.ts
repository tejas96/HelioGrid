import { LINK_CEILINGS } from '@heliogrid/domain';

/**
 * Whether the question and call affordances are open (`F5-52`, `F5-78`): the link serves, and its
 * shared hourly ceiling of respond acts is not met.
 */
export function asksOpen(visit: {
  readonly serving: { readonly kind: 'serves' | 'fails' };
  readonly respondsInWindow: number;
}): boolean {
  return visit.serving.kind === 'serves' && visit.respondsInWindow < LINK_CEILINGS.respondsPerHour;
}
