import {
  BATTERY_CHEMISTRIES,
  type CertificationScheme,
  COMPONENT_KINDS,
  type ComponentKind,
  optionalPathsOf,
  PANEL_TECHNOLOGIES,
  SPEC_FIELDS,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { NO_WORDS } from './assembled';
import {
  type AddItemFieldWords,
  addItemFieldWords,
  addItemPhaseWords,
} from './catalog-add-item-fields';
import { catalogChemistryOption, catalogKind, catalogTechnology } from './catalog-settings';

type T = Translator['t'];

/** Who opened the add sheet: Catalog settings, or a picker in the builder or the studio. */
export type AddItemCaller = 'settings' | 'picker';

/** The add sheet (`SCR-M01-16`), chosen once for both apps (Law 11). */
const WORDS = {
  overlineSettings: /*i18n*/ { id: 'Catalog settings · items' },
  spreadsheet: /*i18n*/ { id: 'Add many at once from a spreadsheet' },
  spreadsheetSub: /*i18n*/ { id: 'CSV or Excel file' },
  theItem: /*i18n*/ { id: 'The item' },
  specification: /*i18n*/ { id: 'Specification' },
  certification: /*i18n*/ { id: 'Certification' },
  price: /*i18n*/ { id: 'Price' },
  yourOwn: /*i18n*/ { id: 'Your own' },
  whatItIs: /*i18n*/ { id: 'What it is' },
  brand: /*i18n*/ { id: 'Brand' },
  brandPlaceholder: /*i18n*/ { id: 'Who makes it' },
  model: /*i18n*/ { id: 'Model' },
  modelPlaceholder: /*i18n*/ { id: 'As printed' },
  technologyPlaceholder: /*i18n*/ { id: 'As printed' },
  copied: /*i18n*/ { id: 'Copied from the selected item.' },
  modelCopied: /*i18n*/ { id: 'Copied — rename it if your variant differs.' },
  filledFrom: /*i18n*/ { id: 'Filled in from {name}' },
  addOptional: /*i18n*/ { id: 'Add optional values' },
  optional: /*i18n*/ { id: 'Optional' },
  optionalAbout: /*i18n*/ { id: 'About the optional values' },
  optionalTitle: /*i18n*/ { id: 'Optional values' },
  optionalPanel: /*i18n*/ {
    id: "The panel saves without them. Without the Pmax temp. coefficient, string sizing marks its window estimated. Without bifaciality, the panel's back counts as producing nothing.",
  },
  mpptWindow: /*i18n*/ { id: 'MPPT voltage window' },
  low: /*i18n*/ { id: 'Low' },
  high: /*i18n*/ { id: 'High' },
  schemeNote: /*i18n*/ { id: 'Leave {schemes} off and the item shows no badges.' },
  schemeNoteCopied: /*i18n*/ {
    id: "{schemes} are not copied: your variant isn't the listed model.",
  },
  schemesJoin: /*i18n*/ { id: '{first} and {second}' },
  listed: /*i18n*/ { id: '{scheme} listed' },
  compliant: /*i18n*/ { id: '{scheme} compliant' },
  listReference: /*i18n*/ { id: '{scheme} list reference' },
  yourPrice: /*i18n*/ { id: 'Your price (optional)' },
  priceNoteCopied: /*i18n*/ { id: 'A platform item carries no price to copy.' },
  cancel: /*i18n*/ { id: 'Cancel' },
  addToCatalog: /*i18n*/ { id: 'Add to catalog' },
  addAndSelect: /*i18n*/ { id: 'Add and select' },
  settingsWide: /*i18n*/ { id: 'Adds it to your catalog, then shows its row in this list.' },
  settingsNarrow: /*i18n*/ { id: 'Adds it to your catalog, then shows its row in Items.' },
  picker: /*i18n*/ { id: 'Adds it to your catalog and selects it in the picker.' },
  prefilled: /*i18n*/ { id: 'Creates your own SKU; the platform item stays unchanged.' },
  unpriced: /*i18n*/ { id: 'No price yet; a catalog manager adds it later.' },
  setBySettings: /*i18n*/ { id: 'Set by Catalog settings.' },
  setByPicker: /*i18n*/ { id: 'Set by the component picker.' },
  returnedSettings: /*i18n*/ { id: 'Not added — everything you typed is still here.' },
  returnedPicker: /*i18n*/ { id: 'Not added or selected — everything you typed is still here.' },
  tryAgain: /*i18n*/ { id: 'Try again' },
  dismiss: /*i18n*/ { id: 'Dismiss' },
  needs: /*i18n*/ { id: 'What this form needs' },
  needed: /*i18n*/ { id: 'Needed' },
  loading: /*i18n*/ { id: 'Loading the {kind} specification' },
  discardLead: /*i18n*/ { id: 'Nothing has been created.' },
  discardBody: /*i18n*/ { id: 'What you typed has no undo.' },
  keepFilling: /*i18n*/ { id: 'Keep filling it in' },
  discard: /*i18n*/ { id: 'Discard' },
  added: /*i18n*/ { id: 'Added to your catalog' },
  close: /*i18n*/ { id: 'Close' },
} as const;

const TITLE: Record<ComponentKind, { id: string }> = {
  panel: /*i18n*/ { id: 'Add a panel' },
  inverter: /*i18n*/ { id: 'Add an inverter' },
  battery: /*i18n*/ { id: 'Add a battery' },
  micro_inverter: /*i18n*/ { id: 'Add a micro-inverter' },
  optimiser: /*i18n*/ { id: 'Add an optimiser' },
};

const DISCARD: Record<ComponentKind, { id: string }> = {
  panel: /*i18n*/ { id: 'Discard this panel?' },
  inverter: /*i18n*/ { id: 'Discard this inverter?' },
  battery: /*i18n*/ { id: 'Discard this battery?' },
  micro_inverter: /*i18n*/ { id: 'Discard this micro-inverter?' },
  optimiser: /*i18n*/ { id: 'Discard this optimiser?' },
};

const PRICE_HINT: Record<ComponentKind, { id: string }> = {
  panel: /*i18n*/ { id: 'What one panel costs you, before tax.' },
  inverter: /*i18n*/ { id: 'What one inverter costs you, before tax.' },
  battery: /*i18n*/ { id: 'What one battery costs you, before tax.' },
  micro_inverter: /*i18n*/ { id: 'What one micro-inverter costs you, before tax.' },
  optimiser: /*i18n*/ { id: 'What one optimiser costs you, before tax.' },
};

/** Every declared scheme, joined as the language joins a list: *ALMM*, *ALMM and DCR*, *A, B and C*. */
function joinSchemes(t: T, schemes: readonly CertificationScheme[]): string {
  const names = schemes.map((scheme) => scheme.scheme);
  const last = names.pop();
  if (last === undefined) return '';
  return names.length === 0
    ? last
    : t(WORDS.schemesJoin, { first: names.join(', '), second: last });
}

/** What opened the sheet decides its verb, its consequence line and the kind's helper. */
export interface AddItemFacts {
  readonly kind: ComponentKind;
  readonly caller: AddItemCaller;
  readonly schemes: readonly CertificationScheme[];
  readonly priced: boolean;
  /** The selected item it was filled in from (`M01-39`), or `null` for a fresh form. */
  readonly copiedFrom: string | null;
}

const unique = <Label extends string>(labels: readonly Label[]) =>
  labels.filter((label, at) => labels.indexOf(label) === at);

/** The spec block's words: each field's label and unit, and the choices its lists offer. */
function specWords(t: T, kind: ComponentKind) {
  const fields: Readonly<Record<string, AddItemFieldWords>> = Object.fromEntries(
    SPEC_FIELDS[kind].map((field) => [field.path, addItemFieldWords(t, field.path)]),
  );
  const labelOf = (path: string) => fields[path]?.label ?? addItemFieldWords(t, path).label;
  return {
    fields,
    technologyPlaceholder: t(WORDS.technologyPlaceholder),
    technologies: PANEL_TECHNOLOGIES.map((value) => ({
      value,
      label: catalogTechnology(t, value),
    })),
    chemistries: BATTERY_CHEMISTRIES.map((value) => ({
      value,
      label: catalogChemistryOption(t, value),
    })),
    phases: addItemPhaseWords(t),
    mpptWindow: t(WORDS.mpptWindow),
    low: t(WORDS.low),
    high: t(WORDS.high),
    addOptional: t(WORDS.addOptional),
    optional: t(WORDS.optional),
    optionalAsk:
      kind === 'panel'
        ? {
            label: t(WORDS.optionalAbout),
            title: t(WORDS.optionalTitle),
            body: t(WORDS.optionalPanel),
          }
        : null,
    requiredLabels: unique(
      SPEC_FIELDS[kind].filter((field) => field.required).map((field) => labelOf(field.path)),
    ),
    optionalLabels: unique(optionalPathsOf(kind).map(labelOf)),
  };
}

/** The certification card's words: one row per declared scheme, worded by its evidence. */
function schemeWords(t: T, schemes: readonly CertificationScheme[], copied: boolean) {
  const named = joinSchemes(t, schemes);
  return {
    schemeRows: Object.fromEntries(
      schemes.map(({ scheme, evidence }) => [
        scheme,
        {
          label: evidence === 'flag' ? t(WORDS.compliant, { scheme }) : t(WORDS.listed, { scheme }),
          reference: evidence === 'flag' ? null : t(WORDS.listReference, { scheme }),
        },
      ]),
    ),
    schemeNote: copied
      ? t(WORDS.schemeNoteCopied, { schemes: named })
      : t(WORDS.schemeNote, { schemes: named }),
  };
}

/** The foot's words: the verb names what it returns to, the line says what the act does. */
function footWords(t: T, { caller, priced, copiedFrom }: AddItemFacts) {
  const settings = caller === 'settings';
  const plain = settings ? t(WORDS.settingsWide) : t(WORDS.picker);
  const consequence = !priced
    ? t(WORDS.unpriced)
    : copiedFrom !== null
      ? t(WORDS.prefilled)
      : plain;
  const narrowSettings = settings && priced && copiedFrom === null;
  return {
    cancel: t(WORDS.cancel),
    close: t(WORDS.close),
    primary: settings ? t(WORDS.addToCatalog) : t(WORDS.addAndSelect),
    consequence,
    consequenceNarrow: narrowSettings ? t(WORDS.settingsNarrow) : consequence,
    returned: settings ? t(WORDS.returnedSettings) : t(WORDS.returnedPicker),
    tryAgain: t(WORDS.tryAgain),
    dismiss: t(WORDS.dismiss),
  };
}

/** The item card's words, with the copied helpers of a pre-filled form. */
function itemWords(t: T, { caller, copiedFrom }: AddItemFacts) {
  const copied = copiedFrom !== null;
  return {
    whatItIs: t(WORDS.whatItIs),
    kindHelper: caller === 'settings' ? t(WORDS.setBySettings) : t(WORDS.setByPicker),
    kinds: COMPONENT_KINDS.map((value) => ({ value, label: catalogKind(t, value) })),
    brand: t(WORDS.brand),
    brandPlaceholder: t(WORDS.brandPlaceholder),
    model: t(WORDS.model),
    modelPlaceholder: t(WORDS.modelPlaceholder),
    copied: copied ? t(WORDS.copied) : null,
    modelCopied: copied ? t(WORDS.modelCopied) : null,
    banner: copied ? t(WORDS.filledFrom, { name: copiedFrom }) : null,
  };
}

/** Every word the sheet shows for one caller and one kind. */
export function catalogAddItemWords(t: T, facts: AddItemFacts) {
  const { kind, schemes, priced, copiedFrom } = facts;
  const spec = specWords(t, kind);
  return {
    overline: facts.caller === 'settings' ? t(WORDS.overlineSettings) : NO_WORDS,
    title: t(TITLE[kind]),
    spreadsheet: t(WORDS.spreadsheet),
    spreadsheetSub: t(WORDS.spreadsheetSub),
    theItem: t(WORDS.theItem),
    specification: t(WORDS.specification),
    certification: t(WORDS.certification),
    price: t(WORDS.price),
    yourOwn: t(WORDS.yourOwn),
    ...itemWords(t, facts),
    ...spec,
    ...schemeWords(t, schemes, copiedFrom !== null),
    yourPrice: t(WORDS.yourPrice),
    priceHint: t(PRICE_HINT[kind]),
    priceNote: copiedFrom === null ? null : t(WORDS.priceNoteCopied),
    ...footWords(t, facts),
    needs: {
      label: t(WORDS.needs),
      needed: t(WORDS.needed),
      optional: t(WORDS.optional),
      neededValues: [t(WORDS.brand), t(WORDS.model), ...spec.requiredLabels],
      optionalValues: [...(priced ? [t(WORDS.price)] : []), ...spec.optionalLabels],
    },
    loading: t(WORDS.loading, { kind: catalogKind(t, kind).toLocaleLowerCase() }),
    discard: {
      title: t(DISCARD[kind]),
      lead: t(WORDS.discardLead),
      body: t(WORDS.discardBody),
      keep: t(WORDS.keepFilling),
      discard: t(WORDS.discard),
    },
  };
}

export type CatalogAddItemWords = ReturnType<typeof catalogAddItemWords>;

/** The toast a saved item raises: the item by its brand and model. */
export function catalogItemAddedToast(t: T, name: string) {
  return { tone: 'success' as const, title: t(WORDS.added), description: name };
}
