import type { CertificationScheme, ItemDraft, ItemDraftEvent } from '@heliogrid/domain';

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
  failures: Readonly<Record<string, string>>;
  /** Counts the refused sends: each new one lands focus on the first field `failures` names. */
  refusal: number;
  /** The person may write a price: the Price card shows. Without it the card is absent. */
  priced: boolean;
  /** *Add many at once from a spreadsheet*: `null` draws no tile (no outright manage grant). */
  onSpreadsheet: (() => void) | null;
  /** The pre-fill is being read: the spec block is its placeholder. */
  loading: boolean;
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
  readonly label: string;
}

/** A spec field's label and unit; the unit is a symbol as written or a counted word. */
export interface CatalogItemFormField {
  readonly label: string;
  readonly unit: string | null;
}

/** Every word the sheet shows: `@heliogrid/i18n`'s `catalogAddItemWords`. */
export interface CatalogItemFormWords {
  /** The caller's line over the title; a record id in it is the caller's to set in mono. */
  readonly overline: string;
  readonly title: string;
  readonly spreadsheet: string;
  readonly spreadsheetSub: string;
  readonly theItem: string;
  readonly specification: string;
  readonly certification: string;
  readonly price: string;
  readonly yourOwn: string;
  readonly whatItIs: string;
  readonly kindHelper: string;
  readonly kinds: readonly CatalogItemFormOption[];
  readonly brand: string;
  readonly brandPlaceholder: string;
  readonly model: string;
  readonly modelPlaceholder: string;
  /** A pre-filled form's helpers and banner; `null` on a fresh form. */
  readonly copied: string | null;
  readonly modelCopied: string | null;
  readonly banner: string | null;
  /** Each spec field of the draft's kind, by its dotted path. */
  readonly fields: Readonly<Record<string, CatalogItemFormField>>;
  readonly technologyPlaceholder: string;
  readonly technologies: readonly CatalogItemFormOption[];
  readonly chemistries: readonly CatalogItemFormOption[];
  /** `'1'` and `'3'`: the inverter's phase count as a choice. */
  readonly phases: readonly CatalogItemFormOption[];
  readonly mpptWindow: string;
  readonly low: string;
  readonly high: string;
  readonly addOptional: string;
  readonly optional: string;
  /** The panel kind's *About the optional values*; `null` draws no ask. */
  readonly optionalAsk: {
    readonly label: string;
    readonly title: string;
    readonly body: string;
  } | null;
  /** Each declared scheme's switch words, and its reference field's label on a list scheme. */
  readonly schemeRows: Readonly<
    Record<string, { readonly label: string; readonly reference: string | null }>
  >;
  readonly schemeNote: string;
  readonly yourPrice: string;
  readonly priceHint: string;
  readonly priceNote: string | null;
  readonly cancel: string;
  readonly close: string;
  readonly primary: string;
  /** The line over the acts at 1536, and at 375 (`consequenceNarrow`). */
  readonly consequence: string;
  readonly consequenceNarrow: string;
  readonly returned: string;
  readonly tryAgain: string;
  readonly dismiss: string;
  /** The Empty state's *What this form needs*. */
  readonly needs: {
    readonly label: string;
    readonly needed: string;
    readonly optional: string;
    readonly neededValues: readonly string[];
    readonly optionalValues: readonly string[];
  };
  readonly loading: string;
  readonly discard: {
    readonly title: string;
    /** Said first, in bold: what is true — nothing was created. */
    readonly lead: string;
    readonly body: string;
    readonly keep: string;
    readonly discard: string;
  };
}
