import type { TranslatedText } from '@heliogrid/contracts';
import type { AssignPickerPerson } from '../AssignPicker/AssignPicker.types';

/** Every word the dock says, built in `@heliogrid/i18n` (`leadInboxWords`). */
export interface TeamDockWords {
  /** The reader's own face — "You". */
  you: TranslatedText;
  /** "18 open". */
  open: (count: number) => TranslatedText;
  /** "2 overdue" — drawn with the warning glyph above nought. */
  overdue: (count: number) => TranslatedText;
  /** A face's spoken name — "Give to Rajesh Jadhav: 18 open, 2 overdue". */
  giveTo: (name: string, open: number, overdue: number) => TranslatedText;
  /** The face that opens the whole team in the picker — "All 14". */
  all: (count: number) => TranslatedText;
}

/** `faces`: the phone deck's row of faces · `tiles`: the desktop stage's grid of face tiles. */
export type TeamDockLayout = 'faces' | 'tiles';

/**
 * **The team, docked under the lead** (`SCR-M02-02`, `M02-28`): each person who may hold a lead as
 * a face with a ring of their load against the busiest, their open and overdue counts — one tap
 * gives the lead, no confirm. Who is listed is the server's (a deactivated member never is, `M02-28`);
 * when not every face fits, the last face opens the whole team in `AssignPicker`.
 */
export interface TeamDockProps {
  people: readonly AssignPickerPerson[];
  /** The reader, whose face says "You"; `null` when they may not hold a lead. */
  readerId: string | null;
  layout: TeamDockLayout;
  onGive: (userId: string) => void;
  /** Opens the whole team in the picker. */
  onAll: () => void;
  /** The lead's act is out: every face waits, and a tap sends nothing. */
  waiting: boolean;
  words: TeamDockWords;
}
