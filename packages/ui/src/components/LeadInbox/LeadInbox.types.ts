import type { TranslatedText } from '@heliogrid/contracts';
import type { InboxLead, InboxView, LeadSource, Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { AssignPickerPerson, AssignPickerWords } from '../AssignPicker/AssignPicker.types';
import type { InboxTeachingWords } from '../InboxTeaching/InboxTeaching.types';
import type {
  InboxActLineWords,
  LeadDeckCardLayout,
  LeadDeckCardWords,
} from '../LeadDeckCard/LeadDeckCard.types';
import type { LeadSelectionBarProps, LeadTileWords } from '../LeadTile/LeadTile.types';
import type { TeamDockWords } from '../TeamDock/TeamDock.types';

/** What the open picker gives: one lead by its name, or the selection by its size (`M02-29`). */
export type InboxPickerSubject = { readonly name: string | null } | { readonly count: number };

/**
 * The inbox as its data hook assembles it (`useLeadInboxScreen`), named by shape here because this
 * package may not import `packages/data`; the hook's screen satisfies it.
 */
export interface InboxScreenFacts {
  readonly canAssign: boolean;
  readonly canJunk: boolean;
  readonly ways: readonly LeadSource[];
  readonly readerId: string | null;
  readonly read: Read<InboxView<InboxLead>>;
  readonly view: InboxView<InboxLead>;
  readonly departed: { readonly lead: InboxLead; readonly elapsedMs: number } | null;
  readonly team: {
    readonly read: Read<readonly AssignPickerPerson[]>;
    readonly people: readonly AssignPickerPerson[];
  };
  readonly loadingMore: boolean;
  showMore(): void;
  give(leadId: string, person: AssignPickerPerson): void;
  junk(leadId: string): void;
  retry(leadId: string): void;
  dismiss(leadId: string): void;
  step(step: 1 | -1): void;
  readonly selecting: boolean;
  setSelecting(on: boolean): void;
  select(leadId: string, selected: boolean): void;
  clearSelection(): void;
  readonly picking:
    | { readonly kind: 'lead'; readonly lead: InboxLead }
    | { readonly kind: 'selection'; readonly count: number }
    | null;
  openPicker(leadId: string): void;
  openSelectionPicker(): void;
  closePicker(): void;
  pick(userId: string): void;
}

/** Every word the inbox draws, built in `@heliogrid/i18n` (`leadInboxWords`). */
export interface LeadInboxWords {
  deck: LeadDeckCardWords;
  dock: TeamDockWords;
  tile: LeadTileWords;
  act: InboxActLineWords;
  selection: LeadSelectionBarProps['words'];
  teaching: InboxTeachingWords;
  /** A source's word (`leadSourceWord`). */
  source: (source: string) => TranslatedText;
  /** The picker's words for what it gives (`assignPickerWords`). */
  picker: (subject: InboxPickerSubject) => AssignPickerWords;
  /** "Up next". */
  upNext: TranslatedText;
  select: TranslatedText;
  doneSelecting: TranslatedText;
  /** The tiles' bill column's head — "Monthly bill", its tier beside it once. */
  billColumn: TranslatedText;
  showMore: (count: number) => TranslatedText;
  loading: TranslatedText;
  failedTitle: TranslatedText;
  failedMessage: TranslatedText;
  retry: TranslatedText;
}

/**
 * **The Lead Inbox's body** (`SCR-M02-02`), both platforms: the queue's calm wait, its failure with
 * *Try again*, the teaching inbox (`M02-25`), or the deck with the team docked in it and the queue
 * under it, and the one assign picker. What it draws is the hook's; the screen supplies only its
 * platform's moves and the bill's formatter.
 */
export interface LeadInboxProps {
  screen: InboxScreenFacts;
  /** `deck` below the stage's room, `stage` from it (the desktop). */
  layout: LeadDeckCardLayout;
  words: LeadInboxWords;
  /** The tenant currency's formatter for a bill (`useFormat().money`). */
  money: (amount: string) => string;
  onAdd: () => void;
  onWay: (way: LeadSource) => void;
  /** Opens a queued lead's detail; absent, nothing opens. */
  onOpen?: (leadId: string) => void;
  /** Where focus goes once a returned act's line is cleared. */
  focusAfter: FocusAfter;
}
