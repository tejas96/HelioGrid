import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadDetailAction, LeadStateAct } from '@heliogrid/domain';
import type { ActionReasonSentence } from '../ActionReason/ActionReason.types';

/**
 * `dock` — the phone's and the narrow web's: the five acts as one row of equal circles, each with
 * its short word under it, Call the one ocean circle; the record menu in the top bar holds snooze
 * and disqualify. `grid` — the wide web's: Call across the column, the four as glass pills two by
 * two, the state acts under them.
 */
export type LeadActionDockLayout = 'dock' | 'grid';

/** Call (`M02-32`): the number to dial, or why no call is offered (`M02-44`). */
export type LeadDockCall =
  | { readonly kind: 'dial'; readonly phoneE164: string }
  | { readonly kind: 'blocked'; readonly reason: ActionReasonSentence };

/** One of the four acts beside Call. */
export interface LeadDockAct {
  readonly action: Exclude<LeadDetailAction, 'call'>;
  /** The act's words — "Log activity"; the dock's round act speaks them. */
  readonly label: TranslatedText;
  /** The word under the dock's round act — "Log". */
  readonly short: TranslatedText;
  /** Why the act is off — the design studio arrives later, a closed lead takes no visit. */
  readonly disabledReason: ActionReasonSentence | null;
  readonly onPress: () => void;
}

/** One R9 act the lead's standing offers (`M02-51`…`M02-56`); junk is the hero's record menu's. */
export interface LeadDockStateAct {
  readonly act: LeadStateAct;
  readonly label: TranslatedText;
  readonly onPress: () => void;
}

/** The state act out now — its pill says so and every state act waits — or the one come back undone. */
export type LeadDockStateStanding =
  | { readonly kind: 'waiting'; readonly act: LeadStateAct; readonly line: TranslatedText }
  | { readonly kind: 'returned'; readonly act: LeadStateAct; readonly reason: TranslatedText };

/**
 * The lead's five actions (`M02-32`), Call first and biggest: on the web Call is a `tel:` link,
 * on the phone it opens the dialler — never a dial offer for a number that may not be called.
 * Under them the state acts the lead's standing offers.
 */
export interface LeadActionDockProps {
  readonly layout: LeadActionDockLayout;
  readonly call: LeadDockCall;
  readonly callLabel: TranslatedText;
  /** Message, Log activity, Book visit and Create design, in that order. */
  readonly acts: readonly LeadDockAct[];
  readonly stateActs: readonly LeadDockStateAct[];
  /** A state act without a sheet (wake, reopen): out, or back undone with why; null otherwise. */
  readonly standing: LeadDockStateStanding | null;
  /**
   * The lead is disqualified or junk: in the `dock` the five acts step aside and Reopen stands
   * alone, so nobody calls or books a closed lead by mistake. The `grid` keeps its acts.
   */
  readonly closed: boolean;
}
