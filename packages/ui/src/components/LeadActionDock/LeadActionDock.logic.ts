import type { TranslatedText } from '@heliogrid/contracts';
import type { DialBlock, LeadDetailView, LeadStateAct } from '@heliogrid/domain';
import type { LeadActionDockProps, LeadDockStateStanding } from './LeadActionDock.types';

/** The dock's circles: big enough for a thumb outdoors; the 44 target stays the floor under them. */
export const DOCK_ROUND = 52;

/** The dock's words, built in `@heliogrid/i18n` (`leadDockWords`). */
export interface LeadDockWords {
  readonly call: TranslatedText;
  readonly callBlocked: (block: DialBlock) => TranslatedText;
  readonly message: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly log: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly visit: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly design: { readonly label: TranslatedText; readonly short: TranslatedText };
  readonly closedNoVisit: TranslatedText;
  readonly closedNoDesign: TranslatedText;
  readonly stateAct: (act: LeadStateAct) => TranslatedText;
  readonly stateActWaiting: (act: Extract<LeadStateAct, 'wake' | 'reopen'>) => TranslatedText;
}

/** What each of the dock's acts opens — the screen's sheets and moves. */
export interface LeadDockPresses {
  readonly message: () => void;
  readonly log: () => void;
  readonly visit: () => void;
  /** Create design; `null` for a reader without the design grant, who is not offered it. */
  readonly design: (() => void) | null;
  readonly stateAct: (act: LeadStateAct) => void;
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
 * The dock's props from domain's view of the lead: Call or why not, the acts with why one is off —
 * Book visit and Create design while the lead is closed; Create design is left out for a reader
 * without the design grant — the state acts
 * its standing offers but junk, which the hero's record menu holds.
 */
export function leadDockOf(
  view: LeadDetailView,
  words: LeadDockWords,
  presses: LeadDockPresses,
  quick: LeadDockQuickStanding | null,
): Omit<LeadActionDockProps, 'layout'> {
  const standing: LeadDockStateStanding | null =
    quick === null
      ? null
      : quick.kind === 'waiting'
        ? { kind: 'waiting', act: quick.act, line: words.stateActWaiting(quick.act) }
        : quick;
  const closed = view.acts.visit === 'closed';
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
        disabledReason: closed ? words.closedNoVisit : null,
        onPress: presses.visit,
      },
      ...(presses.design === null
        ? []
        : [
            {
              action: 'design' as const,
              ...words.design,
              disabledReason: closed ? words.closedNoDesign : null,
              onPress: presses.design,
            },
          ]),
    ],
    stateActs: view.acts.stateActs
      .filter((act) => act !== 'junk')
      .map((act) => ({
        act,
        label: words.stateAct(act),
        onPress: () => presses.stateAct(act),
      })),
    standing,
    closed,
  };
}
