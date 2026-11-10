import type { TranslatedText } from '@heliogrid/contracts';
import type { DealSegment, NumberCheck, QuickAddDraft } from '@heliogrid/domain';
import type { PhoneFieldWords } from '../PhoneField/PhoneField.types';

/** Every word the form draws, built in `@heliogrid/i18n` (`quickAddWords(t, facts).form`). */
export interface QuickAddFormWords {
  phone: TranslatedText;
  phoneField: PhoneFieldWords;
  name: TranslatedText;
  city: TranslatedText;
  /** The segment's field — "Type" (`M02-05`). */
  type: TranslatedText;
  segments: Readonly<Record<DealSegment, TranslatedText>>;
  save: TranslatedText;
  /** The line under Save while the save is out — "Saving the lead…". */
  saving: TranslatedText;
  tryAgain: TranslatedText;
  dismiss: TranslatedText;
}

/** What the live check found, with the words it says under the phone (`M02-07`). */
export interface QuickAddCheckLine {
  readonly kind: Exclude<NumberCheck['kind'], 'none'>;
  readonly words: TranslatedText;
}

/**
 * Quick add's four fields and Save (`SCR-M02-01`, `M02-01`): the phone first, with the market's
 * dial code and the live check's line under it; then name, city and the type. Only the phone is
 * required, and a refused Save says why at the phone. While a save is out the fields are inert,
 * Save carries its rail and a second press sends nothing; a save that came back undone says so
 * under Save and keeps every typed value. What it holds, checks and sends is the caller's.
 */
export interface QuickAddFormProps {
  /** E.164 as `PhoneField` hands it back, or `''`. */
  phoneE164: string;
  name: string;
  city: string;
  /** `null` while no type is chosen — a named gap on the lead, never a guess. */
  segment: DealSegment | null;
  onPhone: (phoneE164: string) => void;
  onName: (name: string) => void;
  onCity: (city: string) => void;
  onSegment: (segment: DealSegment) => void;
  /** The line under the phone; `null` until the number is whole. */
  check: QuickAddCheckLine | null;
  /** Why the pressed Save sent nothing, said at the phone with the shape expected. */
  phoneRefusal: TranslatedText | null;
  /** Each new number lands focus on the phone — a refused Save, a capture opened again. */
  phoneFocus: number;
  /** "Came from Priya Sharma" (`M02-16`): drawn only for a referral. */
  cameFrom: TranslatedText | null;
  /** A save is out. */
  saving: boolean;
  /** Why the save came back undone — a whole sentence under Save; `null` while none did. */
  returned: TranslatedText | null;
  onSave: () => void;
  onRetry: () => void;
  onDismissReturned: () => void;
  words: QuickAddFormWords;
}

/**
 * The capture as its data hook holds it (`useQuickAddScreen`), named by shape here because this
 * package may not import `packages/data`; the hook's screen satisfies it.
 */
export interface QuickAddScreenFacts {
  readonly open: boolean;
  close(): void;
  readonly draft: QuickAddDraft;
  setPhone(phoneE164: string): void;
  setName(name: string): void;
  setCity(city: string): void;
  setSegment(segment: DealSegment): void;
  readonly phoneFocus: number;
  readonly saving: boolean;
  save(): void;
  dismissSaveFailure(): void;
  /** The duplicate sheet is up over the capture: the capture waits under it. */
  readonly duplicate: object | null;
}

/** The capture's words for this moment, built in `@heliogrid/i18n` (`quickAddWords`). */
export interface QuickAddScreenWords
  extends Pick<QuickAddFormProps, 'check' | 'phoneRefusal' | 'cameFrom' | 'returned'> {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  readonly form: QuickAddFormWords;
}
