import type { TranslatedText } from '@heliogrid/contracts';
import type { DialBlock, LeadDetailView, LeadStateAct } from '@heliogrid/domain';
import type {
  LeadActionDockProps,
  LeadDockMoreAct,
  LeadDockStateStanding,
} from './LeadActionDock.types';

/** The dock's words, built in `@heliogrid/i18n` (`leadDockWords`). */
export interface LeadDockWords {
  readonly call: TranslatedText;
  readonly callBlocked: (block: DialBlock) => TranslatedText;
  readonly message: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly log: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly visit: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly design: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly designLater: TranslatedText;
  readonly closedNoVisit: TranslatedText;
  readonly stateAct: (act: LeadStateAct) => TranslatedText;
  readonly stateActWaiting: (act: Extract<LeadStateAct, 'wake' | 'reopen'>) => TranslatedText;
  readonly moreActs: TranslatedText;
  readonly addReferral: TranslatedText;
  readonly merge: TranslatedText;
}

/** What each of the dock's acts opens — the screen's sheets and moves. */
export interface LeadDockPresses {
  readonly message: () => void;
  readonly log: () => void;
  readonly visit: () => void;
  readonly stateAct: (act: LeadStateAct) => void;
  readonly addReferral: () => void;
  /** Merge with another customer; null where the screen has no way to it yet. */
  readonly merge: (() => void) | null;
}

/** A sheet-less state act out now, or come back undone with the sentence saying why. */
export type LeadDockQuickStanding =
  | { readonly kind: 'waiting'; readonly act: Extract<LeadStateAct, 'wake' | 'reopen'> }
  | {
      readonly kind: 'returned';
      readonly act: Extract<LeadStateAct, 'wake' | 'reopen'>;
      readonly reason: TranslatedText;
    };

/**
 * The dock's props from domain's view of the lead: Call or why not, the four acts with why one is
 * off — Create design until the studio lands, Book visit while the lead is closed — the state acts
 * its standing offers, and the More menu.
 */
export function leadDockOf(
  view: LeadDetailView,
  words: LeadDockWords,
  presses: LeadDockPresses,
  quick: LeadDockQuickStanding | null,
): Omit<LeadActionDockProps, 'layout'> {
  const more: LeadDockMoreAct[] = [
    { key: 'add-referral', label: words.addReferral, onPress: presses.addReferral },
  ];
  if (presses.merge !== null) {
    more.push({ key: 'merge', label: words.merge, onPress: presses.merge });
  }
  const standing: LeadDockStateStanding | null =
    quick === null
      ? null
      : quick.kind === 'waiting'
        ? { kind: 'waiting', act: quick.act, line: words.stateActWaiting(quick.act) }
        : quick;
  return {
    call:
      view.dial.kind === 'dial'
        ? view.dial
        : { kind: 'blocked', reason: words.callBlocked(view.dial.reason) },
    callLabel: words.call,
    acts: [
      { action: 'message', ...words.message, disabledReason: null, onPress: presses.message },
      { action: 'log', ...words.log, disabledReason: null, onPress: presses.log },
      {
        action: 'visit',
        ...words.visit,
        disabledReason: view.acts.visit === 'closed' ? words.closedNoVisit : null,
        onPress: presses.visit,
      },
      { action: 'design', ...words.design, disabledReason: words.designLater, onPress: () => {} },
    ],
    stateActs: view.acts.stateActs.map((act) => ({
      act,
      label: words.stateAct(act),
      onPress: () => presses.stateAct(act),
    })),
    more,
    moreLabel: words.moreActs,
    standing,
  };
}
