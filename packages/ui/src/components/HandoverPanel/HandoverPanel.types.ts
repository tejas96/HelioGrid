import type { HandoverPreview, TranslatedText } from '@heliogrid/contracts';
import type { HandoverOpening, Read } from '@heliogrid/domain';
import type { PhoneFieldWords } from '../PhoneField/PhoneField.types';

/** The handover's words — `@heliogrid/i18n`'s `handoverWords`, by shape. */
export interface HandoverWords {
  readonly title: TranslatedText;
  readonly ready: TranslatedText;
  readonly readyLine: (done: number, notNeeded: number) => TranslatedText;
  readonly waitingTitle: TranslatedText;
  readonly waitingLine: TranslatedText;
  /** Before the stage handover opens at: that stage, named. */
  readonly notYet: (stage: string) => TranslatedText;
  readonly closed: TranslatedText;
  readonly row: (row: string) => TranslatedText;
  readonly packTitle: TranslatedText;
  /** Before the handover: what the pack will hold, made at the handover itself. */
  readonly packUnmade: (files: number) => TranslatedText;
  readonly packMade: (files: number) => TranslatedText;
  /** Made, with the files it could not read left out of it. */
  readonly packMadeLeftOut: (files: number, leftOut: number) => TranslatedText;
  /** Made with no file it could read: there is no pack. */
  readonly packUnreadable: TranslatedText;
  /** No file to put in a pack: none is made. */
  readonly packEmpty: TranslatedText;
  readonly packMaking: TranslatedText;
  readonly packLate: TranslatedText;
  readonly download: TranslatedText;
  /** The message's overline, naming the customer's language from its code (`mr`, `hi`, `en`). */
  readonly message: (language: string) => TranslatedText;
  readonly share: TranslatedText;
  readonly copy: TranslatedText;
  readonly copied: TranslatedText;
  readonly noDelivery: TranslatedText;
  readonly send: TranslatedText;
  readonly done: TranslatedText;
  /** Under the moment: whose job, and that the pack — or, with none, the history — stays. */
  readonly doneLine: (name: string, packed: boolean) => TranslatedText;
  readonly referralTitle: TranslatedText;
  readonly referralLine: (name: string | null) => TranslatedText;
  readonly referralName: TranslatedText;
  readonly referralPhone: TranslatedText;
  readonly referralAdd: TranslatedText;
  readonly referralSkip: TranslatedText;
  readonly referralNote: TranslatedText;
  readonly referralAdded: (name: string) => TranslatedText;
  /** The number already belongs to a customer: nothing new was made. */
  readonly referralKnown: TranslatedText;
  /** The referral did not land. */
  readonly referralFailed: TranslatedText;
  readonly phoneField: PhoneFieldWords;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
  readonly close: TranslatedText;
}

/** The project as handover reads it — the detail, by shape. */
export interface HandoverProject {
  readonly stage: string;
  /** The project's own number: its name where the customer's record holds none. */
  readonly number: string;
  readonly customer: { readonly name: string | null };
  readonly documents: readonly { readonly state: string }[];
}

/**
 * The handover pack — `useHandover`'s, by shape: no file to put in one (`empty`), what it will hold
 * before the handover (`unmade`), then being made by the server, ready, or late.
 */
export type HandoverPackState =
  | { readonly kind: 'empty' }
  | { readonly kind: 'unmade'; readonly files: number }
  | { readonly kind: 'making'; readonly files: number }
  | {
      readonly kind: 'ready';
      readonly files: number;
      readonly leftOut: number;
      readonly fileId: string;
    }
  | { readonly kind: 'late'; readonly files: number }
  | { readonly kind: 'unreadable'; readonly files: number };

/** A referral named at handover — `useHandover`'s draft, by shape. */
export interface HandoverReferralDraft {
  readonly name: string;
  readonly phoneE164: string;
}

/**
 * The handover (`SCR-M08-06`, `M08-46`, `M08-47`), in two beats. Before: the one hero says every
 * document is done — or names each row that still waits, with the way to its document — then the
 * pack it will make, the message in the customer's own language, and the act, off with its reason
 * while a row waits. After: the moment it is handed over; the pack the server makes a few seconds
 * later, to download; the message, which the person shares themselves (the phone's share sheet,
 * the desktop's Copy) — HelioGrid never claims it was delivered; and the referral ask as the hero.
 * Nothing is offered for a referral: no credit, no points. *Not now* skips it.
 */
export interface HandoverPanelProps {
  /** What handover checks, and the message — `useHandover`'s read. */
  readonly preview: Exclude<Read<HandoverPreview>, { readonly kind: 'empty' }>;
  readonly project: HandoverProject;
  /** Whether handover can be sent at the project's stage — the detail view's `handover`. */
  readonly opening: HandoverOpening;
  readonly words: HandoverWords;
  /** Opens a waiting row's document, to upload it or mark it not needed. */
  readonly onOpenRow: (row: string) => void;
  readonly onHandOver: () => void;
  /** The pack, from what it will hold to its file. */
  readonly pack: HandoverPackState;
  /** Opens the made pack's file, by its stored file's id. */
  readonly onDownload: (fileId: string) => void;
  /** Looks again for a pack that is late. */
  readonly onLookAgain: () => void;
  /** The handover is out: its act is busy and a second press sends nothing. */
  readonly sending: boolean;
  /** Why the handover came back undone, worded by the screen; or null. */
  readonly failure: TranslatedText | null;
  /** Hands the message to the phone's share sheet; null where there is none (the desktop). */
  readonly onShare: ((text: string) => void) | null;
  /** Copies the message; null where the share sheet already holds Copy (the phone). */
  readonly onCopy: ((text: string) => void) | null;
  /** The message was copied — said beside it, never as a delivery. */
  readonly copied: boolean;
  readonly onRefer: (draft: HandoverReferralDraft) => void;
  readonly referring: boolean;
  /** The name the referral was added under, once it landed as a new lead. */
  readonly referred: string | null;
  /** The number that already belongs to a customer; the ask says so while it is the one typed. */
  readonly referralKnown: string | null;
  readonly referralFailed: boolean;
  /** *Not now*: the referral is not asked, and the person is done here. */
  readonly onSkipReferral: () => void;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** The ready message: its language, its text as written, and the person's own ways to send it. */
export interface HandoverMessageProps {
  readonly words: HandoverWords;
  readonly message: HandoverPreview['message'];
  /** Handed over: the person's own ways to send it are drawn; before, the message alone. */
  readonly sendable: boolean;
  readonly onShare: HandoverPanelProps['onShare'];
  readonly onCopy: HandoverPanelProps['onCopy'];
  readonly copied: boolean;
}

/** The pack's tile: what it holds, and — once made — its download, or its retry when late. */
export type HandoverPackProps = Pick<
  HandoverPanelProps,
  'words' | 'pack' | 'onDownload' | 'onLookAgain'
>;

/** The referral ask, after the handover: a name and a mobile, added as a lead referred by them. */
export type HandoverReferralProps = Pick<
  HandoverPanelProps,
  | 'words'
  | 'onRefer'
  | 'referring'
  | 'referred'
  | 'referralKnown'
  | 'referralFailed'
  | 'onSkipReferral'
> & {
  /** The customer the ask names, as their record holds it; null when it holds none. */
  readonly customerName: string | null;
};
