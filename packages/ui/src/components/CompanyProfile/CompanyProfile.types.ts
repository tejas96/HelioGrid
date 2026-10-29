import type { TranslatedText } from '@heliogrid/contracts';
import type {
  CompanyProfileField,
  CompanyProfileLife,
  CompanyProfilePart,
  CompanyProfileValues,
  Read,
  StandingMark,
  TenantSegment,
} from '@heliogrid/domain';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/** One part of the profile as its header says it: its title, where it stands, and how that is marked. */
export interface CompanyProfilePartWords {
  readonly key: CompanyProfilePart;
  readonly title: TranslatedText;
  readonly standing: TranslatedText;
  readonly mark: StandingMark;
}

/**
 * Every word the screen draws; `@heliogrid/i18n`'s `companyProfileWords` writes them. The words are
 * the state: `loading` names the busy region while the record is read, `unread` holds the message
 * and both ways of a profile that could not be read, and `act.alert` is a save that failed — so the
 * component cannot draw one state under another's words.
 */
export interface CompanyProfileWords {
  readonly title: TranslatedText;
  readonly lede: TranslatedText;
  /** The five parts, in the screen's order. */
  readonly parts: readonly CompanyProfilePartWords[];
  readonly identity: { readonly companyName: TranslatedText; readonly fromSignup: TranslatedText };
  readonly address: {
    readonly street: TranslatedText;
    readonly streetExample: TranslatedText;
    readonly city: TranslatedText;
    readonly fromSignup: TranslatedText;
    readonly postalCode: TranslatedText;
    readonly postalCodeExample: TranslatedText;
    readonly purpose: TranslatedText;
  };
  readonly tax: {
    /** The market pack's name for its registration, marked optional. */
    readonly label: TranslatedText;
    /** The market's format in one line: the field's help, until `error` says it instead. */
    // biome-ignore lint/plugin/copy-prop-type: the market pack's example of the tax id's format
    readonly format: string;
    /** The format again, as the field's error, while what is typed does not read as one. */
    // biome-ignore lint/plugin/copy-prop-type: the market pack's example of the tax id's format
    readonly error: string | null;
    /** What was checked and what was not — printed whole under the field. */
    readonly checked: TranslatedText;
  };
  readonly bank: {
    readonly bankName: TranslatedText;
    readonly bankNameExample: TranslatedText;
    readonly accountHolder: TranslatedText;
    readonly accountNumber: TranslatedText;
    readonly accountNumberExample: TranslatedText;
    /** The market pack's name for its bank-routing identifier. */
    // biome-ignore lint/plugin/copy-prop-type: the market pack's name for the bank's routing code
    readonly routing: string;
    readonly routingExample: TranslatedText;
    /** What was checked and what was not — printed whole under the routing field. */
    readonly checked: TranslatedText;
    readonly purpose: TranslatedText;
  };
  readonly declarations: {
    /** The kinds' group, named above its cards. */
    readonly group: TranslatedText;
    readonly options: readonly {
      readonly value: TenantSegment;
      readonly title: TranslatedText;
      readonly description: TranslatedText;
    }[];
    readonly sizeLabel: TranslatedText;
    // biome-ignore lint/plugin/copy-prop-type: kWp, a unit never translated
    readonly unit: string;
    readonly sizeHint: TranslatedText;
    /** Where the size comes from — beside its tier. */
    readonly sizeSource: TranslatedText;
  };
  /**
   * The letterhead the profile builds, previewed beside the list on a wide screen. It shows only
   * what the fields hold: an empty line, or a `null`, is drawn as a bar.
   */
  readonly letterhead: {
    readonly overline: TranslatedText;
    /** Stands in the logo's place until one is added. */
    readonly logo: TranslatedText;
    // biome-ignore lint/plugin/copy-prop-type: the company's name as the profile holds it
    readonly name: string;
    // biome-ignore lint/plugin/copy-prop-type: the address as the profile holds it
    readonly address: string;
    /** The market pack's name for its registration. */
    // biome-ignore lint/plugin/copy-prop-type: the market pack's name for the tax id
    readonly taxLabel: string;
    /** The registration as typed; `owed` while it does not read as the market's format. */
    // biome-ignore lint/plugin/copy-prop-type: the registration as typed
    readonly tax: { readonly value: string; readonly owed: boolean } | null;
    readonly bank: TranslatedText;
    readonly bankLine: TranslatedText | null;
  };
  /**
   * The logo's capture area, above the company name; `null` draws none. `name` is the act, or the
   * held logo once `held`. `hint` stands under it where a finger chooses and `hintPointer` where a
   * pointer can also drop a file; `refusal` is what the image last chosen missed.
   */
  readonly logo: {
    // biome-ignore lint/plugin/copy-prop-type: the act's word, or the held logo's file name
    readonly name: string;
    readonly hint: TranslatedText;
    readonly hintPointer: TranslatedText;
    readonly refusal: TranslatedText | null;
    readonly held: boolean;
  } | null;
  readonly loading: TranslatedText | null;
  readonly unread: {
    readonly title: TranslatedText;
    readonly line: TranslatedText;
    readonly retry: TranslatedText;
    /** The way on without the profile — the setup life's alone: settings has nowhere onward. */
    readonly onward: TranslatedText | null;
    readonly onwardSpoken: TranslatedText | null;
  } | null;
  /** None when the profile could not be read: `unread` holds both ways. */
  readonly act: {
    readonly primary: TranslatedText;
    readonly primarySpoken: TranslatedText;
    /** Why the primary cannot be pressed yet. */
    readonly waiting: TranslatedText | null;
    /** The way on without saving, after a failed save alone. */
    readonly secondary: TranslatedText | null;
    readonly secondarySpoken: TranslatedText | null;
    /** The failed save, said once, above the acts. */
    readonly alert: TranslatedText | null;
    /** The one line under the act. */
    readonly line: TranslatedText | null;
  } | null;
}

/** The screen's fields and what they hold are domain's, where the save's rule reads them. */
export type { CompanyProfileField, CompanyProfileValues };

/**
 * The company profile (`SCR-M01-05`; `M01-24`, `M01-31`): five flat parts with where each stands,
 * one open at a time, and one act that is live with nothing filled in. In setup it fills the door's
 * frame; in settings it sits inside the app's shell, its parts drawn at the functional density
 * (`F7-17`) and its act after the list. From the door's breakpoint the web half sets a decorative
 * letterhead beside the list. The component holds no draft and saves nothing: every keystroke is
 * reported by its field, so a field can also be emptied, and the screen that holds the values
 * decides what a save writes.
 */
export interface CompanyProfileProps {
  /** Where the profile is met: the setup corridor, or the settings page inside the shell. */
  life: CompanyProfileLife;
  /** The app's bar holds the title (the phone's settings bar, `m-settings`): the page draws none. */
  titleInBar?: boolean;
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
  /** The profile's read; failed, its retry is the unread message's. The words say each state. */
  read: Read<unknown>;
  /** Leaves the step with nothing saved: after a failed read, or a failed save. */
  onContinueWithout: () => void;
  /** The held logo's picture, where the screen has one to show. */
  logoPicture?: string | null;
  /** A file chosen or dropped on the web. The screen checks it; the component takes any file. */
  onChooseLogo?: (file: PickedFile) => void;
  /** The capture area pressed on the phone, which has no file input: the app opens its picker. */
  onRequestLogo?: () => void;
}
