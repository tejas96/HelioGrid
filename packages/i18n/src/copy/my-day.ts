/**
 * My Day's words (`MyDayWords`, `SCR-M07-01`, `M07-01`…`M07-06`): the next-up hero, the three
 * bands, each task's why, and the call's quick ask.
 */
import type { MyDayItem } from '@heliogrid/contracts';
import { type MyDayBand, UNDO_TOAST_MS } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { CALL_OUTCOME_WORD, TASK_PROVENANCE_WORD } from './crm-vocabulary';
import { leadTaskTitle } from './lead-detail-parts';
import { SHELL } from './shell';

type T = Translator['t'];

const MY_DAY = {
  nextUp: /*i18n*/ { id: 'Next up' },
  position: /*i18n*/ { id: '{at} of {of}' },
  daysLate: /*i18n*/ {
    id: '{days, plural, =0 {Late today} one {# day late} other {# days late}}',
  },
  dueAt: /*i18n*/ { id: 'Due {time}' },
  dueOn: /*i18n*/ { id: 'Due {day}' },
  bill: /*i18n*/ { id: 'Bill {amount} a month' },
  overdue: /*i18n*/ { id: 'Overdue' },
  today: /*i18n*/ { id: 'Today' },
  week: /*i18n*/ { id: 'This week' },
  showMore: /*i18n*/ { id: '{count, plural, one {Show # more} other {Show # more}}' },
  call: /*i18n*/ { id: 'Call' },
  callName: /*i18n*/ { id: 'Call {name}' },
  callOff: /*i18n*/ { id: 'Calls are off for this number' },
  message: /*i18n*/ { id: 'Message' },
  directions: /*i18n*/ { id: 'Directions' },
  done: /*i18n*/ { id: 'Done' },
  doneName: /*i18n*/ { id: 'Mark done: {name}' },
  moveToTomorrow: /*i18n*/ { id: 'Move to tomorrow' },
  rowMenu: /*i18n*/ { id: 'More for {name}' },
  open: /*i18n*/ { id: 'Open {name}' },
  unnamed: /*i18n*/ { id: 'No name yet' },
  howDidItGo: /*i18n*/ { id: 'How did the call with {name} go?' },
  notNow: /*i18n*/ { id: 'Not now' },
  whyFirstLate: /*i18n*/ { id: 'First: the most days late on your list' },
  whyFirstToday: /*i18n*/ { id: 'First: due soonest today' },
  emptyTitle: /*i18n*/ { id: 'You’re clear for today' },
  emptyBody: /*i18n*/ {
    id: 'Nothing is overdue and nothing is due. New follow-ups land here on their day.',
  },
  loading: /*i18n*/ { id: 'Loading your day' },
  failedTitle: /*i18n*/ { id: 'Your day did not load' },
  failedMessage: /*i18n*/ { id: 'Check your connection and try again.' },
  actFailed: /*i18n*/ { id: 'That did not save. Try again.' },
  doneToast: /*i18n*/ { id: 'Done · {name}' },
  movedToast: /*i18n*/ { id: 'Moved to tomorrow · {name}' },
  calledToast: /*i18n*/ { id: 'Call logged · {name}' },
  undo: /*i18n*/ { id: 'Undo' },
} satisfies Record<string, MessageRef>;

const BAND_WORD: Record<MyDayBand, MessageRef> = {
  overdue: MY_DAY.overdue,
  today: MY_DAY.today,
  week: MY_DAY.week,
};

/** My Day's words (`MyDayWords`). */
export function myDayWords(t: T) {
  return {
    nextUp: t(MY_DAY.nextUp),
    position: (at: number, of: number) => t(MY_DAY.position, { at, of }),
    daysLate: (days: number) => t(MY_DAY.daysLate, { days }),
    dueAt: (time: string) => t(MY_DAY.dueAt, { time }),
    dueOn: (day: string) => t(MY_DAY.dueOn, { day }),
    task: (item: MyDayItem) => leadTaskTitle(t, item.task),
    why: (item: MyDayItem) => {
      const word = (TASK_PROVENANCE_WORD as Record<string, MessageRef | undefined>)[
        item.task.provenance
      ];
      return word === undefined ? null : t(word);
    },
    bill: (amount: string) => t(MY_DAY.bill, { amount }),
    band: (band: MyDayBand) => t(BAND_WORD[band]),
    showMore: (count: number) => t(MY_DAY.showMore, { count }),
    call: t(MY_DAY.call),
    callName: (name: string) => t(MY_DAY.callName, { name }),
    callOff: t(MY_DAY.callOff),
    message: t(MY_DAY.message),
    directions: t(MY_DAY.directions),
    done: t(MY_DAY.done),
    doneName: (name: string) => t(MY_DAY.doneName, { name }),
    moveToTomorrow: t(MY_DAY.moveToTomorrow),
    rowMenu: (name: string) => t(MY_DAY.rowMenu, { name }),
    open: (name: string) => t(MY_DAY.open, { name }),
    unnamed: t(MY_DAY.unnamed),
    howDidItGo: (name: string) => t(MY_DAY.howDidItGo, { name }),
    answered: t(CALL_OUTCOME_WORD.answered),
    noAnswer: t(CALL_OUTCOME_WORD.no_answer),
    notNow: t(MY_DAY.notNow),
    whyFirstLate: t(MY_DAY.whyFirstLate),
    whyFirstToday: t(MY_DAY.whyFirstToday),
    emptyTitle: t(MY_DAY.emptyTitle),
    emptyBody: t(MY_DAY.emptyBody),
    loading: t(MY_DAY.loading),
    failedTitle: t(MY_DAY.failedTitle),
    failedMessage: t(MY_DAY.failedMessage),
    retry: t(SHELL.tryAgain),
    actFailed: t(MY_DAY.actFailed),
  };
}

/** What a toast is told of an act on My Day: its kind and the task's item. */
export interface MyDayToastFact {
  readonly kind: 'done' | 'moved' | 'called';
  readonly item: MyDayItem;
}

/** The toast an act on My Day leaves: a tick or a move with its *Undo*, a logged call without. */
export function myDayToastWords(t: T) {
  const done = (name: string) => t(MY_DAY.doneToast, { name });
  const moved = (name: string) => t(MY_DAY.movedToast, { name });
  const called = (name: string) => t(MY_DAY.calledToast, { name });
  const undo = t(MY_DAY.undo);
  const titleOf = { done, moved, called };
  return {
    done,
    moved,
    called,
    undo,
    /**
     * The toast's line. A tick or a move offers *Undo*, held on screen long enough to reach
     * (`UNDO_TOAST_MS`); a logged call is the lead's record and says only that it landed.
     */
    line: (fact: MyDayToastFact, onUndo: () => void) => {
      const title = titleOf[fact.kind](fact.item.lead.name ?? t(MY_DAY.unnamed));
      return {
        tone: 'success' as const,
        title,
        ...(fact.kind === 'called'
          ? {}
          : { undo: { label: undo, onUndo }, duration: UNDO_TOAST_MS }),
      };
    },
  };
}
