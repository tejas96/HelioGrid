import { ESTIMATE_TOLERANCE_PERCENT, LANGUAGES, PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import {
  type BuilderSaidFacts,
  type BuilderSaidStep,
  PERCENT,
  type SystemStep,
  systemFacts,
} from './proposal-builder-facts';
import { proposalBatteryNoticeWords, proposalNoTaxNoticeWords } from './proposal-builder-notices';
import { proposalPerformanceStepWords } from './proposal-builder-performance';
import {
  proposalBankStepWords,
  proposalClientStepWords,
  proposalCompanyStepWords,
  proposalTrackRecordStepWords,
} from './proposal-builder-steps';
import {
  proposalComponentsStepWords,
  proposalFinancialsStepWords,
  proposalPaymentStepWords,
  proposalTermsStepWords,
  proposalTimelineStepWords,
} from './proposal-builder-steps-rest';
import { proposalSystemStepWords } from './proposal-builder-system';

export type { BuilderSaidFacts, BuilderSaidStep } from './proposal-builder-facts';

/**
 * The step in view, in words (`T-M06-003`–`T-M06-013`): ONE function both screens call with the
 * step's model as `packages/data` assembled it and the document's value set, so the web and the
 * phone cannot word a step differently. Every amount is the server's figure, formatted by the caller.
 */
type T = Translator['t'];

/** A language's own name for itself; a tag this build does not know reads as sent (`F3-05`). */
function languageName(tag: string): string {
  return Object.hasOwn(LANGUAGES, tag) ? LANGUAGES[tag as keyof typeof LANGUAGES].endonym : tag;
}

const ownerOf = (owner: string | undefined) => (owner === undefined ? {} : { owner });

function companySaid(t: T, facts: BuilderSaidFacts) {
  const words = proposalCompanyStepWords(t, { name: facts.name, ...ownerOf(facts.owner) });
  return {
    step: 'company' as const,
    words,
    covers: words.covers,
    factLabels: words.factLabels,
    phoneText: facts.format.phone,
  };
}

function systemSaid(t: T, facts: BuilderSaidFacts, step: SystemStep) {
  const taxFacts = { taxName: facts.taxName, ...ownerOf(facts.owner) };
  return {
    step: 'system' as const,
    words: proposalSystemStepWords(t, systemFacts(t, facts, step)),
    ...(step.batteryNeeded === null
      ? {}
      : { battery: proposalBatteryNoticeWords(t, step.systemType) }),
    ...(step.noTax ? { noTax: proposalNoTaxNoticeWords(t, taxFacts) } : {}),
  };
}

function performanceSaid(
  t: T,
  facts: BuilderSaidFacts,
  step: Extract<BuilderSaidStep, { step: 'performance' }>,
) {
  const { place, capacityKw } = step.asked;
  const words = proposalPerformanceStepWords(t, {
    fill: step.fill,
    source: facts.energySource,
    place,
    sizeText: capacityKw === null ? null : facts.format.number(capacityKw),
    tolerance: ESTIMATE_TOLERANCE_PERCENT,
    monthNames: facts.monthNames,
    edited: step.edited,
    wants: step.fillWants,
  });
  return { step: 'performance' as const, words, capacityChanged: words.capacityChanged };
}

function clientSaid(
  t: T,
  facts: BuilderSaidFacts,
  step: Extract<BuilderSaidStep, { step: 'client' }>,
) {
  const words = proposalClientStepWords(t, {
    name: facts.name,
    ...(step.number === null ? {} : { number: step.number }),
    language: languageName(step.language),
    customersOwn: facts.snapshot?.language === step.language,
  });
  return {
    step: 'client' as const,
    words,
    number: { label: words.numberLabel, value: words.numberValue },
    language: { label: words.languageLabel, value: words.languageValue },
    phoneText: facts.format.phone,
  };
}

function termsSaid(
  t: T,
  facts: BuilderSaidFacts,
  step: Extract<BuilderSaidStep, { step: 'terms' }>,
) {
  return {
    step: 'terms' as const,
    words: proposalTermsStepWords(t, {
      ...(facts.termsEstimate === undefined ? {} : { estimate: facts.termsEstimate }),
      ...(step.printsIn === null ? {} : { printsIn: languageName(step.printsIn) }),
    }),
  };
}

/** The step's words, and the few lines its view builds from them, keyed by the step they are for. */
export function proposalBuilderStepSaid(t: T, facts: BuilderSaidFacts, step: BuilderSaidStep) {
  switch (step.step) {
    case 'company':
      return companySaid(t, facts);
    case 'achievements':
      return {
        step: step.step,
        words: proposalTrackRecordStepWords(t, {
          where: facts.owner === undefined ? 'owner' : 'other',
        }),
      };
    case 'system':
      return systemSaid(t, facts, step);
    case 'performance':
      return performanceSaid(t, facts, step);
    case 'financials':
      return {
        step: step.step,
        words: proposalFinancialsStepWords(t, {
          riseText: t(PERCENT, { value: facts.format.number(step.tariffRisePercent) }),
          years: step.horizonYears,
        }),
      };
    case 'timeline':
      return { step: step.step, words: proposalTimelineStepWords(t) };
    case 'payment':
      return {
        step: step.step,
        words: proposalPaymentStepWords(t, { where: step.planId === null ? 'changed' : 'company' }),
        due: facts.due,
      };
    case 'components':
      return {
        step: step.step,
        words: proposalComponentsStepWords(t, {
          name: facts.name,
          picked: step.picked,
          required: step.required,
          maxBrands: PROPOSAL_LIMITS.brandsPerCategory,
        }),
      };
    case 'terms':
      return termsSaid(t, facts, step);
    case 'client':
      return clientSaid(t, facts, step);
    case 'bank':
      return {
        step: step.step,
        words: proposalBankStepWords(t, {
          include: step.include,
          owner: facts.owner ?? '',
          routingLabel: facts.routingLabel,
        }),
      };
  }
}

const LABEL = {
  newPart: /*i18n*/ { id: 'Part {number}' },
  warrantyYears: /*i18n*/ { id: '{years, plural, one {#-year warranty} other {#-year warranty}}' },
} as const;

/**
 * Words the builder STORES on the proposal — a new payment part's name, a catalog item's warranty
 * line — written once in the reader's language when the person adds them; they are the proposal's
 * own text from then on, shown as written (`F3-10`).
 */
export function proposalBuilderLabels(t: T) {
  return {
    newPart: (number: number): string => t(LABEL.newPart, { number }),
    warrantyYears: (years: number): string => t(LABEL.warrantyYears, { years }),
  };
}

const EXTRA = {
  reload: /*i18n*/ { id: 'Reload' },
  customerLine: /*i18n*/ { id: '{name} · {city}' },
} as const;

/** The few words the builder's screen adds to its parts' own: the reload act, the line under the title, the document's language. */
export function proposalBuilderScreenWords(
  t: T,
  facts: { name: string; city: string | null; language: string },
) {
  return {
    reload: t(EXTRA.reload),
    customerLine:
      facts.city === null
        ? shownAsSent(facts.name)
        : t(EXTRA.customerLine, { name: facts.name, city: facts.city }),
    language: languageName(facts.language),
  };
}
