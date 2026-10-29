import type { TranslatedText } from '@heliogrid/contracts';
import type { CertificationScheme, ItemDraft, ItemDraftEvent, Read } from '@heliogrid/domain';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/**
 * **The add sheet** (`SCR-M01-16`, `M01-36`, `M01-39`): one own item typed into the catalog — what
 * it is, its brand and model, its typed specification, the market's certification schemes and,
 * for a person who may write one, its price. A sheet at 375 and a 900px non-modal side panel at
 * 1536, as `EditorSurface` lays it out. The draft and its judge are domain's, the write is
 * `packages/data`'s `useAddCatalogItem`, every word is `@heliogrid/i18n`'s `catalogAddItemWords`;
 * this draws them and hands each change back as a draft event.
 */
export interface CatalogItemFormProps {
  open: boolean;
  words: CatalogItemFormWords;
  draft: ItemDraft;
  /** The market's declared schemes, each with the evidence it collects; empty draws none. */
  schemes: readonly CertificationScheme[];
  /** Each failed field's words, by its body path (`brand`, `spec.vocV`, `certifications.ALMM`). */
  failures: Readonly<Record<string, TranslatedText>>;
  /** Counts the refused sends: each new one lands focus on the first field `failures` names. */
  refusal: number;
  /** The person may write a price: the Price card shows. Without it the card is absent. */
  priced: boolean;
  /** *Add many at once from a spreadsheet*: `null` draws no tile (no outright manage grant). */
  onSpreadsheet: (() => void) | null;
  /** The pre-fill's read: while it is out, the spec block is its placeholder. */
  read: Read<unknown>;
  /** The create is out: the primary is busy and a press does nothing. */
  saving: boolean;
  /** The create came back unsent: the foot's returned line with *Try again* and *Dismiss*. */
  returned: boolean;
  /** The discard confirm is open over the sheet. */
  confirmingDiscard: boolean;
  onChange: (event: ItemDraftEvent) => void;
  onSubmit: () => void;
  /** Cancel, close, Esc or the backdrop: the app asks first when the draft is dirty. */
  onCancel: () => void;
  onRetry: () => void;
  onDismissReturned: () => void;
  /** The confirm's *Keep filling it in*. */
  onKeep: () => void;
  /** The confirm's *Discard*: nothing was created, so the sheet closes. */
  onDiscard: () => void;
}

/** A choice in a list: its value and its words. */
export interface CatalogItemFormOption<Value extends string = string> {
  readonly value: Value;
  readonly label: TranslatedText;
}

/** A spec field's label and unit; the unit is a symbol as written or a counted word. */
export interface CatalogItemFormField {
  readonly label: TranslatedText;
  readonly unit: string | null;
}

/** Every word the sheet shows: `@heliogrid/i18n`'s `catalogAddItemWords`. */
export interface CatalogItemFormWords {
  /** The caller's line over the title; a record id in it is the caller's to set in mono. */
  readonly overline: TranslatedText;
  readonly title: TranslatedText;
  readonly spreadsheet: TranslatedText;
  readonly spreadsheetSub: TranslatedText;
  readonly theItem: TranslatedText;
  readonly specification: TranslatedText;
  readonly certification: TranslatedText;
  readonly price: TranslatedText;
  readonly yourOwn: TranslatedText;
  readonly whatItIs: TranslatedText;
  readonly kindHelper: TranslatedText;
  readonly kinds: readonly CatalogItemFormOption[];
  readonly brand: TranslatedText;
  readonly brandPlaceholder: TranslatedText;
  readonly model: TranslatedText;
  readonly modelPlaceholder: TranslatedText;
  /** A pre-filled form's helpers and banner; `null` on a fresh form. */
  readonly copied: TranslatedText | null;
  readonly modelCopied: TranslatedText | null;
  readonly banner: TranslatedText | null;
  /** Each spec field of the draft's kind, by its dotted path. */
  readonly fields: Readonly<Record<string, CatalogItemFormField>>;
  readonly technologyPlaceholder: TranslatedText;
  readonly technologies: readonly CatalogItemFormOption[];
  readonly chemistries: readonly CatalogItemFormOption[];
  /** `'1'` and `'3'`: the inverter's phase count as a choice. */
  readonly phases: readonly CatalogItemFormOption[];
  readonly mpptWindow: TranslatedText;
  readonly low: TranslatedText;
  readonly high: TranslatedText;
  readonly addOptional: TranslatedText;
  readonly optional: TranslatedText;
  /** The panel kind's *About the optional values*; `null` draws no ask. */
  readonly optionalAsk: {
    readonly label: TranslatedText;
    readonly title: TranslatedText;
    readonly body: TranslatedText;
  } | null;
  /** Each declared scheme's switch words, and its reference field's label on a list scheme. */
  readonly schemeRows: Readonly<
    Record<string, { readonly label: TranslatedText; readonly reference: TranslatedText | null }>
  >;
  readonly schemeNote: TranslatedText;
  readonly yourPrice: TranslatedText;
  readonly priceHint: TranslatedText;
  readonly priceNote: TranslatedText | null;
  readonly cancel: TranslatedText;
  readonly close: TranslatedText;
  readonly primary: TranslatedText;
  /** The line over the acts at 1536, and at 375 (`consequenceNarrow`). */
  readonly consequence: TranslatedText;
  readonly consequenceNarrow: TranslatedText;
  readonly returned: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly dismiss: TranslatedText;
  /** The Empty state's *What this form needs*. */
  readonly needs: {
    readonly label: TranslatedText;
    readonly needed: TranslatedText;
    readonly optional: TranslatedText;
    readonly neededValues: readonly TranslatedText[];
    readonly optionalValues: readonly TranslatedText[];
  };
  readonly loading: TranslatedText;
  readonly discard: {
    readonly title: TranslatedText;
    /** Said first, in bold: what is true — nothing was created. */
    readonly lead: TranslatedText;
    readonly body: TranslatedText;
    readonly keep: TranslatedText;
    readonly discard: TranslatedText;
  };
  /** What a select and a figure's field say of their own: *Select an option*, the list's close. */
  readonly selectPlaceholder: TranslatedText;
  readonly closeList: TranslatedText;
  readonly numberField: NumberFieldWords;
}
