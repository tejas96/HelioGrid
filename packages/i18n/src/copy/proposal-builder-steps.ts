import type { TranslatedText } from '@heliogrid/contracts';
import type { BankDetails, ProposalType } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { numberFieldWords } from './number-field';

/**
 * The words of the builder's steps 1, 2, 10 and 11 (`packages/ui`'s `ProposalSteps`), and what every
 * step shares. The person building is told what the customer does, by first name. A tax's and an
 * incentive's name are the market pack's; every figure arrives as the text the server sent. kW is
 * never translated.
 */

type T = Translator['t'];

const SHARED = {
  saved: /*i18n*/ { id: 'Saved' },
  saving: /*i18n*/ { id: 'Saving' },
  notSaved: /*i18n*/ { id: 'Not saved — tap to retry' },
  conflict: /*i18n*/ { id: 'Changed on another device — reload' },
  loading: /*i18n*/ { id: 'Loading the step' },
  failedTitle: /*i18n*/ { id: 'This step did not load' },
  failedMessage: /*i18n*/ { id: 'Your proposal is safe. Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  movedTitle: /*i18n*/ { id: 'This lead moved to {person}' },
  movedLine: /*i18n*/ {
    id: 'Your last change was not saved. The draft stays with the lead, for {person}.',
  },
} as const;

/** What every step shares: a field's save line, the loading name, the failed read. */
export function proposalStepWords(t: T) {
  return {
    number: numberFieldWords(t),
    saved: t(SHARED.saved),
    saving: t(SHARED.saving),
    notSaved: t(SHARED.notSaved),
    conflict: t(SHARED.conflict),
    loading: t(SHARED.loading),
    failedTitle: t(SHARED.failedTitle),
    failedMessage: t(SHARED.failedMessage),
    retry: t(SHARED.retry),
    /** The note a step shows when its lead moved away mid-draft (`T-M06-023`). */
    moved: (person: string) => ({
      title: t(SHARED.movedTitle, { person }),
      line: t(SHARED.movedLine, { person }),
    }),
  };
}

const COMPANY = {
  type: /*i18n*/ { id: 'Proposal type' },
  owns: /*i18n*/ { id: '{name} owns the system' },
  ownsLine: /*i18n*/ { id: 'They pay for it and keep every unit it makes.' },
  pays: /*i18n*/ { id: '{name} pays for power' },
  paysLine: /*i18n*/ { id: 'You own it and sell them the power (OPEX · PPA).' },
  cover: /*i18n*/ { id: 'Cover picture' },
  peek: /*i18n*/ { id: '{name}’s first page' },
  openPeek: /*i18n*/ { id: 'See the full page' },
  factsOwner: /*i18n*/ {
    id: 'From your company profile. Change it in Settings; every new proposal follows.',
  },
  factsOther: /*i18n*/ { id: 'From the company profile. Only {owner} can change it.' },
  company: /*i18n*/ { id: 'Company' },
  phone: /*i18n*/ { id: 'Phone' },
  email: /*i18n*/ { id: 'Email' },
  address: /*i18n*/ { id: 'Address' },
  coverHome: /*i18n*/ { id: 'Family home' },
  coverVilla: /*i18n*/ { id: 'Bungalow' },
  coverFactory: /*i18n*/ { id: 'Factory' },
  coverSociety: /*i18n*/ { id: 'Housing society' },
  coverOwn: /*i18n*/ { id: 'Your own photo' },
} as const;

/** Step 1's words. `owner` names who can change the company's facts; absent for who can. */
export function proposalCompanyStepWords(t: T, facts: { name: string; owner?: string }) {
  const typeOf: Record<ProposalType, { title: ReturnType<T>; line: ReturnType<T> }> = {
    customer_owns: { title: t(COMPANY.owns, { name: facts.name }), line: t(COMPANY.ownsLine) },
    customer_pays_for_power: {
      title: t(COMPANY.pays, { name: facts.name }),
      line: t(COMPANY.paysLine),
    },
  };
  return {
    type: t(COMPANY.type),
    typeOf,
    cover: t(COMPANY.cover),
    peek: t(COMPANY.peek, { name: facts.name }),
    openPeek: t(COMPANY.openPeek),
    factsLine:
      facts.owner === undefined
        ? t(COMPANY.factsOwner)
        : t(COMPANY.factsOther, { owner: facts.owner }),
    /** The read-only fact rows' names; the tax registration's name is the pack's own label. */
    factLabels: {
      company: t(COMPANY.company),
      phone: t(COMPANY.phone),
      email: t(COMPANY.email),
      address: t(COMPANY.address),
    },
    /** The cover pictures' names. */
    covers: {
      home: t(COMPANY.coverHome),
      villa: t(COMPANY.coverVilla),
      factory: t(COMPANY.coverFactory),
      society: t(COMPANY.coverSociety),
      own: t(COMPANY.coverOwn),
    },
  };
}

const RECORD = {
  kw: /*i18n*/ { id: 'kW installed' },
  customers: /*i18n*/ { id: 'happy customers' },
  cities: /*i18n*/ { id: 'cities served' },
  hintDefaults: /*i18n*/ { id: 'Tap a number to change it. Every new proposal prints these.' },
  hintOwner: /*i18n*/ {
    id: 'Tap a number to change it. A change stays on this proposal; save it for all in Proposal defaults.',
  },
  hintOther: /*i18n*/ {
    id: 'Tap a number to change it. A change stays on this proposal only.',
  },
  about: /*i18n*/ { id: 'About your company' },
  aboutCount: /*i18n*/ { id: '{count} / {max}' },
} as const;

/** Step 2's words: on a proposal for who may set defaults, for anyone else, or in Proposal defaults. */
export function proposalTrackRecordStepWords(
  t: T,
  facts: { where: 'defaults' | 'owner' | 'other' },
) {
  const hint = { defaults: RECORD.hintDefaults, owner: RECORD.hintOwner, other: RECORD.hintOther };
  return {
    counts: {
      totalCapacityInstalledKw: t(RECORD.kw),
      happyCustomers: t(RECORD.customers),
      citiesServed: t(RECORD.cities),
    },
    hint: t(hint[facts.where]),
    about: t(RECORD.about),
    aboutCount: (count: number, max: number) => t(RECORD.aboutCount, { count, max }),
  };
}

const CLIENT = {
  fromLead: /*i18n*/ { id: 'From the lead' },
  address: /*i18n*/ { id: 'Site address' },
  addressHelper: /*i18n*/ { id: 'Saved on the lead for the survey and the project.' },
  addressMissing: /*i18n*/ { id: 'Add the address the system goes on' },
  areaMissing: /*i18n*/ { id: 'Choose the state the site is in' },
  area: /*i18n*/ { id: 'State' },
  district: /*i18n*/ { id: 'District' },
  choose: /*i18n*/ { id: 'Choose' },
  closeList: /*i18n*/ { id: 'Close the list' },
  number: /*i18n*/ { id: 'Proposal number' },
  numberLater: /*i18n*/ { id: 'Comes when you generate' },
  language: /*i18n*/ { id: 'Document language' },
  languageOf: /*i18n*/ { id: '{language} · {name}’s language' },
  languageCompany: /*i18n*/ { id: '{language} · your company’s language' },
} as const;

/** Step 10's words, and its two fact rows' names and values. */
export function proposalClientStepWords(
  t: T,
  facts: { name: string; number?: string; language: string; customersOwn: boolean },
) {
  return {
    fromLead: t(CLIENT.fromLead),
    address: t(CLIENT.address),
    addressHelper: t(CLIENT.addressHelper),
    addressMissing: t(CLIENT.addressMissing),
    areaMissing: t(CLIENT.areaMissing),
    area: t(CLIENT.area),
    district: t(CLIENT.district),
    choose: t(CLIENT.choose),
    closeList: t(CLIENT.closeList),
    numberLabel: t(CLIENT.number),
    numberValue: facts.number ?? t(CLIENT.numberLater),
    languageLabel: t(CLIENT.language),
    languageValue: facts.customersOwn
      ? t(CLIENT.languageOf, { language: facts.language, name: facts.name })
      : t(CLIENT.languageCompany, { language: facts.language }),
  };
}

const BANK = {
  include: /*i18n*/ { id: 'Print bank details on this proposal' },
  includeDefaults: /*i18n*/ { id: 'Print bank details on proposals' },
  on: /*i18n*/ { id: 'The account is on the last page.' },
  off: /*i18n*/ { id: 'Saved, but not printed on this proposal.' },
  bankName: /*i18n*/ { id: 'Bank' },
  accountName: /*i18n*/ { id: 'Account name' },
  accountNumber: /*i18n*/ { id: 'Account number' },
  whoCan: /*i18n*/ { id: 'Only {owner} can add or change the bank account.' },
  none: /*i18n*/ { id: 'No bank account is saved yet. The proposal prints without one.' },
} as const;

/** Step 11's words; the routing identifier's name is the market pack's (`bankRoutingLabel`). */
export function proposalBankStepWords(
  t: T,
  facts: { include: boolean; owner: string; routingLabel: string; defaults?: boolean },
) {
  const fields: Record<keyof BankDetails, TranslatedText> = {
    bankName: t(BANK.bankName),
    accountName: t(BANK.accountName),
    accountNumber: t(BANK.accountNumber),
    bankRoutingIdentifier: shownAsSent(facts.routingLabel),
  };
  return {
    include: t(facts.defaults === true ? BANK.includeDefaults : BANK.include),
    includeLine: t(facts.include ? BANK.on : BANK.off),
    fields,
    whoCan: t(BANK.whoCan, { owner: facts.owner }),
    none: t(BANK.none),
  };
}
