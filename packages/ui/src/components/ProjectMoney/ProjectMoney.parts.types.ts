import type { PayRequest, PayTo, ProjectPart, TranslatedText } from '@heliogrid/contracts';
import type { ReferenceStanding } from '@heliogrid/domain';
import type { DatePickerWords } from '../DatePicker/DatePicker.types';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/**
 * The money sheets over the payments screen (`SCR-M11-02`, `SCR-M11-03`): collect a part — its UPI
 * QR for exactly what it owes, or the bank — record money that arrived, and say why for a reversal
 * or a waiver. While a send is out the fields are inert and every way out waits; a refusal is said
 * inside the sheet, above its send.
 */

/** A picked receipt photo, as the app hands it over. */
export interface MoneyPhoto {
  readonly name: string;
  /** A local address the photo can be shown from. */
  readonly preview: string;
}

/** What a person typed to record money (`M11-34`); the amount is the market's decimal text. */
export interface MoneyTyped {
  readonly partId: string;
  readonly amount: string;
  readonly mode: string;
  readonly reference: string | null;
  readonly receivedOn: string;
}

export type MoneySheetForm =
  | {
      readonly kind: 'collect';
      readonly part: ProjectPart;
      readonly request: PayRequest;
      readonly payTo: PayTo;
      /** The project as the customer reads it on the sheet. */
      readonly projectName: string;
      /** The request opened in the customer's chat, typed and ready; null where the market has none. */
      readonly onChat: (() => void) | null;
      /** How the message leaves otherwise: the phone's share sheet, or the web's copy. */
      readonly onSend: (text: string) => void;
      readonly onFullScreen: (() => void) | null;
      readonly onRecord: () => void;
    }
  | {
      readonly kind: 'record';
      readonly part: ProjectPart;
      readonly modes: readonly string[];
      readonly today: string;
      readonly photo: MoneyPhoto | null;
      readonly onPickPhoto: () => void;
      readonly onRemovePhoto: () => void;
      readonly recorder: string;
      /** Whether the typed reference is already on a receipt, said before the save (`M11-38`). */
      readonly reference: ReferenceStanding;
      readonly onReference: (typed: string) => void;
      readonly onSend: (typed: MoneyTyped) => void;
    }
  | {
      readonly kind: 'reverse';
      readonly amount: string;
      readonly onSend: (reason: string) => void;
    }
  | {
      readonly kind: 'waive';
      readonly part: ProjectPart;
      readonly onSend: (reason: string) => void;
    };

export interface MoneySheetWords {
  readonly close: TranslatedText;
  readonly collectTitle: (amount: string) => TranslatedText;
  readonly collectLead: (name: string, part: string) => TranslatedText;
  readonly upiTab: TranslatedText;
  readonly bankTab: TranslatedText;
  readonly qrLabel: (amount: string) => TranslatedText;
  readonly qrFailedTitle: TranslatedText;
  readonly qrFailedMessage: TranslatedText;
  readonly noteOnPayment: (note: string) => TranslatedText;
  /** The send's word: *Share* on the phone, *Copy message* on the web. */
  readonly send: TranslatedText;
  readonly sendChat: TranslatedText;
  readonly fullScreen: TranslatedText;
  /** Under the full-screen QR: any UPI app reads it, with the amount filled in. */
  readonly scanAny: TranslatedText;
  readonly overLimit: (limit: string) => TranslatedText;
  readonly noUpi: TranslatedText;
  readonly noBank: TranslatedText;
  readonly accountName: TranslatedText;
  readonly accountNumber: TranslatedText;
  readonly bankName: TranslatedText;
  readonly routing: TranslatedText;
  readonly paidRecord: TranslatedText;
  readonly recordTitle: TranslatedText;
  readonly recordLead: (part: string, left: string) => TranslatedText;
  readonly amount: TranslatedText;
  /** The amount starts as what is left; the server says how the part stands after the save. */
  readonly amountHint: TranslatedText;
  readonly amountMatches: TranslatedText;
  readonly amountLess: TranslatedText;
  readonly amountMore: TranslatedText;
  readonly paidBy: TranslatedText;
  readonly mode: (mode: string) => TranslatedText;
  readonly reference: TranslatedText;
  readonly referenceHint: TranslatedText;
  readonly referenceNew: TranslatedText;
  readonly referenceUsed: (receipt: string) => TranslatedText;
  readonly receivedOn: TranslatedText;
  readonly photo: TranslatedText;
  readonly addPhoto: TranslatedText;
  readonly replacePhoto: TranslatedText;
  readonly removePhoto: TranslatedText;
  readonly save: (amount: string) => TranslatedText;
  readonly savedAs: (name: string) => TranslatedText;
  readonly reverseTitle: (amount: string) => TranslatedText;
  readonly reverseLine: TranslatedText;
  readonly waiveTitle: (part: string) => TranslatedText;
  readonly waiveLine: (amount: string) => TranslatedText;
  readonly why: TranslatedText;
  readonly reverse: TranslatedText;
  readonly waive: TranslatedText;
  readonly number: NumberFieldWords;
  readonly calendar: DatePickerWords;
}

export interface MoneySheetProps {
  /** The form open; `null` closes the sheet. */
  readonly form: MoneySheetForm | null;
  readonly words: MoneySheetWords;
  readonly onClose: () => void;
  readonly sending: boolean;
  /** Why the last send did not land, in the person's words. */
  readonly failure: TranslatedText | null;
  /** The field the failure is about: said there, ringed, instead of above the send. */
  readonly failureField: 'reference' | null;
  /** The market's UPI request limit, formatted — what the over-limit line names. */
  readonly upiLimit: string | null;
}

/**
 * The pay QR shown full screen to the customer across the table (owner ruling 2026-11-11): the amount, the QR
 * for exactly that, and who is paid. `request` null closes it.
 */
export interface MoneyQrFullProps {
  readonly request: PayRequest | null;
  readonly payTo: PayTo;
  readonly words: MoneySheetWords;
  readonly onClose: () => void;
}
