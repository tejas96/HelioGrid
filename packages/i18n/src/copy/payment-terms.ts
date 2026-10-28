/**
 * The Payment terms page's words (`SCR-M01-20`, `M01-54`), authored once for both platforms
 * (Law 11) in three languages (`F3-07`). A stage's label is the pack's (`stageLabel`); its short
 * form and *when* sentence are `stageWords`; the meter's line is `allocationSentence`. The saved
 * line is the settings pages' one sentence (`settingsSavedLine`).
 */
import {
  type AllocationVerdict,
  type SettingsStanding,
  TRANCHE_LINE_LIMIT,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { allocationRefusal, allocationSentence } from './allocation';
import { type AttemptFailureLike, attemptFailureMessageId } from './api-error';
import { backToSettings, settingsRowName, settingsSavedLine } from './settings';

type T = Translator['t'];
type Failure = AttemptFailureLike & { readonly message: string };

const TERMS = {
  yourTerms: /*i18n*/ { id: 'Your payment terms' },
  archivedTitle: /*i18n*/ { id: 'Archived payment terms' },
  addTerms: /*i18n*/ { id: 'Add payment terms' },
  defaultMark: /*i18n*/ { id: 'Default' },
  platformStandard: /*i18n*/ { id: 'Platform standard' },
  closing: /*i18n*/ {
    id: 'These terms start every new proposal and become its collection schedule at Won; a sent one keeps its own.',
  },
  archivedCaption: /*i18n*/ { id: 'Kept for proposals already sent. Restore one to use it again.' },
  restore: /*i18n*/ { id: 'Restore' },
  nothingArchived: /*i18n*/ { id: 'Nothing archived.' },
  loading: /*i18n*/ { id: 'Loading your payment terms' },
  unreadTitle: /*i18n*/ { id: "We couldn't load your payment terms." },
  unreadBody: /*i18n*/ { id: 'Open this page again to retry.' },
  seededTitle: /*i18n*/ { id: "You're starting with the two standard terms." },
  seededBody: /*i18n*/ { id: 'Both work as they are, so your team can send proposals today.' },
  neverChanged: /*i18n*/ { id: 'Added when your account was created · not changed since' },
  notSaved: /*i18n*/ { id: 'Not saved yet' },
  newTerms: /*i18n*/ { id: 'New payment terms' },
  termsName: /*i18n*/ { id: 'Name of these terms' },
  termsNameNeeded: /*i18n*/ { id: 'Give these terms a name' },
  previewCaption: /*i18n*/ { id: 'Your customer sees this when you save' },
  sampleContract: /*i18n*/ { id: 'Sample contract' },
  eachAmount: /*i18n*/ { id: 'Each amount' },
  schedule: /*i18n*/ { id: 'Payment schedule' },
  noSchedule: /*i18n*/ { id: 'No schedule yet' },
  name: /*i18n*/ { id: 'Name' },
  share: /*i18n*/ { id: 'Share' },
  shareRange: /*i18n*/ { id: 'A tranche carries a share between 0.01% and 100%.' },
  trancheNameNeeded: /*i18n*/ { id: 'Name this tranche' },
  addTranche: /*i18n*/ { id: 'Add a tranche' },
  makeDefault: /*i18n*/ { id: 'Use for new proposals' },
  isDefault: /*i18n*/ { id: 'New proposals use these terms.' },
  archive: /*i18n*/ { id: 'Archive' },
  allocation: /*i18n*/ { id: 'Tranche allocation' },
  save: /*i18n*/ { id: 'Save terms' },
  cancel: /*i18n*/ { id: 'Cancel' },
  saveFailedTitle: /*i18n*/ { id: "We couldn't save these payment terms." },
  saveFailedBody: /*i18n*/ {
    id: 'Nothing you typed is lost, and customers keep the terms already in force.',
  },
  skippableMark: /*i18n*/ { id: 'This stage can be skipped' },
  skippableRule: /*i18n*/ {
    id: 'If a project skips this stage, the tranche falls due at the next stage that happens.',
  },
  pickerTitle: /*i18n*/ { id: 'When is it due?' },
  canBeSkipped: /*i18n*/ { id: 'Can be skipped' },
  skipRule: /*i18n*/ { id: 'A skipped stage moves its tranche to the next one.' },
  done: /*i18n*/ { id: 'Done' },
  keepIt: /*i18n*/ { id: 'Keep it' },
  archiveBody: /*i18n*/ {
    id: 'New proposals stop offering it; you can restore it any time and nothing is deleted.',
  },
  leaveTitle: /*i18n*/ { id: 'Leave without saving?' },
  leaveBody: /*i18n*/ { id: 'Your changes are lost, and the terms in force stay as they are.' },
  leaveConfirm: /*i18n*/ { id: 'Discard and leave' },
  keepEditing: /*i18n*/ { id: 'Keep editing' },
} as const;

const NAMED = {
  archivedCount: /*i18n*/ { id: 'Archived payment terms, {count}' },
  cardDefault: /*i18n*/ { id: '{name}, default' },
  split: /*i18n*/ { id: '{name} split' },
  dueAt: /*i18n*/ { id: 'Due at {stage}' },
  nameOf: /*i18n*/ { id: 'Name of {tranche}' },
  shareOf: /*i18n*/ { id: 'Share of {tranche}' },
  remove: /*i18n*/ { id: 'Remove {tranche}' },
  restore: /*i18n*/ { id: 'Restore {name}' },
  edit: /*i18n*/ { id: 'Edit {name}' },
  backTo: /*i18n*/ { id: 'Back to {name}' },
  archiveTitle: /*i18n*/ { id: 'Archive {name}?' },
  whenDue: /*i18n*/ { id: 'When is {tranche} due?' },
  trancheShare: /*i18n*/ { id: '{tranche} · {share}%' },
  newTranche: /*i18n*/ { id: 'Tranche {number}' },
  cap: /*i18n*/ { id: 'Payment terms hold up to {count} tranches.' },
  logoAlt: /*i18n*/ { id: '{company} logo' },
} as const;

/** Every word the Payment terms page draws, in the reader's language. */
export function paymentTermsWords(t: T) {
  const fixed = Object.fromEntries(
    Object.entries(TERMS).map(([key, message]) => [key, t(message)]),
  ) as Record<keyof typeof TERMS, string>;
  return {
    ...fixed,
    title: settingsRowName(t, 'payment_terms'),
    backToSettings: backToSettings(t),
    cap: t(NAMED.cap, { count: TRANCHE_LINE_LIMIT }),
    /** The archive button's spoken name: *Archived payment terms, 2*. */
    archivedCount: (count: number) => t(NAMED.archivedCount, { count }),
    /** A card names itself, and says when it is the default. */
    cardLabel: (name: string, isDefault: boolean) =>
      isDefault ? t(NAMED.cardDefault, { name }) : name,
    split: (name: string) => t(NAMED.split, { name }),
    dueAt: (stage: string) => t(NAMED.dueAt, { stage }),
    nameOf: (tranche: string) => t(NAMED.nameOf, { tranche }),
    shareOf: (tranche: string) => t(NAMED.shareOf, { tranche }),
    remove: (tranche: string) => t(NAMED.remove, { tranche }),
    restoreName: (name: string) => t(NAMED.restore, { name }),
    edit: (name: string) => t(NAMED.edit, { name }),
    backTo: (name: string) => t(NAMED.backTo, { name }),
    archiveTitle: (name: string) => t(NAMED.archiveTitle, { name }),
    whenDue: (tranche: string) => t(NAMED.whenDue, { tranche }),
    /** The picker's overline and a stage's pill (owner ruling Q1 A): the whole name and its share. */
    trancheShare: (tranche: string, share: string) => t(NAMED.trancheShare, { tranche, share }),
    /** *Add a tranche* names the line it adds by its number. */
    newTranche: (number: number) => t(NAMED.newTranche, { number }),
    logoAlt: (company: string) => t(NAMED.logoAlt, { company }),
  };
}

export type PaymentTermsWords = ReturnType<typeof paymentTermsWords>;

/** The saved line: who saved and when, or that the given terms were never changed. */
export function paymentTermsSavedLine(
  t: T,
  standing: SettingsStanding,
  formats: { readonly date: (epochMs: number) => string },
): string {
  return settingsSavedLine(t, standing, formats) ?? t(TERMS.neverChanged);
}

/**
 * The words of an act or a save that failed (`F8-36`): the failure's when no readable answer came,
 * else the api's code's; the api's own message when the catalog names neither.
 */
export function paymentTermsFailureWords(t: T, error: Failure): string {
  const id = attemptFailureMessageId(error);
  return id === undefined ? error.message : t({ id });
}

/**
 * What the editor's foot says off its state: the meter's line and the save's reason from the one
 * verdict, and — for a save refused by a conflict — the api's own words in the banner.
 */
export function paymentTermsEditorSaid(
  t: T,
  editor: {
    readonly verdict: AllocationVerdict;
    readonly saveConflict: boolean;
    readonly saveFailure: Failure | null;
  },
): { readonly sentence: string; readonly refusal: string | null; readonly conflict?: string } {
  const conflict =
    editor.saveConflict && editor.saveFailure !== null
      ? { conflict: paymentTermsFailureWords(t, editor.saveFailure) }
      : {};
  return {
    sentence: allocationSentence(t, editor.verdict),
    refusal: allocationRefusal(t, editor.verdict),
    ...conflict,
  };
}
