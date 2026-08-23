import type { BannerKind, BannerKindMeta } from './Banner.types';

/** The kind table: tone, precedence rank, ARIA role and default label per kind. */
export const BANNER_KINDS: Record<BannerKind, BannerKindMeta> = {
  validation: {
    tone: 'danger',
    rank: 5,
    role: 'alert',
    icon: 'alert',
    label: 'Fix before you continue',
  },
  state: { tone: 'warning', rank: 10, role: 'status', icon: 'alert', label: 'State' },
  'review-needed': {
    tone: 'warning',
    rank: 12,
    role: 'status',
    icon: 'review',
    label: 'Needs review',
  },
  dunning: { tone: 'danger', rank: 15, role: 'status', icon: 'rupee', label: 'Payment overdue' },
  cap: { tone: 'warning', rank: 20, role: 'status', icon: 'alert', label: 'Limit reached' },
  'data-integrity': {
    tone: 'danger',
    rank: 25,
    role: 'status',
    icon: 'alert',
    label: 'Data problem',
  },
  bundle: { tone: 'info', rank: 30, role: 'status', icon: 'info', label: 'Bundle' },
  'orphan-override': {
    tone: 'warning',
    rank: 35,
    role: 'status',
    icon: 'review',
    label: 'Overridden',
  },
  'below-cost': { tone: 'danger', rank: 50, role: 'status', icon: 'rupee', label: 'Below cost' },
  preliminary: { tone: 'info', rank: 55, role: 'status', icon: 'info', label: 'Preliminary' },
  suggestion: { tone: 'accent', rank: 70, role: 'status', icon: 'spark', label: 'Suggestion' },
  disclaimer: { tone: 'neutral', rank: 80, role: 'status', icon: 'info', label: 'Note' },
};

/**
 * THE KINDS THAT REFUSE DISMISSAL. Each one is a fact that does not stop being true because a user
 * tapped the cross.
 *
 * The original three: an unfixed validation error blocks a send, a data-integrity problem corrupts
 * records downstream, and a below-cost quote loses money.
 *
 * THE BILLING KINDS. `SCR-SHELL-06` renders its banner *"whenever the tenant is in a trial
 * countdown, a post-expiry soft block, past_due grace, cap-ladder or halted state"*, and `BM-32`
 * makes that banner THE GUARANTEED WAY BACK. A dismissible way back is not one: a tenant in a soft
 * block who taps the cross has dismissed the only control that ends the block. So `state`,
 * `dunning` and `cap` join the list.
 *
 * `disclaimer` joins it too, and separately moves out of this component altogether — see
 * `Disclosure`. It stays never-dismissible so an un-migrated caller still renders a true statement.
 *
 * `preliminary` is deliberately NOT on the list: it is the operator-side qualifier on a figure
 * being worked on, and its customer-facing form is a `Disclosure`, which has no dismiss at all.
 */
export const NEVER_DISMISSIBLE: readonly BannerKind[] = [
  'validation',
  'data-integrity',
  'below-cost',
  'state',
  'dunning',
  'cap',
  'disclaimer',
];

export function bannerKind(kind: BannerKind | undefined): BannerKindMeta {
  return kind === undefined ? BANNER_KINDS.state : BANNER_KINDS[kind];
}

export function isNeverDismissible(kind: BannerKind | undefined): boolean {
  return kind !== undefined && NEVER_DISMISSIBLE.includes(kind);
}

/** The precedence rank a stack sorts by. An unkinded child sorts with `disclaimer`, i.e. last. */
export function bannerRank(kind: BannerKind | undefined): number {
  return kind === undefined ? BANNER_KINDS.disclaimer.rank : BANNER_KINDS[kind].rank;
}
