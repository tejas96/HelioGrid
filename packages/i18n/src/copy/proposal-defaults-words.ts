import type { TranslatedText } from '@heliogrid/contracts';
import type {
  CoverPictureKey,
  DefaultsPart,
  ProposalPage,
  ProposalPhase,
  SettingsStanding,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { proposalBuilderWords } from './proposal-builder-frame';
import { proposalBankStepWords, proposalTrackRecordStepWords } from './proposal-builder-steps';
import {
  proposalPaymentStepWords,
  proposalTermsStepWords,
  proposalTimelineStepWords,
} from './proposal-builder-steps-rest';
import { backToSettings, settingsRowName, settingsSavedLine, settingsWords } from './settings';

/**
 * Proposal defaults' own words (`SCR-M01-19`, `T-M01-030`), authored once for both platforms
 * (Law 11): the frame said for a settings page, the seven parts, the pages and the cover pictures.
 * The parts' editors say the builder steps' words (`proposal-builder-steps*.ts`).
 */
type T = Translator['t'];

const DEFAULTS = {
  done: /*i18n*/ { id: 'Done' },
  seePage: /*i18n*/ { id: 'See the page' },
  parts: /*i18n*/ { id: 'Parts' },
  partOf: /*i18n*/ { id: 'Part {at} of {total}' },
  note: /*i18n*/ { id: 'Proposals already sent keep what they were sent with.' },
  stage: /*i18n*/ { id: 'The page your customer gets · sample customer' },
  peek: /*i18n*/ { id: 'The page your customer gets' },
  pageAt: /*i18n*/ { id: '{at} · {name}' },
  pageOff: /*i18n*/ { id: 'Off · {name}' },
  pagesPrint: /*i18n*/ { id: '{printing} of {of} pages print' },
  printPage: /*i18n*/ { id: 'Print {name}' },
  always: /*i18n*/ { id: 'Always' },
  pagesHint: /*i18n*/ {
    id: 'A page that is off is left out of the PDF and the customer’s link. Its step stays in the builder.',
  },
  coverPicture: /*i18n*/ { id: 'Cover picture' },
  coverPictureTag: /*i18n*/ { id: 'Fills the first page' },
  ownPhoto: /*i18n*/ { id: 'Your own photo' },
  ownPhotoLine: /*i18n*/ { id: 'A real site of yours works best' },
  ownPhotoRefused: /*i18n*/ { id: 'That photo did not upload. Use a PNG or JPG up to 2 MB.' },
  lookHint: /*i18n*/ {
    id: 'A proposal for a factory can use another picture. The rep picks it in step 1.',
  },
  brand: /*i18n*/ { id: 'Brand colour and logo' },
  brandFrom: /*i18n*/ { id: 'From Branding' },
  loading: /*i18n*/ { id: 'Loading your proposal defaults' },
  unread: /*i18n*/ { id: 'Your defaults did not load' },
  unreadLine: /*i18n*/ { id: 'Nothing changed. Check the connection and try again.' },
  tryAgain: /*i18n*/ { id: 'Try again' },
  notSaved: /*i18n*/ { id: 'Not saved yet' },
  neverSet: /*i18n*/ { id: 'HelioGrid’s standard · used by every new proposal' },
  save: /*i18n*/ { id: 'Save defaults' },
  discard: /*i18n*/ { id: 'Discard changes' },
  consequence: /*i18n*/ {
    id: 'Every new proposal starts with these. An open draft keeps what it holds until its Reset. A sent version never moves.',
  },
  saveFailed: /*i18n*/ { id: 'Your defaults didn’t save' },
  saveFailedBody: /*i18n*/ { id: 'Your changes are kept — press Save defaults again.' },
  close: /*i18n*/ { id: 'Close' },
  planFailedTitle: /*i18n*/ { id: 'The payment plan was not saved' },
  planFailedLine: /*i18n*/ { id: 'Your changes are still here. Press Save again.' },
  resetTimeline: /*i18n*/ { id: 'Reset to HelioGrid’s timeline' },
  leaveBody: /*i18n*/ { id: 'Your changes are lost, and the saved defaults stay in force.' },
  termsHint: /*i18n*/ { id: 'Every new proposal starts with these terms.' },
  trail: /*i18n*/ { id: 'Breadcrumb' },
  sampleCustomer: /*i18n*/ { id: 'Anil Sharma' },
  sampleAddress: /*i18n*/ { id: '12, Shivtirth Nagar, Kothrud, Pune 411038' },
  sampleDistrict: /*i18n*/ { id: 'Pune' },
} as const;

const PART_WORD: Record<DefaultsPart, MessageRef> = {
  look: /*i18n*/ { id: 'Look' },
  record: /*i18n*/ { id: 'Track record' },
  pages: /*i18n*/ { id: 'Pages' },
  timeline: /*i18n*/ { id: 'Timeline' },
  payment: /*i18n*/ { id: 'Payment' },
  terms: /*i18n*/ { id: 'Terms' },
  bank: /*i18n*/ { id: 'Bank' },
};

const PART_TITLE: Record<DefaultsPart, MessageRef> = {
  look: /*i18n*/ { id: 'How it looks' },
  record: /*i18n*/ { id: 'Your track record' },
  pages: /*i18n*/ { id: 'Which pages print' },
  timeline: /*i18n*/ { id: 'How the work goes' },
  payment: /*i18n*/ { id: 'How it is paid' },
  terms: /*i18n*/ { id: 'Terms and conditions' },
  bank: /*i18n*/ { id: 'Where to pay' },
};

const PAGE_NAME: Record<ProposalPage, MessageRef> = {
  cover: /*i18n*/ { id: 'Cover' },
  about: /*i18n*/ { id: 'About us' },
  system: /*i18n*/ { id: 'Your system' },
  generation: /*i18n*/ { id: 'Generation' },
  savings: /*i18n*/ { id: 'Savings' },
  price: /*i18n*/ { id: 'Price and payment' },
  timeline: /*i18n*/ { id: 'Timeline' },
  terms: /*i18n*/ { id: 'Terms' },
  bank: /*i18n*/ { id: 'Bank details' },
};

const PAGE_WHAT: Record<ProposalPage, MessageRef> = {
  cover: /*i18n*/ { id: 'The picture, the customer and three key figures' },
  about: /*i18n*/ { id: 'Your story and your track record' },
  system: /*i18n*/ { id: 'Brands, specifications and warranties' },
  generation: /*i18n*/ { id: 'Units by month, with the source' },
  savings: /*i18n*/ { id: 'Bill, payback and long-term savings' },
  price: /*i18n*/ { id: 'The price, the incentive and the payment plan' },
  timeline: /*i18n*/ { id: 'From today to switch-on' },
  terms: /*i18n*/ { id: 'Your terms and conditions' },
  bank: /*i18n*/ { id: 'Where the customer pays' },
};

const COVER_NAME: Record<CoverPictureKey, MessageRef> = {
  home: /*i18n*/ { id: 'Family home' },
  villa: /*i18n*/ { id: 'Bungalow' },
  factory: /*i18n*/ { id: 'Factory' },
  society: /*i18n*/ { id: 'Housing society' },
};

const COVER_LINE: Record<CoverPictureKey, MessageRef> = {
  home: /*i18n*/ { id: 'A terrace system on a city home' },
  villa: /*i18n*/ { id: 'A sloped roof at golden hour' },
  factory: /*i18n*/ { id: 'A large shed roof from above' },
  society: /*i18n*/ { id: 'A shared roof for many homes' },
};

function byKey<K extends string>(t: T, words: Record<K, MessageRef>): Record<K, TranslatedText> {
  return Object.fromEntries(
    Object.entries<MessageRef>(words).map(([key, message]) => [key, t(message)]),
  ) as Record<K, TranslatedText>;
}

/** Every word Proposal defaults draws itself, in the reader's language. */
export function proposalDefaultsWords(t: T) {
  const title = settingsRowName(t, 'proposal_templates');
  const frame = proposalBuilderWords(t, { name: '', fullName: '' });
  const partWord = byKey(t, PART_WORD);
  const partTitle = byKey(t, PART_TITLE);
  return {
    frame: {
      ...frame,
      close: backToSettings(t),
      preview: t(DEFAULTS.seePage),
      steps: t(DEFAULTS.parts),
      stepOf: (at: number, total: number) => t(DEFAULTS.partOf, { at, total }),
      last: t(DEFAULTS.done),
      generate: t(DEFAULTS.done),
    },
    closeLabel: t(DEFAULTS.close),
    title,
    note: t(DEFAULTS.note),
    stage: t(DEFAULTS.stage),
    peek: t(DEFAULTS.peek),
    parts: Object.fromEntries(
      (Object.keys(PART_WORD) as DefaultsPart[]).map((part) => [
        part,
        { title: partWord[part], heading: partTitle[part] },
      ]),
    ) as Record<DefaultsPart, { title: TranslatedText; heading: TranslatedText }>,
    pageName: byKey(t, PAGE_NAME),
    pageWhat: byKey(t, PAGE_WHAT),
    pageAt: (at: number, name: TranslatedText) => t(DEFAULTS.pageAt, { at, name }),
    pageOff: (name: TranslatedText) => t(DEFAULTS.pageOff, { name }),
    pagesPrint: (printing: number, of: number) => t(DEFAULTS.pagesPrint, { printing, of }),
    printPage: (name: TranslatedText) => t(DEFAULTS.printPage, { name }),
    always: t(DEFAULTS.always),
    pagesHint: t(DEFAULTS.pagesHint),
    coverPicture: t(DEFAULTS.coverPicture),
    coverPictureTag: t(DEFAULTS.coverPictureTag),
    ownPhoto: t(DEFAULTS.ownPhoto),
    ownPhotoLine: t(DEFAULTS.ownPhotoLine),
    lookHint: t(DEFAULTS.lookHint),
    loading: t(DEFAULTS.loading),
    unread: t(DEFAULTS.unread),
    unreadLine: t(DEFAULTS.unreadLine),
    tryAgain: t(DEFAULTS.tryAgain),
    save: t(DEFAULTS.save),
    discard: t(DEFAULTS.discard),
    consequence: t(DEFAULTS.consequence),
    saveFailed: t(DEFAULTS.saveFailed),
    saveFailedBody: t(DEFAULTS.saveFailedBody),
    /** The screen's own lines beside the part's words. */
    ownPhotoRefused: t(DEFAULTS.ownPhotoRefused),
    brand: t(DEFAULTS.brand),
    brandFrom: t(DEFAULTS.brandFrom),
    leaveBody: t(DEFAULTS.leaveBody),
    trail: t(DEFAULTS.trail),
    /** The breadcrumb's way back — *Settings*. */
    settings: settingsWords(t).title,
  };
}
export type ProposalDefaultsWords = ReturnType<typeof proposalDefaultsWords>;

/** The platform's four cover pictures, each with its name and what it shows. */
export function proposalDefaultsCovers(t: T) {
  return (Object.keys(COVER_NAME) as CoverPictureKey[]).map((key) => ({
    key,
    name: t(COVER_NAME[key]),
    line: t(COVER_LINE[key]),
  }));
}

/**
 * The line under the part's title: what is in force, or that a change waits to be saved. A company
 * that never saved reads HelioGrid's standard — never nothing.
 */
export function proposalDefaultsStanding(
  t: T,
  page: { readonly standing: SettingsStanding | null; readonly held: boolean },
  formats: { readonly date: (epochMs: number) => string },
): TranslatedText {
  if (page.held) return t(DEFAULTS.notSaved);
  const saved = page.standing === null ? null : settingsSavedLine(t, page.standing, formats);
  return saved ?? t(DEFAULTS.neverSet);
}

/**
 * The timeline rows' words for the company's own timeline: a phase's second line is its sentence as
 * the company wrote it — the company's timeline states no durations (`M01-52`) — and Reset goes back
 * to HelioGrid's phases.
 */
export function proposalDefaultsTimelineWords(t: T) {
  return {
    ...proposalTimelineStepWords(t),
    rowLine: (phase: ProposalPhase) => shownAsSent(phase.description),
    reset: t(DEFAULTS.resetTimeline),
  };
}

/** The seven parts' own words: the builder steps', said for the company's defaults. */
export function proposalDefaultsPartWords(
  t: T,
  facts: { owner: string; routingLabel: string; printsBank: boolean },
) {
  const payment = proposalPaymentStepWords(t, { where: 'defaults' });
  return {
    record: proposalTrackRecordStepWords(t, { where: 'defaults' }),
    timeline: proposalDefaultsTimelineWords(t),
    payment: {
      ...payment,
      planFailed: { title: t(DEFAULTS.planFailedTitle), line: t(DEFAULTS.planFailedLine) },
    },
    terms: { ...proposalTermsStepWords(t, {}), staysHere: t(DEFAULTS.termsHint) },
    bank: proposalBankStepWords(t, {
      include: facts.printsBank,
      owner: facts.owner,
      routingLabel: facts.routingLabel,
      defaults: true,
    }),
    brand: t(DEFAULTS.brand),
    brandFrom: t(DEFAULTS.brandFrom),
    ownPhotoRefused: t(DEFAULTS.ownPhotoRefused),
  };
}

/** The sample customer the stage draws the company's defaults for, in the reader's words. */
export function proposalDefaultsSampleCustomer(t: T) {
  return {
    name: t(DEFAULTS.sampleCustomer),
    siteAddress: t(DEFAULTS.sampleAddress),
    area: '',
    district: t(DEFAULTS.sampleDistrict),
  };
}
