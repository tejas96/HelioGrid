import type { TranslatedText } from '@heliogrid/contracts';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';

/**
 * One person a lead can go to (`M02-28`): an active member who may hold a lead, with their open
 * leads and their open tasks past due at this moment — the wire's assignee as it stands.
 */
export interface AssignPickerPerson {
  readonly userId: string;
  /** The member's name as they wrote it — a fact. */
  readonly name: string;
  readonly openCount: number;
  readonly overdueCount: number;
}

/**
 * The assign the caller sent from this picker and is waiting on, or that came back undone: drawn
 * as that person's row's `PendingAction` line. While it waits, every row and every way out waits.
 */
export interface AssignPickerPending {
  readonly userId: string;
  readonly line: PendingActionSpec;
}

/** Every word the picker says, built in `@heliogrid/i18n` (`assignPickerWords`). */
export interface AssignPickerWords {
  /** "Give to". */
  title: TranslatedText;
  /** What is being given — "Priya Sharma · one tap assigns", "3 leads · one tap assigns". */
  subtitle: TranslatedText;
  close: TranslatedText;
  /** The reader's own row — "Rajesh Jadhav (you)". */
  you: (name: string) => TranslatedText;
  /** "18 open". */
  open: (count: number) => TranslatedText;
  /** "2 overdue" — drawn with the warning glyph when above nought. */
  overdue: (count: number) => TranslatedText;
  /** The current owner's mark — "Has it now". */
  holds: TranslatedText;
  loading: TranslatedText;
  failedTitle: TranslatedText;
  failedMessage: TranslatedText;
  retry: TranslatedText;
  /** No one may hold a lead yet. */
  emptyTitle: TranslatedText;
  emptyMessage: TranslatedText;
}

/**
 * THE assign picker (`M02-28`, `M02-29`): the one list of people the inbox and lead detail both
 * open, for one lead or a selection. Each row is a face, a name, the open and overdue counts and a
 * load bar against the busiest person; one tap picks — no confirm. Who may be listed is the
 * server's; whether an assign is out, and how it came back, is the caller's (`pending`).
 */
export interface AssignPickerProps {
  open: boolean;
  /** Backdrop, Esc, close or drag — refused while an assign waits. */
  onClose: () => void;
  /** The people read: `loading`, `failed` with its retry, `empty`, or `ready` with `people`. */
  read: SurfaceRead;
  people: readonly AssignPickerPerson[];
  /** The lead's owner now, marked and not offered; `null` for an unassigned lead or a selection. */
  ownerId: string | null;
  /** The reader, whose row says so; `null` when they may not hold a lead. */
  readerId: string | null;
  onPick: (userId: string) => void;
  pending: AssignPickerPending | null;
  words: AssignPickerWords;
}

/** One row's load: the two counts and the person's share of the busiest load (`AssigneeLoad`). */
export interface AssigneeLoadProps {
  openCount: number;
  overdueCount: number;
  /** 0 to 1 — open leads against the most anyone listed holds. */
  share: number;
  words: Pick<AssignPickerWords, 'open' | 'overdue'>;
}
