import type { MyDay, MyDayItem, TranslatedText } from '@heliogrid/contracts';
import type { CallOutcome, MyDayBand, Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';

/**
 * My Day's words (`SCR-M07-01`), built in `packages/i18n` (`myDayWords`). Every figure arrives
 * already formatted; a word beside a value is one message with the value in it.
 */
export interface MyDayWords {
  readonly nextUp: TranslatedText;
  /** "1 of 17" — where the hero's task sits in the day. */
  readonly position: (at: number, of: number) => TranslatedText;
  readonly daysLate: (days: number) => TranslatedText;
  readonly dueAt: (time: string) => TranslatedText;
  readonly dueOn: (day: string) => TranslatedText;
  /** What the task is: its kind, or a custom task's own words. */
  readonly task: (item: MyDayItem) => TranslatedText;
  /** Why it exists (`M07-06`) — the rule that raised it; null for one a person added. */
  readonly why: (item: MyDayItem) => TranslatedText | null;
  readonly bill: (amount: string) => TranslatedText;
  readonly band: (band: MyDayBand) => TranslatedText;
  readonly showMore: (count: number) => TranslatedText;
  readonly call: TranslatedText;
  readonly callName: (name: string) => TranslatedText;
  /** The number is do-not-call or wrong: no call is offered (`M02-44`). */
  readonly callOff: TranslatedText;
  readonly message: TranslatedText;
  readonly directions: TranslatedText;
  readonly done: TranslatedText;
  readonly doneName: (name: string) => TranslatedText;
  readonly moveToTomorrow: TranslatedText;
  /** A row's menu of its other acts — move it, message the lead. */
  readonly rowMenu: (name: string) => TranslatedText;
  readonly open: (name: string) => TranslatedText;
  readonly unnamed: TranslatedText;
  readonly howDidItGo: (name: string) => TranslatedText;
  readonly answered: TranslatedText;
  readonly noAnswer: TranslatedText;
  readonly notNow: TranslatedText;
  readonly emptyTitle: TranslatedText;
  readonly emptyBody: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
  /** A tick, a move or an answer that did not land. */
  readonly actFailed: TranslatedText;
}

/** One band as drawn: its first rows, the whole count, how many wait behind *Show more*. */
export interface MyDayBandRows {
  readonly band: MyDayBand;
  readonly count: number;
  readonly rows: readonly MyDayItem[];
  readonly hidden: number;
}

/**
 * My Day (`SCR-M07-01`, `M07-01`…`M07-04`): the one task to do now as the screen's hero — Call,
 * Message and Done on it, Move to tomorrow under it — then overdue (first, red, always), today and
 * this week. A list of what to do, never a chart. Ticks and moves land at once; the screen's toast
 * offers *Undo*. After *Call* the hero asks how it went, and the answer logs the call and closes
 * the task.
 */
export interface MyDayProps {
  readonly read: Exclude<Read<MyDay>, { readonly kind: 'empty' }>;
  readonly words: MyDayWords;
  readonly next: MyDayItem | null;
  readonly bands: readonly MyDayBandRows[];
  readonly onExpand: (band: MyDayBand) => void;
  /** Opens the lead. */
  readonly onOpen: (item: MyDayItem) => void;
  /** Dials the lead's number — the app's adapter — and then asks how it went. */
  readonly onCall: (item: MyDayItem) => void;
  /** Opens the lead, where *Message* writes the text to copy. */
  readonly onMessage: (item: MyDayItem) => void;
  /** Opens the visit's place in the device's maps. */
  readonly onDirections: (item: MyDayItem) => void;
  readonly onDone: (item: MyDayItem) => void;
  readonly onMoveToTomorrow: (item: MyDayItem) => void;
  /** The task whose call was just placed; the hero asks how it went. */
  readonly asking: MyDayItem | null;
  readonly onAnswer: (outcome: CallOutcome) => void;
  readonly onSkipAnswer: () => void;
  readonly sending: boolean;
  readonly failed: boolean;
  readonly focusAfter: FocusAfter;
}
