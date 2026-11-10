import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';

/**
 * The lead's read before it is ready — `useLeadDetailScreen`'s, named by shape here because this
 * package may not import `packages/data`: still out, failed with its retry, or gone from the
 * reader's scope or removed. One lead's read is never empty.
 */
export type LeadDetailWaitingRead =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'unavailable' };

/** Every word the states say, built in `@heliogrid/i18n` (`leadDetailPageWords`). */
export interface LeadDetailStatesWords {
  loading: TranslatedText;
  failedTitle: TranslatedText;
  failedMessage: TranslatedText;
  retry: TranslatedText;
  /** The honest landing's title — the lead is not one this person can open. */
  goneTitle: TranslatedText;
  goneMessage: TranslatedText;
  backToList: TranslatedText;
}

/**
 * **Lead Detail before its lead is ready** (`SCR-M02-04`), both platforms: the calm skeleton of
 * the hero, the action dock and the qualify card over the sections; what failed with *Try again*;
 * or — the lead gone from the reader's scope or removed, which a notice opened after a
 * reassignment or a stale link meets — the honest landing with the way back to the list (RFC
 * decision 12).
 */
export interface LeadDetailStatesProps {
  read: LeadDetailWaitingRead;
  words: LeadDetailStatesWords;
  onBackToList: () => void;
  /** The page, where focus lands once *Try again* has replaced the failure. */
  focusAfter: FocusAfter;
}
