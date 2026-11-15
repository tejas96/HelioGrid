import type { TranslatedText } from '@heliogrid/contracts';
import {
  coverLineFacts,
  FIGURE_SLOT,
  type MinorUnits,
  type ProposalDraftValueSet,
  type SystemType,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { wordsAroundFigure } from './assembled';

/**
 * The cover's words (`M06-51`), built over a draft's value set as it stands: the cover is drawn from
 * step 1, before any price is typed, so nothing here reads the money but the payable's own label.
 * The document's other pages take `proposalPageWords`, which carries these.
 */

type T = Translator['t'];

/** Two sentences side by side, in the reader's order. */
export const TWO_SENTENCES = /*i18n*/ { id: '{first} {second}' };

const PAGE = {
  pageName: /*i18n*/ { id: 'Page {page} of {count}: {title}' },
  cover: /*i18n*/ { id: 'Cover' },
} as const;

const SYSTEM_TYPE: Record<SystemType, { id: string }> = {
  on_grid: /*i18n*/ { id: 'on-grid' },
  hybrid: /*i18n*/ { id: 'hybrid' },
  off_grid: /*i18n*/ { id: 'off-grid' },
};

const COVER = {
  over: /*i18n*/ { id: 'Solar proposal' },
  draft: /*i18n*/ { id: 'Draft' },
  homeIn: /*i18n*/ { id: 'A {size} kW {type} rooftop system for your home in {place}' },
  home: /*i18n*/ { id: 'A {size} kW {type} rooftop system for your home' },
  siteIn: /*i18n*/ { id: 'A {size} kW {type} rooftop system for your site in {place}' },
  site: /*i18n*/ { id: 'A {size} kW {type} rooftop system for your site' },
  powerOnly: /*i18n*/ { id: 'You pay only for the power.' },
  payableLabel: /*i18n*/ { id: 'your investment' },
  payableLabelWithTax: /*i18n*/ { id: 'your investment, with {tax}' },
  generationValue: /*i18n*/ { id: '{amount} kWh' },
  generationLabel: /*i18n*/ { id: 'clean power each year' },
  paybackValue: /*i18n*/ { id: '{years} years' },
  /** The caption under the payback figure; `{payback}` is that figure, drawn apart above it. */
  paybackLabel: /*i18n*/ { id: '{payback} to pay for itself' },
  preparedBy: /*i18n*/ { id: 'Prepared by {person}' },
  preparedByPhone: /*i18n*/ { id: 'Prepared by {person} · {phone}' },
  validity: /*i18n*/ { id: 'Valid for {days} days' },
} as const;

/** The market's format, as these words need it — `packages/ui`'s `MarketFormat` has all four. */
export interface ProposalWordsFormat {
  number(value: number): string;
  amount(value: MinorUnits): string;
  phone(e164: string): string;
}

/** What the cover's words are built over: the value set as it stands, and the market's tax name. */
export interface ProposalCoverInput {
  readonly snapshot: ProposalDraftValueSet;
  readonly format: ProposalWordsFormat;
  /** The tax's name, from the market pack — `GST`. */
  readonly taxName: string;
}

/** Who to call, as the pages name them: the person who prepared the version, and their number. */
export function preparedPersonOf(input: ProposalCoverInput): {
  name: string;
  phone: string | null;
} {
  const { name, phoneE164 } = input.snapshot.preparedBy;
  return { name, phone: phoneE164 === null ? null : input.format.phone(phoneE164) };
}

/** The cover's one line for the system; absent until the system has a size. */
function coverSystem(t: T, input: ProposalCoverInput): TranslatedText | undefined {
  const { snapshot, format } = input;
  const line = coverLineFacts(snapshot.fields);
  if (line === null) return undefined;
  const place = snapshot.deal.area?.district ?? null;
  const home = snapshot.deal.segment === 'residential';
  const where = home
    ? place === null
      ? COVER.home
      : COVER.homeIn
    : place === null
      ? COVER.site
      : COVER.siteIn;
  const sentence = t(where, {
    size: format.number(line.capacityKw),
    type: t(SYSTEM_TYPE[line.systemType]),
    place,
  });
  return line.paysForPower
    ? t(TWO_SENTENCES, { first: `${sentence}.`, second: t(COVER.powerOnly) })
    : sentence;
}

/** The cover's validity line, where the server read one off the terms (`validityDays`). */
function coverValidity(t: T, snapshot: ProposalDraftValueSet): TranslatedText | undefined {
  const days = snapshot.validityDays;
  return days === null ? undefined : t(COVER.validity, { days });
}

/** The cover's words, with the page's name for a screen reader — what `CoverPage` takes. */
export function proposalCoverWords(t: T, input: ProposalCoverInput) {
  const { snapshot } = input;
  const person = preparedPersonOf(input);
  const taxed = snapshot.money !== null && snapshot.money.taxes.length > 0;
  return {
    pageName: (title: TranslatedText, page: number, count: number) =>
      t(PAGE.pageName, { title, page, count }),
    titles: { cover: t(PAGE.cover) },
    cover: {
      over: t(COVER.over),
      draft: t(COVER.draft),
      system: coverSystem(t, input),
      payableLabel: taxed
        ? t(COVER.payableLabelWithTax, { tax: input.taxName })
        : t(COVER.payableLabel),
      generationValue: (amount: string) => t(COVER.generationValue, { amount }),
      generationLabel: t(COVER.generationLabel),
      paybackValue: (years: string) => t(COVER.paybackValue, { years }),
      paybackLabel: wordsAroundFigure(t(COVER.paybackLabel, { payback: FIGURE_SLOT })),
      preparedBy:
        person.phone === null
          ? t(COVER.preparedBy, { person: person.name })
          : t(COVER.preparedByPhone, { person: person.name, phone: person.phone }),
      validity: coverValidity(t, snapshot),
    },
  };
}

export type ProposalCoverWords = ReturnType<typeof proposalCoverWords>;
