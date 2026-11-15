import { type ComponentCategory, PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { numberFieldWords } from './number-field';

/**
 * The words of step 8's sheets and step 6's one sheet (`packages/ui`'s `ProposalPartSheets`): pick
 * a part, edit what prints for a brand, add a new part, and edit a timeline step. A brand and a
 * scheme are named as written; units are never translated.
 */

type T = Translator['t'];

const KIND: Record<ComponentCategory, { id: string }> = {
  panel: /*i18n*/ { id: 'Solar panels' },
  inverter: /*i18n*/ { id: 'Inverter' },
  cable: /*i18n*/ { id: 'Cables' },
  electrical: /*i18n*/ { id: 'Electrical' },
  structure: /*i18n*/ { id: 'Structure' },
  battery: /*i18n*/ { id: 'Battery' },
};

const ONE: Record<ComponentCategory, { add: { id: string }; fresh: { id: string } }> = {
  panel: { add: /*i18n*/ { id: 'Add a new panel' }, fresh: /*i18n*/ { id: 'New panel' } },
  inverter: { add: /*i18n*/ { id: 'Add a new inverter' }, fresh: /*i18n*/ { id: 'New inverter' } },
  cable: { add: /*i18n*/ { id: 'Add a new cable' }, fresh: /*i18n*/ { id: 'New cable' } },
  electrical: {
    add: /*i18n*/ { id: 'Add a new electrical part' },
    fresh: /*i18n*/ { id: 'New electrical part' },
  },
  structure: {
    add: /*i18n*/ { id: 'Add a new structure' },
    fresh: /*i18n*/ { id: 'New structure' },
  },
  battery: { add: /*i18n*/ { id: 'Add a new battery' }, fresh: /*i18n*/ { id: 'New battery' } },
};

const PICKER = {
  search: /*i18n*/ { id: 'Search by brand or model' },
  clearSearch: /*i18n*/ { id: 'Clear the search' },
  full: /*i18n*/ { id: 'Up to {max} brands. Remove one to add another.' },
  none: /*i18n*/ { id: 'No brand matches. Add it below.' },
  noneNoAdd: /*i18n*/ { id: 'No brand matches.' },
  empty: /*i18n*/ { id: 'None saved yet. Add the one you use below.' },
  emptyNoAdd: /*i18n*/ { id: 'None saved yet. Someone who adds parts can save one.' },
  edit: /*i18n*/ { id: 'Edit what prints for {brand}' },
  scheme: /*i18n*/ {
    id: 'The subsidy needs {scheme} panels. A panel without the mark stops Generate.',
  },
  toCatalog: /*i18n*/ { id: 'Saved to your catalog for next time' },
  toParts: /*i18n*/ { id: 'Saved to your parts for next time' },
  done: /*i18n*/ { id: 'Done' },
  donePicked: /*i18n*/ { id: 'Done · {count} picked' },
  loading: /*i18n*/ { id: 'Loading the brands' },
  close: /*i18n*/ { id: 'Close' },
  /* The shipped paged lists' own words: one message, translated once. */
  showMore: /*i18n*/ { id: 'Show more' },
} as const;

/** Whether a kind's parts live in the catalog (panels, inverters, batteries) or the saved parts list. */
const inCatalog = (category: ComponentCategory) =>
  category === 'panel' || category === 'inverter' || category === 'battery';

/** The picker's words for one kind. `scheme` is set where the incentive path binds this kind. */
export function proposalPartPickerWords(
  t: T,
  facts: {
    category: ComponentCategory;
    picked: number;
    max: number;
    scheme?: string;
    canAdd: boolean;
  },
) {
  return {
    closeLabel: t(PICKER.close),
    title: t(KIND[facts.category]),
    search: t(PICKER.search),
    clearSearch: t(PICKER.clearSearch),
    full: t(PICKER.full, { max: facts.max }),
    none: t(facts.canAdd ? PICKER.none : PICKER.noneNoAdd),
    empty: t(facts.canAdd ? PICKER.empty : PICKER.emptyNoAdd),
    edit: (brand: string) => t(PICKER.edit, { brand }),
    ...(facts.scheme === undefined ? {} : { scheme: t(PICKER.scheme, { scheme: facts.scheme }) }),
    add: t(ONE[facts.category].add),
    addLine: t(inCatalog(facts.category) ? PICKER.toCatalog : PICKER.toParts),
    done: facts.picked > 0 ? t(PICKER.donePicked, { count: facts.picked }) : t(PICKER.done),
    loading: t(PICKER.loading),
    showMore: t(PICKER.showMore),
  };
}

const EDIT = {
  title: /*i18n*/ { id: '{brand} on this proposal' },
  brandFixed: /*i18n*/ { id: 'Brand is fixed' },
  choose: /*i18n*/ { id: 'Choose' },
  description: /*i18n*/ { id: 'One line for the customer' },
  count: /*i18n*/ { id: '{count} / {max}' },
  staysHere: /*i18n*/ {
    id: 'A change here stays on this proposal. Your catalog does not change.',
  },
  done: /*i18n*/ { id: 'Done' },
} as const;

const FIELD = {
  panels: /*i18n*/ { id: 'Panels' },
  units: /*i18n*/ { id: 'Units' },
  wattPeak: /*i18n*/ { id: 'Watt peak' },
  technology: /*i18n*/ { id: 'Panel type' },
  panelWarranty: /*i18n*/ { id: 'Product and performance warranty' },
  warranty: /*i18n*/ { id: 'Warranty' },
  capacityKw: /*i18n*/ { id: 'Capacity' },
  inverterType: /*i18n*/ { id: 'Inverter type' },
  phases: /*i18n*/ { id: 'Phases' },
  cableType: /*i18n*/ { id: 'Cable type' },
  specification: /*i18n*/ { id: 'Specification' },
  includes: /*i18n*/ { id: 'Includes' },
  standard: /*i18n*/ { id: 'Standard' },
  weightPerKw: /*i18n*/ { id: 'Weight per kW' },
  capacityKwh: /*i18n*/ { id: 'Capacity' },
  chemistry: /*i18n*/ { id: 'Chemistry' },
  chemistryCustom: /*i18n*/ { id: 'Which chemistry' },
} as const;

const OPTION = {
  technology: {
    mono_perc: /*i18n*/ { id: 'Mono PERC' },
    topcon: /*i18n*/ { id: 'TOPCon' },
    bifacial: /*i18n*/ { id: 'Bifacial' },
    mono: /*i18n*/ { id: 'Mono' },
    poly: /*i18n*/ { id: 'Poly' },
    hjt: /*i18n*/ { id: 'HJT' },
    thin_film: /*i18n*/ { id: 'Thin-film' },
  },
  inverterType: {
    on_grid: /*i18n*/ { id: 'On-grid' },
    off_grid: /*i18n*/ { id: 'Off-grid' },
    hybrid: /*i18n*/ { id: 'Hybrid' },
  },
  phases: { 1: /*i18n*/ { id: '1-phase' }, 3: /*i18n*/ { id: '3-phase' } },
  chemistry: {
    lfp: /*i18n*/ { id: 'Lithium LFP' },
    nmc: /*i18n*/ { id: 'Lithium NMC' },
    lead_acid: /*i18n*/ { id: 'Lead-acid' },
    custom: /*i18n*/ { id: 'Custom' },
  },
} as const;

/** The edit sheet's words for one brand of one kind (`M06-29`). */
export function proposalPartEditWords(t: T, facts: { brand: string; category: ComponentCategory }) {
  const worded = (set: Readonly<Record<string, { id: string }>>) =>
    Object.fromEntries(Object.entries(set).map(([value, word]) => [value, t(word)]));
  return {
    closeLabel: t(PICKER.close),
    title: t(EDIT.title, { brand: facts.brand }),
    brandFixed: t(EDIT.brandFixed),
    number: numberFieldWords(t),
    fields: {
      count: t(facts.category === 'panel' ? FIELD.panels : FIELD.units),
      wattPeak: t(FIELD.wattPeak),
      technology: t(FIELD.technology),
      warranty: t(facts.category === 'panel' ? FIELD.panelWarranty : FIELD.warranty),
      capacityKw: t(FIELD.capacityKw),
      inverterType: t(FIELD.inverterType),
      phases: t(FIELD.phases),
      cableType: t(FIELD.cableType),
      specification: t(FIELD.specification),
      includes: t(FIELD.includes),
      standard: t(FIELD.standard),
      weightPerKw: t(FIELD.weightPerKw),
      capacityKwh: t(FIELD.capacityKwh),
      chemistry: t(FIELD.chemistry),
      chemistryCustom: t(FIELD.chemistryCustom),
    },
    options: {
      technology: worded(OPTION.technology),
      inverterType: worded(OPTION.inverterType),
      phases: worded(OPTION.phases),
      chemistry: worded(OPTION.chemistry),
    },
    choose: t(EDIT.choose),
    description: t(EDIT.description),
    descriptionCount: (count: number, max: number) => t(EDIT.count, { count, max }),
    staysHere: t(EDIT.staysHere),
    done: t(EDIT.done),
  };
}

const ADD = {
  brand: /*i18n*/ { id: 'Brand' },
  brandMissing: /*i18n*/ { id: 'Type the brand' },
  specification: /*i18n*/ { id: 'Specification' },
  specificationMissing: /*i18n*/ { id: 'Type the specification' },
  warranty: /*i18n*/ { id: 'Warranty' },
  certified: /*i18n*/ { id: '{scheme} panel' },
  certifiedLine: /*i18n*/ { id: 'Made in India cells. The subsidy needs this.' },
  yes: /*i18n*/ { id: 'Yes' },
  no: /*i18n*/ { id: 'No' },
  sheet: /*i18n*/ { id: 'Have many? Add them from a spreadsheet' },
  sheetLine: /*i18n*/ { id: 'Only people who manage the catalog see this' },
  save: /*i18n*/ { id: 'Save and pick it' },
  saveCatalog: /*i18n*/ { id: 'Saved to your catalog. The next proposal offers it.' },
  saveParts: /*i18n*/ { id: 'Saved to your parts. The next proposal offers it.' },
  duplicate: /*i18n*/ { id: 'A part with this brand and specification is already listed.' },
} as const;

/** The add sheet's words for one kind. `scheme` is set where the kind's scheme applies. */
export function proposalPartAddWords(
  t: T,
  facts: { category: ComponentCategory; scheme?: string },
) {
  return {
    closeLabel: t(PICKER.close),
    title: t(ONE[facts.category].fresh),
    brand: t(ADD.brand),
    brandMissing: t(ADD.brandMissing),
    specification: t(ADD.specification),
    specificationMissing: t(ADD.specificationMissing),
    warranty: t(ADD.warranty),
    ...(facts.scheme === undefined
      ? {}
      : {
          certified: {
            title: t(ADD.certified, { scheme: facts.scheme }),
            line: t(ADD.certifiedLine),
          },
        }),
    yes: t(ADD.yes),
    no: t(ADD.no),
    sheet: t(ADD.sheet),
    sheetLine: t(ADD.sheetLine),
    save: t(ADD.save),
    saveLine: t(inCatalog(facts.category) ? ADD.saveCatalog : ADD.saveParts),
    /** Why a save was refused: the part is already listed (`T-M06-034`). */
    duplicate: t(ADD.duplicate),
  };
}

const PHASE = {
  title: /*i18n*/ { id: 'Step {number}' },
  name: /*i18n*/ { id: 'Name' },
  description: /*i18n*/ { id: 'What happens' },
  duration: /*i18n*/ { id: 'How long' },
  days: /*i18n*/ { id: 'days' },
  count: /*i18n*/ { id: '{count} / {max}' },
  done: /*i18n*/ { id: 'Done' },
} as const;

/** The timeline step's sheet. */
export function proposalPhaseSheetWords(t: T, facts: { number: number }) {
  return {
    closeLabel: t(PICKER.close),
    title: t(PHASE.title, { number: facts.number }),
    name: t(PHASE.name),
    description: t(PHASE.description),
    duration: t(PHASE.duration),
    days: t(PHASE.days),
    count: (count: number, max: number) => t(PHASE.count, { count, max }),
    number: numberFieldWords(t),
    done: t(PHASE.done),
  };
}

const PART = {
  title: /*i18n*/ { id: 'Part {number}' },
  titleNew: /*i18n*/ { id: 'New part' },
  name: /*i18n*/ { id: 'Name' },
  due: /*i18n*/ { id: 'Falls due' },
  choose: /*i18n*/ { id: 'Choose when it falls due' },
  hint: /*i18n*/ {
    id: 'The customer pays this part when the project reaches that point. It is for this proposal only.',
  },
  done: /*i18n*/ { id: 'Done' },
} as const;

/** The payment part's sheet (`M06-13`, `T-M06-009`): its name, and the stage it falls due on. */
export function proposalPaymentPartWords(t: T, facts: { number: number; isNew: boolean }) {
  return {
    closeLabel: t(PICKER.close),
    title: facts.isNew ? t(PART.titleNew) : t(PART.title, { number: facts.number }),
    name: t(PART.name),
    due: t(PART.due),
    choose: t(PART.choose),
    hint: t(PART.hint),
    count: (count: number, max: number) => t(PHASE.count, { count, max }),
    done: t(PART.done),
  };
}

/** A section's limit of brands, in the picker's own words — also said when the server refuses one. */
export function partsLimitWords(t: T) {
  return t(PICKER.full, { max: PROPOSAL_LIMITS.brandsPerCategory });
}
