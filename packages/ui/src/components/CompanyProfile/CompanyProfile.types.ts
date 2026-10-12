import type { CompanyProfilePart, StandingMark } from '@heliogrid/domain';

/** One part of the profile as its header says it: its title, where it stands, and how that is marked. */
export interface CompanyProfilePartWords {
  readonly key: CompanyProfilePart;
  readonly title: string;
  readonly standing: string;
  readonly mark: StandingMark;
}

/**
 * Every word the screen draws; `@heliogrid/i18n`'s `companyProfileWords` writes them. The words are
 * the state: `loading` names the busy region while the record is read, `unread` holds the message
 * and both ways of a profile that could not be read, and `act.alert` is a save that failed — so the
 * component cannot draw one state under another's words.
 */
export interface CompanyProfileWords {
  readonly title: string;
  readonly lede: string;
  /** The five parts, in the screen's order. */
  readonly parts: readonly CompanyProfilePartWords[];
  readonly identity: { readonly companyName: string; readonly fromSignup: string };
  readonly address: {
    readonly street: string;
    readonly streetExample: string;
    readonly city: string;
    readonly fromSignup: string;
    readonly postalCode: string;
    readonly postalCodeExample: string;
    readonly purpose: string;
  };
  readonly bank: {
    readonly bankName: string;
    readonly bankNameExample: string;
    readonly accountHolder: string;
    readonly accountNumber: string;
    readonly accountNumberExample: string;
    /** The market pack's name for its bank-routing identifier. */
    readonly routing: string;
    readonly routingExample: string;
    /** What was checked and what was not — printed whole under the routing field. */
    readonly checked: string;
    readonly purpose: string;
  };
  readonly loading: string | null;
  readonly unread: {
    readonly title: string;
    readonly line: string;
    readonly retry: string;
    readonly onward: string;
    readonly onwardSpoken: string;
  } | null;
  /** None when the profile could not be read: `unread` holds both ways. */
  readonly act: {
    readonly primary: string;
    readonly primarySpoken: string;
    /** Why the primary cannot be pressed yet. */
    readonly waiting: string | null;
    /** The way on without saving, after a failed save alone. */
    readonly secondary: string | null;
    readonly secondarySpoken: string | null;
    /** The failed save, said once, above the acts. */
    readonly alert: string | null;
    /** The one line under the act. */
    readonly line: string | null;
  } | null;
}

/** What the fields hold, as typed; an empty string where nothing is. */
export interface CompanyProfileValues {
  readonly companyName: string;
  readonly city: string;
  readonly address: string;
  readonly postalCode: string;
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly bankRoutingIdentifier: string;
}

export type CompanyProfileField = keyof CompanyProfileValues;

/**
 * The company profile's setup life (`SCR-M01-05`; `M01-24`, `M01-31`): five flat parts with where
 * each stands, one open at a time, and one act that is live with nothing filled in. The component
 * holds no draft and saves nothing: every keystroke is reported by its field, so a field can also
 * be emptied, and the screen that holds the values decides what a save writes.
 */
export interface CompanyProfileProps {
  words: CompanyProfileWords;
  values: CompanyProfileValues;
  /** The part that is open, or none. */
  open: CompanyProfilePart | null;
  onOpen: (part: CompanyProfilePart | null) => void;
  onEdit: (field: CompanyProfileField, value: string) => void;
  /** A save is under way. */
  saving: boolean;
  /** The primary, whichever word it carries: the save, or its retry. */
  onSave: () => void;
  /** Reads the profile again, after a read that failed. */
  onRetryRead: () => void;
  /** Leaves the step with nothing saved: after a failed read, or a failed save. */
  onContinueWithout: () => void;
}
