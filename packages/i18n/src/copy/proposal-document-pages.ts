import type { TranslatedText } from '@heliogrid/contracts';
import {
  customerShortNameOf,
  type IncludedLine,
  includedInPrice,
  namesAlternatives,
  type ProposalVersionSnapshot,
  type SystemType,
  shareTextOf,
  timelineDays,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { BASIS_LINE_WORD } from './document-basis';
import { energySourceLabel } from './energy-source';
import { type ProposalBlockFacts, proposalBlockWords } from './proposal-document';
import {
  type ProposalWordsFormat,
  preparedPersonOf,
  proposalCoverWords,
  TWO_SENTENCES,
} from './proposal-document-cover';
import type { ProposalPartsFacts } from './proposal-parts';

/**
 * The words of the proposal document's pages (`packages/ui`'s `ProposalPages`): titles, the cover,
 * each page's lead and the closing card. Every sentence that states a fact is a slot template over
 * the version's own facts (`M06-52`): the slots are the only way a fact gets in, so a sentence
 * cannot assert what the version does not hold, and a line whose fact is absent is not built.
 */

type T = Translator['t'];

/* The blocks' and the cover's words leave through this module too, so the package index names the document once. */
export * from './proposal-document';
export * from './proposal-document-cover';

const PAGE = {
  head: /*i18n*/ { id: 'Proposal · v{version}' },
  headDraft: /*i18n*/ { id: 'Proposal · draft' },
  footNamed: /*i18n*/ { id: '{customer} · {person}, {phone}' },
  footPerson: /*i18n*/ { id: '{customer} · {person}' },
} as const;

const TITLE = {
  aboutHome: /*i18n*/ { id: 'Why families choose us' },
  aboutOther: /*i18n*/ { id: 'Why customers choose us' },
  system: /*i18n*/ { id: 'What goes on your roof' },
  generation: /*i18n*/ { id: 'The power your roof will make' },
  savings: /*i18n*/ { id: 'What it saves you' },
  price: /*i18n*/ { id: 'Your price, and how you pay' },
  timeline: /*i18n*/ { id: 'From today to switch-on' },
  terms: /*i18n*/ { id: 'Terms and conditions' },
  bank: /*i18n*/ { id: 'Where to pay' },
} as const;

const SYSTEM_TYPE_NAME: Record<SystemType, { id: string }> = {
  on_grid: /*i18n*/ { id: 'On-grid' },
  hybrid: /*i18n*/ { id: 'Hybrid' },
  off_grid: /*i18n*/ { id: 'Off-grid' },
};

const LEAD = {
  system: /*i18n*/ { id: '{size} kW · {type}.' },
  systemPanels: /*i18n*/ {
    id: '{size} kW · {type} · {count, plural, one {# panel} other {# panels}}.',
  },
  alternatives: /*i18n*/ { id: 'Where two brands are named, you get one of them.' },
  timeline: /*i18n*/ { id: 'About {days} working days, once the first part is paid.' },
  bank: /*i18n*/ { id: 'Pay only into this account. We never ask for cash without a receipt.' },
  bankAbsent: /*i18n*/ { id: 'Your sales contact will share payment details with you.' },
} as const;

const INCLUDED = {
  title: /*i18n*/ { id: 'Included in this price' },
  panelsAndInverter: /*i18n*/ {
    id: '{count, plural, one {# solar panel} other {# solar panels}} and the inverter',
  },
  balance: /*i18n*/ { id: 'Mounting structure, cables and safety gear' },
  battery: /*i18n*/ { id: '{size} kWh battery' },
  commissioning: /*i18n*/ { id: 'Installation, testing and switch-on' },
  maintenanceYears: /*i18n*/ { id: '{years}-year maintenance plan' },
  maintenanceFree: /*i18n*/ { id: 'Free maintenance plan' },
} as const;

const CLOSE = {
  thanks: /*i18n*/ { id: 'Thank you, {name}.' },
  thanksPlain: /*i18n*/ { id: 'Thank you.' },
  questions: /*i18n*/ { id: 'Questions? Call {person} on {phone}.' },
} as const;

/**
 * What the document's words are built over: the version's own snapshot, and the few names it does
 * not hold — the market's.
 */
export interface ProposalPageInput extends Pick<ProposalPartsFacts, 'schemeName'> {
  readonly snapshot: ProposalVersionSnapshot;
  /** The version's number; absent on a draft. */
  readonly version?: number;
  readonly format: ProposalWordsFormat;
  /** The tax's name, from the market pack — `GST`. */
  readonly taxName: string;
  /** The market's low-generation season, from the pack — `Monsoon`. */
  readonly seasonName?: string;
}

/** The blocks' facts, read out of the snapshot for the customer's voice. */
export function blockFacts(t: T, input: ProposalPageInput): ProposalBlockFacts {
  const { snapshot, format } = input;
  const { fields, generation, emi } = snapshot;
  const tariff = fields.financials.tariffPerKwh;
  const source = generation?.source ?? null;
  return {
    voice: 'customer',
    customerName: customerShortNameOf(snapshot.deal.clientName ?? '', snapshot.deal.segment),
    companyName: snapshot.company.name,
    taxName: input.taxName,
    schemeName: input.schemeName,
    numberText: format.number,
    basis: snapshot.basisLine === null ? undefined : t(BASIS_LINE_WORD[snapshot.basisLine]),
    energySource: source === null ? undefined : energySourceLabel(t, source),
    energyPlace: snapshot.deal.area?.district ?? undefined,
    seasonName: input.seasonName,
    tariffText: tariff === null ? '' : format.amount(tariff),
    tariffRiseText: `${shareTextOf(fields.financials.tariffRise)}%`,
    emiRateText: fields.system.emi === null ? '' : `${shareTextOf(fields.system.emi.rate)}%`,
    emiMonths: emi?.months ?? 0,
    splitParts: fields.payment.tranches.length,
    proposalType: fields.company.proposalType,
  };
}

/** The system page's lead; absent until the system has a size. */
function systemLead(t: T, input: ProposalPageInput): TranslatedText | undefined {
  const { fields } = input.snapshot;
  const { capacityKw, systemType } = fields.system;
  if (capacityKw === null) return undefined;
  const values = { size: input.format.number(capacityKw), type: t(SYSTEM_TYPE_NAME[systemType]) };
  const panelCount = fields.components.find((line) => line.category === 'panel')?.count ?? null;
  const lead =
    panelCount === null
      ? t(LEAD.system, values)
      : t(LEAD.systemPanels, { ...values, count: panelCount });
  return namesAlternatives(fields)
    ? t(TWO_SENTENCES, { first: lead, second: t(LEAD.alternatives) })
    : lead;
}

function includedLine(t: T, input: ProposalPageInput, line: IncludedLine): TranslatedText {
  switch (line.kind) {
    case 'panels_and_inverter':
      return t(INCLUDED.panelsAndInverter, { count: line.panelCount });
    case 'structure_cables_electrical':
      return t(INCLUDED.balance);
    case 'battery':
      return t(INCLUDED.battery, { size: input.format.number(line.capacityKwh) });
    case 'commissioning':
      return t(INCLUDED.commissioning);
    case 'maintenance_free':
      return t(INCLUDED.maintenanceFree);
    default:
      return t(INCLUDED.maintenanceYears, { years: line.years });
  }
}

/** The customer and who to call; absent where the customer is not named, and the page prints the rest. */
function foot(t: T, input: ProposalPageInput): TranslatedText | undefined {
  const customer = input.snapshot.deal.clientName;
  if (customer === null) return undefined;
  const person = preparedPersonOf(input);
  return person.phone === null
    ? t(PAGE.footPerson, { customer, person: person.name })
    : t(PAGE.footNamed, { customer, person: person.name, phone: person.phone });
}

/**
 * Every word the document's pages say of their own, named as `ProposalPagesWords` takes them — all
 * of it read out of the version's own snapshot, so a screen's hook passes the server's answer
 * straight through and no page can state what the version does not hold.
 */
export function proposalPageWords(t: T, input: ProposalPageInput) {
  const { snapshot } = input;
  const person = preparedPersonOf(input);
  const days = timelineDays(snapshot.fields.timeline);
  const customer = snapshot.deal.clientName;
  const cover = proposalCoverWords(t, input);
  return {
    ...cover,
    blocks: proposalBlockWords(t, blockFacts(t, input)),
    head:
      input.version === undefined ? t(PAGE.headDraft) : t(PAGE.head, { version: input.version }),
    foot: foot(t, input),
    titles: {
      ...cover.titles,
      about: t(snapshot.deal.segment === 'residential' ? TITLE.aboutHome : TITLE.aboutOther),
      system: t(TITLE.system),
      generation: t(TITLE.generation),
      savings: t(TITLE.savings),
      price: t(TITLE.price),
      timeline: t(TITLE.timeline),
      terms: t(TITLE.terms),
      bank: t(TITLE.bank),
    },
    systemLead: systemLead(t, input),
    timelineLead: days === null ? undefined : t(LEAD.timeline, { days }),
    included: t(INCLUDED.title),
    includedLines: includedInPrice(snapshot.fields).map((line) => includedLine(t, input, line)),
    bankLead: t(LEAD.bank),
    bankAbsent: t(LEAD.bankAbsent),
    thanks:
      customer === null
        ? t(CLOSE.thanksPlain)
        : t(CLOSE.thanks, { name: customerShortNameOf(customer, snapshot.deal.segment) }),
    questions:
      person.phone === null
        ? undefined
        : t(CLOSE.questions, { person: person.name, phone: person.phone }),
  };
}

export type ProposalPageWords = ReturnType<typeof proposalPageWords>;
