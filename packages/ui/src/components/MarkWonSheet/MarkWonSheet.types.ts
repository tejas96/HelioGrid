import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { DatePickerWords } from '../DatePicker/DatePicker.types';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/** *Mark won*'s words — `@heliogrid/i18n`'s `markWonWords`, by shape. */
export interface MarkWonWords {
  readonly title: TranslatedText;
  /** Whose deal it is, under the title — the lead's name, else its number. */
  readonly who: TranslatedText;
  readonly line: TranslatedText;
  readonly finalValue: TranslatedText;
  readonly installDate: TranslatedText;
  readonly manager: TranslatedText;
  readonly managerOnly: TranslatedText;
  readonly managersLoading: TranslatedText;
  readonly managersFailed: TranslatedText;
  /** The manager field while none is chosen, and why the send stopped when none was. */
  readonly managerNeeded: TranslatedText;
  readonly send: TranslatedText;
  readonly started: (number: string) => TranslatedText;
  readonly openProject: TranslatedText;
  readonly alreadyWon: TranslatedText;
  readonly closedLead: TranslatedText;
  /** The picked person can no longer manage a project — they left, or lost the grant. */
  readonly notManager: TranslatedText;
  readonly finerThanCurrency: TranslatedText;
  /** A send that came back with no answer the sheet can name. */
  readonly failed: TranslatedText;
  readonly valueNeeded: TranslatedText;
  readonly dateNeeded: TranslatedText;
  /** A promised day before the company's today (`isPromisableInstallDate`). */
  readonly dateInPast: TranslatedText;
  readonly liveProjects: (count: number) => TranslatedText;
  readonly retry: TranslatedText;
  readonly close: TranslatedText;
  readonly date: DatePickerWords;
  readonly numberField: NumberFieldWords;
}

/** What *Mark won* sends — `useMarkWon`'s draft, by shape: the value as typed, the day, the manager. */
export interface MarkWonSheetDraft {
  readonly finalValue: string;
  readonly expectedInstallOn: string;
  readonly managerId: string;
}

/** A person who may manage the project, with the live projects they already hold. */
export interface MarkWonManager {
  readonly userId: string;
  readonly name: string;
  readonly liveProjects: number;
}

/** Why the send did not land — `useMarkWon`'s failure, by shape. */
export type MarkWonSheetFailure =
  | 'already_won'
  | 'lead_closed'
  | 'finer_than_currency'
  | 'value_needed'
  | 'date_in_past'
  | 'not_a_manager'
  | 'failed';

/**
 * *Mark won* on a lead (`M07-62`, ruling 2026-11-10): the final value in the company's currency,
 * the expected install date and the project manager — the only one picked for the person, and said
 * so — then the send, busy while it is out, its failure said where it belongs, and the moment the
 * project exists with its number and the way to it. The draft lives with the screen, so closing the
 * sheet loses nothing. No limit is said here: the app's billing denial says that once.
 */
export interface MarkWonSheetProps {
  readonly open: boolean;
  readonly words: MarkWonWords;
  /** The company's today: the first day the install can be promised for. */
  readonly today: string;
  readonly draft: MarkWonSheetDraft;
  readonly onChange: (draft: MarkWonSheetDraft) => void;
  /** Who may manage the project; its failed read carries the retry the field draws. */
  readonly managers: Read<readonly MarkWonManager[]>;
  readonly sending: boolean;
  readonly failure: MarkWonSheetFailure | null;
  /** The project the send started, once it landed — the sheet then says so and offers it. */
  readonly started: { readonly number: string } | null;
  /** The whole draft, its manager filled where only one could manage — never sent incomplete. */
  readonly onSend: (draft: MarkWonSheetDraft) => void;
  /** Every way out — the sheet refuses it while the send is out. */
  readonly onClose: () => void;
  readonly onOpenProject: () => void;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** The project manager field: the only one picked, else a choice; its read's wait and failure. */
export interface MarkWonManagerFieldProps {
  readonly words: MarkWonWords;
  readonly managers: Read<readonly MarkWonManager[]>;
  /** The manager the send would carry — the chosen one, or the only one. */
  readonly managerId: string;
  /** A send was tried with none chosen. */
  readonly missing: boolean;
  readonly disabled: boolean;
  readonly onChoose: (managerId: string) => void;
}
