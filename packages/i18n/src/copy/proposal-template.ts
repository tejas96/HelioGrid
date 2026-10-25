/**
 * The Proposal template page's words (`SCR-M01-19`, `M01-51`, `M01-52`), authored once for both
 * platforms (Law 11) in three languages (`F3-07`). The section names are a `Record` over domain's
 * `PROPOSAL_SECTIONS`, so a new section fails to compile here. The standing line is the settings
 * pages' one sentence (`settingsSavedLine`); the document's name is the ruled *Proposal* (`F3-11`).
 */
import {
  type CoverCount,
  type ProposalSection,
  type SettingsStanding,
  TIMELINE_PHASE_LIMIT,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import { LANGUAGE_META } from '../languages';
import type { MessageRef, Translator } from '../runtime';
import { languageSwitcherWords } from './language-switcher';
import { richTextWords } from './rich-text';
import { settingsRowName, settingsSavedLine } from './settings';

type T = Translator['t'];

/** The page's fixed words; `proposal-template-phase.ts` says the phase editor's from them too. */
export const TEMPLATE = {
  intro: /*i18n*/ { id: 'A Quick proposal goes out exactly as this template stands.' },
  stage: /*i18n*/ { id: 'The PDF your customer opens' },
  stageCaption: /*i18n*/ { id: 'The PDF your customer opens · sample customer and number' },
  openFullSize: /*i18n*/ { id: 'Open full size' },
  editor: /*i18n*/ { id: 'Edit your proposal template' },
  edit: /*i18n*/ { id: 'Edit' },
  cover: /*i18n*/ { id: 'Cover' },
  sections: /*i18n*/ { id: 'Sections' },
  terms: /*i18n*/ { id: 'Terms' },
  timeline: /*i18n*/ { id: 'Timeline' },
  language: /*i18n*/ { id: 'Language' },
  languageNoun: /*i18n*/ { id: 'language' },
  partsNoun: /*i18n*/ { id: 'parts' },
  document: /*i18n*/ { id: 'Document' },
  documentName: /*i18n*/ { id: 'Document name' },
  proposal: /*i18n*/ { id: 'Proposal' },
  about: /*i18n*/ { id: 'About your company' },
  declaredByYou: /*i18n*/ { id: 'declared by you' },
  sectionsPrint: /*i18n*/ { id: '{printing} of {of} optional sections print' },
  alwaysPrints: /*i18n*/ { id: 'Always prints' },
  termsIn: /*i18n*/ { id: 'Terms in {language}' },
  pages: /*i18n*/ { id: '{count, plural, one {≈ # page} other {≈ # pages}}' },
  projectPhases: /*i18n*/ { id: 'Project phases' },
  phasesNoun: /*i18n*/ { id: 'phases' },
  addPhase: /*i18n*/ { id: 'Add a phase' },
  editPhase: /*i18n*/ { id: 'Edit {phase}' },
  phaseCap: /*i18n*/ { id: 'A timeline holds up to {count} phases.' },
  phaseOf: /*i18n*/ { id: 'Phase {position} of {count}' },
  newPhase: /*i18n*/ { id: 'New phase' },
  phaseName: /*i18n*/ { id: 'Phase name' },
  phaseWhat: /*i18n*/ { id: 'What happens in this phase' },
  cancel: /*i18n*/ { id: 'Cancel' },
  savePhase: /*i18n*/ { id: 'Save phase' },
  addPhaseAct: /*i18n*/ { id: 'Add phase' },
  nameNeeded: /*i18n*/ { id: 'Give this phase a name' },
  nameTooLong: /*i18n*/ { id: 'A phase name holds up to {count} characters' },
  whatNeeded: /*i18n*/ { id: 'Say what happens in this phase' },
  termsNeedEnglish: /*i18n*/ { id: 'The terms always print, so they need words in English.' },
  aboutNeedsEnglish: /*i18n*/ {
    id: 'Write this in English too — every other language falls back to it.',
  },
  brandingRow: /*i18n*/ { id: 'Logo, colour and letterhead' },
  brandingFrom: /*i18n*/ { id: 'From Branding' },
  bankRow: /*i18n*/ { id: 'Bank details' },
  bankFrom: /*i18n*/ { id: '{bank} · from Business profile' },
  bankNone: /*i18n*/ { id: 'not added yet · from Business profile' },
  pageEnd: /*i18n*/ { id: 'Proposals already sent keep the template they were built with.' },
  teachTitle: /*i18n*/ { id: "You're on HelioGrid's standard template" },
  teachBody: /*i18n*/ { id: 'Replace any part with your own wording.' },
  writeOwn: /*i18n*/ { id: 'Write our own' },
  loadingPreview: /*i18n*/ { id: 'Loading the proposal preview' },
  loading: /*i18n*/ { id: 'Loading your proposal template' },
  unread: /*i18n*/ { id: "Your proposal template didn't load" },
  tryAgain: /*i18n*/ { id: 'Try again' },
  notSaved: /*i18n*/ { id: 'Not saved yet' },
  consequence: /*i18n*/ { id: 'Applies to every new proposal, Quick ones included.' },
  save: /*i18n*/ { id: 'Save template' },
  discard: /*i18n*/ { id: 'Discard changes' },
  saveFailed: /*i18n*/ { id: "Your template didn't save" },
  saveFailedBody: /*i18n*/ { id: 'Your changes are kept — press Save template again.' },
  deleteTitle: /*i18n*/ { id: 'Delete {phase}?' },
  deleteBody: /*i18n*/ { id: 'Until you save, Discard changes brings it back.' },
  deleteConfirm: /*i18n*/ { id: 'Delete phase' },
  keep: /*i18n*/ { id: 'Keep it' },
  leaveTitle: /*i18n*/ { id: 'Leave without saving?' },
  leaveBody: /*i18n*/ { id: 'Your changes are lost, and the saved template stays in force.' },
  leaveConfirm: /*i18n*/ { id: 'Discard and leave' },
  keepEditing: /*i18n*/ { id: 'Keep editing' },
  fullSizeSubtitle: /*i18n*/ { id: 'Sample customer and proposal number' },
  logoAlt: /*i18n*/ { id: '{company} logo' },
  sampleCustomer: /*i18n*/ { id: 'Meena Deshpande' },
  sampleCustomerPlace: /*i18n*/ { id: 'Kothrud, Pune' },
  sectionsTitle: /*i18n*/ { id: 'What this proposal covers' },
  termsTitle: /*i18n*/ { id: 'Terms and conditions' },
} as const;

const COUNT_NAME: Record<CoverCount, MessageRef> = {
  totalCapacityInstalledKw: /*i18n*/ { id: 'Total capacity installed' },
  happyCustomers: /*i18n*/ { id: 'Happy customers' },
  citiesServed: /*i18n*/ { id: 'Cities served' },
};

const SECTION_NAME: Record<ProposalSection, MessageRef> = {
  achievements: /*i18n*/ { id: 'Achievements' },
  system: /*i18n*/ { id: 'Solar system' },
  performance: /*i18n*/ { id: 'Performance' },
  financials: /*i18n*/ { id: 'Financials' },
  timeline: /*i18n*/ { id: 'Project timeline' },
  payment_terms: /*i18n*/ { id: 'Payment terms' },
  components: /*i18n*/ { id: 'Components' },
  terms: /*i18n*/ { id: 'Terms and conditions' },
  bank_details: /*i18n*/ { id: 'Bank details' },
};

/** What each section says it is; the timeline's is its phase count, said in `sectionWords`. */
const SECTION_ABOUT: Record<Exclude<ProposalSection, 'timeline'>, MessageRef> = {
  achievements: /*i18n*/ { id: 'About your company and your counts.' },
  system: /*i18n*/ { id: 'Size, type and price of your system.' },
  performance: /*i18n*/ { id: 'Expected generation through the year.' },
  financials: /*i18n*/ { id: 'Yearly and lifetime savings, payback.' },
  payment_terms: /*i18n*/ { id: 'From Payment terms' },
  components: /*i18n*/ { id: 'Every panel, inverter and part, by make.' },
  terms: /*i18n*/ { id: 'The terms you write.' },
  bank_details: /*i18n*/ { id: 'From Business profile' },
};

const PHASE_COUNT = /*i18n*/ { id: '{count, plural, one {# phase} other {# phases}}' };

/** Each part's *HelioGrid's* line (`ValueSource`): whose it is, what it holds, and the field it names. */
const PLATFORM_PART = {
  cover: {
    layer: /*i18n*/ { id: "HelioGrid's cover" },
    source: /*i18n*/ { id: 'name and logo only' },
    field: /*i18n*/ { id: 'Cover' },
  },
  sections: {
    layer: /*i18n*/ { id: "HelioGrid's standard" },
    source: /*i18n*/ { id: 'every section prints' },
    field: /*i18n*/ { id: 'Sections that print' },
  },
  terms: {
    layer: /*i18n*/ { id: "HelioGrid's standard terms" },
    source: /*i18n*/ { id: 'English, Hindi and Marathi' },
    field: /*i18n*/ { id: 'Terms and conditions' },
  },
  timeline: {
    layer: /*i18n*/ { id: "HelioGrid's standard phases" },
    source: /*i18n*/ { id: 'English, Hindi and Marathi' },
    field: /*i18n*/ { id: 'Project timeline' },
  },
} as const;

/** The section rows: each section's name and what it says it is, in the document's order. */
export function sectionWords(t: T, phaseCount: number) {
  const about = (section: ProposalSection) =>
    section === 'timeline' ? t(PHASE_COUNT, { count: phaseCount }) : t(SECTION_ABOUT[section]);
  return (section: ProposalSection) => ({ title: t(SECTION_NAME[section]), about: about(section) });
}

/** A language's name as the strip and *Terms in …* say it: in itself (`F3-03`). */
export function languageName(language: UiLanguage): string {
  return LANGUAGE_META[language].endonym;
}

/** Every fixed word the Proposal template page draws, in the reader's language. */
export function proposalTemplateWords(t: T) {
  const fixed = Object.fromEntries(
    Object.entries(TEMPLATE).map(([key, message]) => [key, t(message)]),
  ) as Record<keyof typeof TEMPLATE, string>;
  return {
    ...fixed,
    title: settingsRowName(t, 'proposal_templates'),
    richText: richTextWords(t),
    languageSwitcher: languageSwitcherWords(t),
    counts: {
      totalCapacityInstalledKw: t(COUNT_NAME.totalCapacityInstalledKw),
      happyCustomers: t(COUNT_NAME.happyCustomers),
      citiesServed: t(COUNT_NAME.citiesServed),
    },
    platform: Object.fromEntries(
      Object.entries(PLATFORM_PART).map(([part, line]) => [
        part,
        { layer: t(line.layer), source: t(line.source), field: t(line.field) },
      ]),
    ) as Record<keyof typeof PLATFORM_PART, { layer: string; source: string; field: string }>,
    sectionsPrint: (printing: number, of: number) => t(TEMPLATE.sectionsPrint, { printing, of }),
    /** *Terms in English*: the language as the strip names it (`languageName`). */
    termsIn: (language: string) => t(TEMPLATE.termsIn, { language }),
    pages: (count: number) => t(TEMPLATE.pages, { count }),
    editPhase: (phase: string) => t(TEMPLATE.editPhase, { phase }),
    phaseCap: t(TEMPLATE.phaseCap, { count: TIMELINE_PHASE_LIMIT }),
    phaseOf: (position: number, count: number) => t(TEMPLATE.phaseOf, { position, count }),
    bankFrom: (bank: string | null) =>
      bank === null ? t(TEMPLATE.bankNone) : t(TEMPLATE.bankFrom, { bank }),
    deleteTitle: (phase: string) => t(TEMPLATE.deleteTitle, { phase }),
    logoAlt: (company: string) => t(TEMPLATE.logoAlt, { company }),
  };
}

export type ProposalTemplateWords = ReturnType<typeof proposalTemplateWords>;

/** The words the page's state chooses: the standing line, none while never saved. */
export function proposalTemplatePageWords(
  t: T,
  page: { readonly standing: SettingsStanding | null },
  formats: { readonly date: (epochMs: number) => string },
): { readonly standing?: string } {
  const standing = page.standing === null ? null : settingsSavedLine(t, page.standing, formats);
  return standing === null ? {} : { standing };
}

/** The strips' languages in the set's order, each named in itself (`F3-03`). */
export function templateLanguages(): readonly {
  readonly code: UiLanguage;
  readonly label: string;
}[] {
  return UI_LANGUAGES.map((code) => ({ code, label: languageName(code) }));
}
