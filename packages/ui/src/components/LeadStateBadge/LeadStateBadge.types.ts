import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadLifecycleState } from '@heliogrid/domain';

/**
 * A lead's R9 state (`M02-49`…`M02-55`) — parked or closed — as glyph, word and tint. An active
 * lead has no state and draws no badge: the caller renders this only when the lead carries one.
 */
export interface LeadStateBadgeProps {
  state: LeadLifecycleState;
  /**
   * The state's words, from `@heliogrid/i18n`'s `leadStateLabel`: its word ("Dormant"), or a
   * snoozed lead's wake day ("Snoozed till 14 Nov") where the screen shows it.
   */
  label: TranslatedText;
}
