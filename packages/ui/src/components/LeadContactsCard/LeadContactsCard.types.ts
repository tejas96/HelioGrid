import type { TranslatedText } from '@heliogrid/contracts';
import type { SelectOption } from '../Select/Select.types';

/** One person to reach on the lead: the customer themself (`id` null) or one of their contacts. */
export interface LeadContactRow {
  readonly id: string | null;
  /** As typed — a fact; null draws the named gap. */
  readonly name: string | null;
  /** The number as the market writes it, set in mono (`F7-09`). */
  readonly phone: string;
  readonly phoneE164: string;
  /** The role label's words — seeded ones from the catalog, a company's own as typed; null for none. */
  readonly role: TranslatedText | null;
  /** Exactly one row is primary (`M02-34`). */
  readonly primary: boolean;
  /** A call to this number is offered (`M02-37`, `M02-44`). */
  readonly dial: boolean;
}

/** Every word the card says, built in `@heliogrid/i18n` (`leadContactsWords`). */
export interface LeadContactsCardWords {
  /** "Contacts · 2". */
  readonly title: (count: number) => TranslatedText;
  readonly add: TranslatedText;
  readonly primary: TranslatedText;
  readonly noName: TranslatedText;
  /** The row acts' spoken names, with the person's name or number in them. */
  readonly call: (who: string) => TranslatedText;
  readonly edit: (who: string) => TranslatedText;
  readonly makePrimary: (who: string) => TranslatedText;
  /** While a primary is being named — "Making primary…". */
  readonly makingPrimary: TranslatedText;
  /** The do-not-call switch (`M02-37`) and what it does. */
  readonly doNotCall: TranslatedText;
  readonly doNotCallHint: TranslatedText;
  /** The preferred language (`M02-37`), its unset choice and the list's close. */
  readonly language: TranslatedText;
  readonly languageUnset: TranslatedText;
  readonly close: TranslatedText;
}

/** A calling fact's save: whether it is out. */
export interface LeadCallingFact<V> {
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly pending: boolean;
}

/**
 * The customer's contacts and calling facts (`M02-34`, `M02-37`), above the history so the rep
 * knows who decides before dialling: each person with their role label, the one primary and a call
 * act; add, edit and make primary; the do-not-call switch and the preferred language.
 */
export interface LeadContactsCardProps {
  readonly contacts: readonly LeadContactRow[];
  readonly onAdd: () => void;
  /** Opens a contact's edit; the customer's own row has none here. */
  readonly onEdit: (contactId: string) => void;
  /** Names the primary — a contact, or `null` for the customer themself. */
  readonly onMakePrimary: (contactId: string | null) => void;
  /** The row whose primary is being named, while that save is out; `undefined` when none is. */
  readonly primaryPending: string | null | undefined;
  readonly onDial: (phoneE164: string) => void;
  readonly doNotCall: LeadCallingFact<boolean>;
  /** The UI languages by their own names; `null` is not set. */
  readonly language: LeadCallingFact<string | null> & { readonly options: readonly SelectOption[] };
  /** A save here that came back undone — a calling fact or a primary — said in the card. */
  readonly failure: TranslatedText | null;
  /**
   * The narrow page's card: it opens folded to its head and the primary person, so Call stays one
   * tap away and the page's top stays short; the head opens the rest — the other people, do not
   * call and the language. The wide page's is open.
   */
  readonly foldable: boolean;
  readonly words: LeadContactsCardWords;
}
