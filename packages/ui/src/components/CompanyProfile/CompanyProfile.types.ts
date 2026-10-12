import type { CompanyProfilePart, StandingMark, TenantSegment } from '@heliogrid/domain';

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
  readonly tax: {
    /** The market pack's name for its registration, marked optional. */
    readonly label: string;
    /** The market's format in one line: the field's help, until `error` says it instead. */
    readonly format: string;
    /** The format again, as the field's error, while what is typed does not read as one. */
    readonly error: string | null;
    /** What was checked and what was not — printed whole under the field. */
    readonly checked: string;
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
  readonly declarations: {
    /** The kinds' group, named above its cards. */
    readonly group: string;
    readonly options: readonly {
      readonly value: TenantSegment;
      readonly title: string;
      readonly description: string;
    }[];
    readonly sizeLabel: string;
    readonly unit: string;
    readonly sizeHint: string;
    /** Where the size comes from — beside its tier. */
    readonly sizeSource: string;
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

/** The fields a person types text into, each reported by its own name. */
export type CompanyProfileField =
  | 'companyName'
  | 'city'
  | 'address'
  | 'postalCode'
  | 'taxRegistration'
  | 'bankName'
  | 'accountName'
  | 'accountNumber'
  | 'bankRoutingIdentifier';

/**
 * What the screen holds: each text field as typed, an empty string where nothing is, and the two
 * declarations of the step before, null until declared.
 */
export type CompanyProfileValues = Readonly<Record<CompanyProfileField, string>> & {
  readonly segment: TenantSegment | null;
  /** In kWp. */
  readonly typicalSystemKwp: number | null;
};

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
  onChooseSegment: (segment: TenantSegment) => void;
  /** The size as typed or stepped, in kWp; a field never reports an empty size. */
  onDeclareSize: (kwp: number) => void;
  /** A save is under way. */
  saving: boolean;
  /** The primary, whichever word it carries: the save, or its retry. */
  onSave: () => void;
  /** Reads the profile again, after a read that failed. */
  onRetryRead: () => void;
  /** Leaves the step with nothing saved: after a failed read, or a failed save. */
  onContinueWithout: () => void;
}
