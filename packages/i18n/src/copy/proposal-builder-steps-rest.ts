import type { TranslatedText } from '@heliogrid/contracts';
import { PROPOSAL_LIMITS, type ProposalPhase } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { richTextWords } from './rich-text';

/**
 * The words of the builder's steps 5 to 9 (`packages/ui`'s `ProposalSteps`). The energy source's
 * own label is `energySourceLabel`'s; a place and a person are named as written; every figure is
 * the text the server sent.
 */

type T = Translator['t'];

const FINANCIALS = {
  monthlyBill: /*i18n*/ { id: 'Monthly bill' },
  fromLead: /*i18n*/ { id: 'From the lead' },
  tariff: /*i18n*/ { id: 'Tariff' },
  perUnit: /*i18n*/ { id: 'for one unit' },
  assumptions: /*i18n*/ { id: 'Assumptions' },
  assumptionsValue: /*i18n*/ {
    id: 'Tariff rises {rise} a year · {years, plural, one {# year} other {# years}}',
  },
  tariffRise: /*i18n*/ { id: 'Tariff rise' },
  percentPerYear: /*i18n*/ { id: '% a year' },
  horizon: /*i18n*/ { id: 'Years' },
} as const;

/** Step 5's words. */
export function proposalFinancialsStepWords(t: T, facts: { riseText: string; years: number }) {
  return {
    monthlyBill: t(FINANCIALS.monthlyBill),
    monthlyBillHelper: t(FINANCIALS.fromLead),
    tariff: t(FINANCIALS.tariff),
    tariffUnit: t(FINANCIALS.perUnit),
    assumptions: t(FINANCIALS.assumptions),
    assumptionsValue: t(FINANCIALS.assumptionsValue, { rise: facts.riseText, years: facts.years }),
    tariffRise: t(FINANCIALS.tariffRise),
    tariffRiseUnit: t(FINANCIALS.percentPerYear),
    horizon: t(FINANCIALS.horizon),
  };
}

const TIMELINE = {
  rowDays: /*i18n*/ { id: '{days, plural, one {# day} other {# days}} · tap to edit' },
  rowNoDays: /*i18n*/ { id: 'Tap to edit' },
  edit: /*i18n*/ { id: 'Edit {name}' },
  moveUp: /*i18n*/ { id: 'Move {name} up' },
  moveDown: /*i18n*/ { id: 'Move {name} down' },
  remove: /*i18n*/ { id: 'Remove {name}' },
  add: /*i18n*/ { id: 'Add a step' },
  reset: /*i18n*/ { id: 'Reset to company timeline' },
} as const;

/** Step 6's words. */
export function proposalTimelineStepWords(t: T) {
  return {
    rowLine: (phase: ProposalPhase) =>
      phase.durationDays === null
        ? t(TIMELINE.rowNoDays)
        : t(TIMELINE.rowDays, { days: phase.durationDays }),
    edit: (name: string) => t(TIMELINE.edit, { name }),
    moveUp: (name: string) => t(TIMELINE.moveUp, { name }),
    moveDown: (name: string) => t(TIMELINE.moveDown, { name }),
    remove: (name: string) => t(TIMELINE.remove, { name }),
    add: t(TIMELINE.add),
    reset: t(TIMELINE.reset),
  };
}

const PAYMENT = {
  plans: /*i18n*/ { id: 'Payment terms' },
  newPlan: /*i18n*/ { id: 'New plan' },
  noteCompany: /*i18n*/ { id: 'Your company’s terms' },
  noteChanged: /*i18n*/ { id: 'Changed for this proposal only' },
  noteDefaults: /*i18n*/ { id: 'New proposals start with this' },
  less: /*i18n*/ { id: 'Less for {label}' },
  more: /*i18n*/ { id: 'More for {label}' },
  share: /*i18n*/ { id: '{label}, percent' },
  remove: /*i18n*/ { id: 'Remove {label}' },
  edit: /*i18n*/ { id: 'Edit {label}' },
  add: /*i18n*/ { id: 'Add a part' },
  reset: /*i18n*/ { id: 'Reset' },
  hint: /*i18n*/ {
    id: 'At Won, this becomes the project’s payment plan. Nobody types it again.',
  },
  hintDefaults: /*i18n*/ {
    id: 'A rep can still change the split on one proposal when a customer asks.',
  },
} as const;

