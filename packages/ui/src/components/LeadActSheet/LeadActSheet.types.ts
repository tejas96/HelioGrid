import type { TranslatedText } from '@heliogrid/contracts';
import type { CallOutcome, DisqualifyReason, LeadStage } from '@heliogrid/domain';
import type { DatePickerWords, ISODate } from '../DatePicker/DatePicker.types';
import type { PhoneFieldWords } from '../PhoneField/PhoneField.types';
import type { SelectOption } from '../Select/Select.types';
import type { TimeFieldWords } from '../TimeField/TimeField.types';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';
import type {
  LeadCallBackWords,
  LeadContactWords,
  LeadDetailsWords,
  LeadDisqualifyWords,
  LeadJunkWords,
  LeadLogWords,
  LeadMessageWords,
  LeadSnoozeWords,
  LeadVisitWords,
} from './LeadActSheet.parts.types';

export * from './LeadActSheet.parts.types';

/** What Log activity sends: a call and how it ended with an optional note, or a note alone. */
export type LeadLogDraft =
  | {
      readonly kind: 'call';
      readonly outcome: CallOutcome;
      // biome-ignore lint/plugin/copy-prop-type: what the person typed, sent as written — a fact
      readonly note: string | null;
    }
  | { readonly kind: 'note'; readonly text: string };

/** A visit as the sheet sends it: the tenant's day and time, the surveyor and the confirmed address. */
export interface LeadVisitDraft {
  readonly date: ISODate;
  /** `HH:MM` on the tenant's clock. */
  readonly time: string;
  readonly surveyorId: string;
  readonly address: string;
}

/** The lead's name and city as the sheet sends them; an emptied one goes back to its named gap. */
export interface LeadDetailsDraft {
  readonly name: string | null;
  readonly city: string | null;
}

/** A contact as the sheet sends it (`M02-34`). */
export interface LeadContactDraft {
  readonly name: string;
  readonly phoneE164: string;
  readonly roleLabelId: string | null;
}

/** The record a contact's number already belongs to — its three facts, pointing to Merge (`M02-02`). */
export interface LeadPhoneTaken {
  /** The other customer by name — a fact; null when it is outside the person's scope. */
  readonly name: string | null;
  readonly ownerName: string | null;
  readonly stage: LeadStage;
  /** "4 days ago", or "Not contacted yet". */
  readonly lastContact: TranslatedText;
  /** Merge this customer with that one; null when that record is outside the person's scope. */
  readonly onMerge: (() => void) | null;
}

/** Each act's form — the one the sheet draws, with its words and its send. */
export type LeadActForm =
  | {
      readonly kind: 'log';
      readonly words: LeadLogWords;
      readonly onSend: (log: LeadLogDraft) => void;
    }
  | {
      readonly kind: 'visit';
      /** A first booking, or the no-show reschedule of the visit booked (`M02-48`). */
      readonly mode: 'book' | 'reschedule';
      /** What the fields start with — the booked visit's surveyor and address on a reschedule. */
      readonly start: Partial<LeadVisitDraft>;
      /** The first day a visit can be on — today on the tenant's clock. */
      readonly firstDay: ISODate;
      /** Who can survey (`D15`): the read, and each person as an option. */
      readonly surveyors: { readonly read: SurfaceRead; readonly options: readonly SelectOption[] };
      readonly words: LeadVisitWords;
      readonly onSend: (visit: LeadVisitDraft) => void;
    }
  | {
      readonly kind: 'snooze';
      /** The first day it can wake — tomorrow on the tenant's clock (`M02-51`). */
      readonly firstDay: ISODate;
      readonly words: LeadSnoozeWords;
      readonly onSend: (wakeOn: ISODate) => void;
    }
  | {
      readonly kind: 'disqualify';
      readonly words: LeadDisqualifyWords;
      readonly onSend: (reason: DisqualifyReason) => void;
    }
  | { readonly kind: 'junk'; readonly words: LeadJunkWords; readonly onSend: () => void }
  | {
      readonly kind: 'callBack';
      readonly firstDay: ISODate;
      readonly words: LeadCallBackWords;
      readonly onSend: (due: { readonly date: ISODate; readonly time: string }) => void;
    }
  | {
      readonly kind: 'message';
      /** The text being composed, then ready to paste. */
      readonly read: SurfaceRead;
      /** The tenant's own template filled for this lead, shown as written (`F3-10`). */
      readonly text: string | null;
      /** The messages on offer — the visit confirmation only once a visit is booked. */
      readonly templates: readonly { readonly key: string; readonly label: TranslatedText }[];
      readonly template: string;
      readonly onTemplate: (key: string) => void;
      /** The text was copied or handed on: the act says so, and no delivery is ever claimed. */
      readonly handedOn: boolean;
      readonly words: LeadMessageWords;
      /** Copy on the web; the phone's share sheet, which holds Copy and the person's own apps. */
      readonly onSend: () => void;
    }
  | {
      readonly kind: 'details';
      /** The name and city on the record now — null where a capture left a gap. */
      readonly start: LeadDetailsDraft;
      readonly words: LeadDetailsWords;
      /** Only the fields that differ from `start`: an untouched one is never sent back stale. */
      readonly onSend: (changed: Partial<LeadDetailsDraft>) => void;
    }
  | {
      readonly kind: 'contact';
      /** The contact being edited; null adds one. */
      readonly start: LeadContactDraft | null;
      readonly labels: { readonly read: SurfaceRead; readonly options: readonly SelectOption[] };
      /** Adds a role of the company's own and answers its id, picked once it lands. */
      readonly onAddLabel: (text: string) => void;
      readonly addingLabel: boolean;
      /** A label just added, to pick in the role field. */
      readonly addedLabelId: string | null;
      readonly phoneTaken: LeadPhoneTaken | null;
      readonly words: LeadContactWords;
      readonly onSend: (contact: LeadContactDraft) => void;
    };

/**
 * The lead's acts, each in one sheet (`SCR-M02-04`'s states table): Log activity, Book visit,
 * Snooze (a wake date required), Disqualify (one of the six reasons required — its send sleeps until
 * one is picked), Junk, a call-back, Message (text to copy, never a sent claim) and a contact. While
 * its send is out its fields are inert and every way out waits; a failure is said inside the sheet.
 */
export interface LeadActSheetProps {
  readonly form: LeadActForm | null;
  /** Backdrop, Esc, close or drag — refused while the send is out. */
  readonly onClose: () => void;
  readonly pending: boolean;
  /** Why the send came back undone, said above the sheet's send. */
  readonly failure: TranslatedText | null;
  readonly closeLabel: TranslatedText;
  /** The field words every form shares. */
  readonly fields: {
    readonly date: DatePickerWords;
    readonly time: TimeFieldWords;
    readonly phone: PhoneFieldWords;
  };
}
