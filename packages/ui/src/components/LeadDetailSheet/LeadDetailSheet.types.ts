import type {
  ContactRoleLabel,
  CrmMessageTemplateKey,
  DedupeMatchWire,
  LeadDetail,
  TranslatedText,
} from '@heliogrid/contracts';
import type {
  DisqualifyReason,
  LeadActDays,
  LeadActFailure,
  LeadDetailView,
  LeadMember,
  Read,
} from '@heliogrid/domain';
import type { ISODate } from '../DatePicker/DatePicker.types';
import type {
  LeadActForm,
  LeadActSheetProps,
  LeadCallBackWords,
  LeadContactDraft,
  LeadContactWords,
  LeadDisqualifyWords,
  LeadJunkWords,
  LeadLogDraft,
  LeadLogWords,
  LeadMessageWords,
  LeadSnoozeWords,
  LeadVisitDraft,
  LeadVisitWords,
} from '../LeadActSheet/LeadActSheet.types';

/** The sheet the screen has open: one act's form, the message to copy, or a contact. */
export type LeadSheetOpen =
  | { readonly kind: Exclude<LeadActForm['kind'], 'message' | 'contact'> }
  | { readonly kind: 'message'; readonly template: CrmMessageTemplateKey }
  | { readonly kind: 'contact'; readonly contactId: string | null };

/** What a form's send hands the screen; a visit and a contact have sends of their own. */
export type LeadSheetAct =
  | { readonly kind: 'log'; readonly log: LeadLogDraft }
  | { readonly kind: 'snooze'; readonly wakeOn: ISODate }
  | { readonly kind: 'disqualify'; readonly reason: DisqualifyReason }
  | { readonly kind: 'junk' }
  | { readonly kind: 'callBack'; readonly date: ISODate; readonly time: string };

/** What the sheet reads and sends on the lead's screen; `useLeadDetailScreen` satisfies it. */
export interface LeadDetailSheetScreen {
  /** Today and tomorrow on the tenant's clock: the first days a visit, call-back or wake may take. */
  readonly days: LeadActDays;
  readonly acts: {
    readonly sheet: LeadSheetOpen | null;
    /** Another message picked in the open message sheet. */
    open(sheet: Extract<LeadSheetOpen, { kind: 'message' }>): void;
    /** Every way out — refused while the send is out. */
    close(): void;
    readonly sending: boolean;
    readonly sendFailure: LeadActFailure | null;
    send(act: LeadSheetAct): void;
  };
  /** Who can survey (`D15`), read once the visit sheet opens. */
  readonly surveyors: Read<readonly LeadMember[]>;
  /** Books the visit — or, with one booked, reschedules it as a no-show (`M02-48`). */
  sendVisit(visit: LeadVisitDraft): void;
  /** The messages on offer: the follow-up, and the visit confirmation once a visit is booked. */
  readonly templates: readonly CrmMessageTemplateKey[];
  readonly message: {
    readonly read: Read<string>;
    readonly handedOn: boolean;
    markHandedOn(): void;
  };
  readonly contacts: {
    readonly labels: Read<readonly ContactRoleLabel[]>;
    addLabel(text: string): void;
    readonly addingLabel: boolean;
    readonly addedLabelId: string | null;
    /** The record the typed number already belongs to; nothing was saved. */
    readonly phoneTaken: DedupeMatchWire | null;
    readonly saving: boolean;
    readonly saveFailure: LeadActFailure | null;
  };
  /** Saves the contact sheet's contact and closes the sheet once it lands. */
  saveContact(contact: LeadContactDraft): void;
  /** The reader may merge this customer with another (`crm.merge_customers`). */
  readonly canMerge: boolean;
}

/** Every form's words, built in `@heliogrid/i18n` (`leadActSheetWords`). */
export interface LeadActFormWords {
  readonly log: LeadLogWords;
  readonly visit: (mode: 'book' | 'reschedule') => LeadVisitWords;
  readonly snooze: LeadSnoozeWords;
  readonly disqualify: LeadDisqualifyWords;
  readonly junk: LeadJunkWords;
  readonly callBack: LeadCallBackWords;
  readonly message: LeadMessageWords;
  readonly template: Readonly<Record<CrmMessageTemplateKey, TranslatedText>>;
  readonly contact: LeadContactWords;
}

/** Every word the sheet says, built in `@heliogrid/i18n` (`leadDetailSheetWords`). */
export interface LeadDetailSheetWords {
  readonly forms: LeadActFormWords;
  /** Why a send came back undone, said inside the sheet above its send. */
  readonly failure: (failure: LeadActFailure) => TranslatedText;
  /** A role label's word — a seeded label's, or the company's own as typed. */
  readonly role: (label: ContactRoleLabel) => TranslatedText | null;
  /** "4 days ago", or "Not contacted yet", from the time since the other record's last contact. */
  readonly lastContact: (elapsedMs: number | null) => TranslatedText;
  readonly close: TranslatedText;
  readonly fields: LeadActSheetProps['fields'];
}

/**
 * **The sheet over Lead Detail** (`SCR-M02-04`'s states table), both platforms: the open act's form
 * wired to the screen's sends. While a send is out its fields wait; a failure is said inside the
 * sheet. The screen supplies how a message is handed on and the way to merge.
 */
export interface LeadDetailSheetProps {
  readonly screen: LeadDetailSheetScreen;
  readonly lead: LeadDetail;
  readonly view: LeadDetailView;
  /**
   * Hands the composed message on — the web copies it, the phone opens its share sheet — and calls
   * `handedOn` once it went; a dismissed share hands nothing on.
   */
  readonly onHandOn: (message: string, handedOn: () => void) => void;
  /** Customer merge: this customer the survivor, the other the record the typed number is on. */
  readonly onMerge: (survivorId: string, otherId: string) => void;
  readonly words: LeadDetailSheetWords;
}