/** Step 7's words: on a proposal whose rows match a plan, one changed, or in Proposal defaults. */
export function proposalPaymentStepWords(
  t: T,
  facts: { where: 'company' | 'changed' | 'defaults' },
) {
  const note = {
    company: PAYMENT.noteCompany,
    changed: PAYMENT.noteChanged,
    defaults: PAYMENT.noteDefaults,
  };
  return {
    plans: t(PAYMENT.plans),
    newPlan: t(PAYMENT.newPlan),
    note: t(note[facts.where]),
    less: (label: string) => t(PAYMENT.less, { label }),
    more: (label: string) => t(PAYMENT.more, { label }),
    share: (label: string) => t(PAYMENT.share, { label }),
    remove: (label: string) => t(PAYMENT.remove, { label }),
    edit: (label: string) => t(PAYMENT.edit, { label }),
    add: t(PAYMENT.add),
    reset: t(PAYMENT.reset),
    hint: t(facts.where === 'defaults' ? PAYMENT.hintDefaults : PAYMENT.hint),
  };
}

const COMPONENTS = {
  all: /*i18n*/ { id: 'Every part is picked' },
  left: /*i18n*/ { id: '{count, plural, one {# part left to pick} other {# parts left to pick}}' },
  line: /*i18n*/ {
    id: 'Tap a part to pick or change it. Up to {max} brands each — {name} reads them as choices.',
  },
  ring: /*i18n*/ { id: '{picked} of {required} parts picked' },
} as const;

/** Step 8's words. */
export function proposalComponentsStepWords(
  t: T,
  facts: { name: string; picked: number; required: number; maxBrands: number },
) {
  const left = facts.required - facts.picked;
  return {
    title: left <= 0 ? t(COMPONENTS.all) : t(COMPONENTS.left, { count: left }),
    line: t(COMPONENTS.line, { max: facts.maxBrands, name: facts.name }),
    ring: t(COMPONENTS.ring, { picked: facts.picked, required: facts.required }),
  };
}

const TERMS = {
  label: /*i18n*/ { id: 'Terms' },
  /* The editor's own count follows it (`RichText`), so the estimate names the pages alone. */
  estimate: /*i18n*/ { id: 'About {pages, plural, one {# page} other {# pages}} ·' },
  saveAsDefault: /*i18n*/ { id: 'Save as company default' },
  staysHere: /*i18n*/ { id: 'A change here stays on this proposal only.' },
  printsIn: /*i18n*/ { id: 'These terms will print in {language}.' },
  defaultSaved: /*i18n*/ { id: 'Saved as the company default.' },
  defaultFailed: /*i18n*/ { id: 'Could not save these as the company default. Try again.' },
  overPages: /*i18n*/ {
    id: 'These terms run past {max} pages. Shorten them so they can be saved.',
  },
} as const;

/** Terms that would print past their pages (`M06-15`): the builder's step and Proposal defaults alike. */
export function proposalTermsOverPages(t: T): TranslatedText {
  return t(TERMS.overPages, { max: PROPOSAL_LIMITS.termsPages });
}

/** Step 9's words; `estimate` is what the editor last measured. */
export function proposalTermsStepWords(
  t: T,
  facts: { estimate?: { pages: number; chars: number }; printsIn?: string },
) {
  return {
    label: t(TERMS.label),
    richText: richTextWords(t),
    ...(facts.estimate === undefined
      ? {}
      : {
          estimate: t(TERMS.estimate, { pages: facts.estimate.pages }),
        }),
    saveAsDefault: t(TERMS.saveAsDefault),
    overPages: proposalTermsOverPages(t),
    defaultSaved: t(TERMS.defaultSaved),
    defaultFailed: t(TERMS.defaultFailed),
    staysHere:
      facts.printsIn === undefined
        ? t(TERMS.staysHere)
        : t(TERMS.printsIn, { language: facts.printsIn }),
  };
}
