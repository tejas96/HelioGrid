/**
 * The duplicate sheet's words (`packages/ui`'s `DedupeSheetWords`, `M02-08`, `M02-09`): its
 * heading, the record and its three facts, and the three choices with one line each — chosen by
 * whether the person may open the record and whether it has an owner.
 */
import type { LeadStage } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { LEAD_STAGE_WORD } from './crm-vocabulary';
import { lastContactWord, stageTrackWords } from './lead-marks';
import { SHELL } from './shell';

const DEDUPE = {
  heading: /*i18n*/ { id: 'This number is already here' },
  intro: /*i18n*/ { id: '{phone} matches a lead. Nothing is saved yet.' },
  outsideTitle: /*i18n*/ { id: 'A lead outside your list' },
  outsideLine: /*i18n*/ { id: 'You see who has it, never what is in it.' },
  noName: /*i18n*/ { id: 'No name yet' },
  noCity: /*i18n*/ { id: 'No city yet' },
  ownerLabel: /*i18n*/ { id: 'Owner' },
  stageLabel: /*i18n*/ { id: 'Stage' },
  lastContactLabel: /*i18n*/ { id: 'Last contact' },
  noOwner: /*i18n*/ { id: 'No owner yet' },
  openExisting: /*i18n*/ { id: 'Open existing' },
  openNamed: /*i18n*/ { id: 'Go to {name}. What you typed is not saved.' },
  openUnnamed: /*i18n*/ { id: 'Go to that lead. What you typed is not saved.' },
  askOwner: /*i18n*/ { id: 'Ask {owner} to share it' },
  askOwnerLine: /*i18n*/ { id: '{owner} gets a request. Nothing is saved yet.' },
  askCompany: /*i18n*/ { id: 'Ask for this lead' },
  askCompanyLine: /*i18n*/ { id: 'Your company’s owner gets a request. Nothing is saved yet.' },
  logEnquiry: /*i18n*/ { id: 'Log enquiry on it' },
  logEnquiryLine: /*i18n*/ { id: 'What you typed goes on its timeline. {owner} is told.' },
  logEnquiryCompanyLine: /*i18n*/ {
    id: 'What you typed goes on its timeline. Your company’s owner is told.',
  },
  keepBoth: /*i18n*/ { id: 'Keep both leads' },
  keepBothLine: /*i18n*/ { id: 'Needs a reason. The two leads link to each other.' },
  reasonLabel: /*i18n*/ { id: 'Why keep both?' },
  reasonPlaceholder: /*i18n*/ { id: 'For example: same family, a second roof' },
  nothingCreated: /*i18n*/ { id: 'Close this and nothing is created.' },
  opening: /*i18n*/ { id: 'Opening the lead…' },
  asking: /*i18n*/ { id: 'Sending the request…' },
  logging: /*i18n*/ { id: 'Logging the enquiry…' },
  keeping: /*i18n*/ { id: 'Saving both leads…' },
} as const;

/** What the sheet's words are chosen by — every one a fact the match and the capture carry. */
export interface DedupeSheetFacts {
  /** The typed number, as the screen shows a phone. */
  readonly phone: string;
  /** Whether the person may open the record (`M02-08`); outside it, the record says nothing. */
  readonly inScope: boolean;
  /** The record's name when the person may see it and it has one. */
  readonly recordName: string | null;
  /** The lead's owner by name; `null` while it waits unassigned. */
  readonly ownerName: string | null;
  readonly stage: LeadStage;
  /** Milliseconds since the last contact, by the caller's clock; `null` for never. */
  readonly lastContactElapsedMs: number | null;
}

function openExistingWords(t: Translator['t'], facts: DedupeSheetFacts) {
  if (facts.inScope) {
    const line =
      facts.recordName === null
        ? t(DEDUPE.openUnnamed)
        : t(DEDUPE.openNamed, { name: facts.recordName });
    return { title: t(DEDUPE.openExisting), line };
  }
  if (facts.ownerName === null) {
    return { title: t(DEDUPE.askCompany), line: t(DEDUPE.askCompanyLine) };
  }
  return {
    title: t(DEDUPE.askOwner, { owner: facts.ownerName }),
    line: t(DEDUPE.askOwnerLine, { owner: facts.ownerName }),
  };
}

/** Every word `DedupeSheet` says, for this match. */
export function dedupeSheetWords(t: Translator['t'], facts: DedupeSheetFacts) {
  return {
    heading: t(DEDUPE.heading),
    intro: t(DEDUPE.intro, { phone: facts.phone }),
    close: t(SHELL.close),
    outsideTitle: t(DEDUPE.outsideTitle),
    outsideLine: t(DEDUPE.outsideLine),
    noName: t(DEDUPE.noName),
    noCity: t(DEDUPE.noCity),
    ownerLabel: t(DEDUPE.ownerLabel),
    stageLabel: t(DEDUPE.stageLabel),
    lastContactLabel: t(DEDUPE.lastContactLabel),
    noOwner: t(DEDUPE.noOwner),
    stage: t(LEAD_STAGE_WORD[facts.stage]),
    lastContact: lastContactWord(t, facts.lastContactElapsedMs),
    stageTrack: stageTrackWords(t),
    openExisting: openExistingWords(t, facts),
    logEnquiry: {
      title: t(DEDUPE.logEnquiry),
      line:
        facts.ownerName === null
          ? t(DEDUPE.logEnquiryCompanyLine)
          : t(DEDUPE.logEnquiryLine, { owner: facts.ownerName }),
    },
    keepBoth: { title: t(DEDUPE.keepBoth), line: t(DEDUPE.keepBothLine) },
    reasonLabel: t(DEDUPE.reasonLabel),
    reasonPlaceholder: t(DEDUPE.reasonPlaceholder),
    keepBothConfirm: t(DEDUPE.keepBoth),
    nothingCreated: t(DEDUPE.nothingCreated),
    waiting: {
      open_existing: t(facts.inScope ? DEDUPE.opening : DEDUPE.asking),
      log_enquiry: t(DEDUPE.logging),
      keep_both: t(DEDUPE.keeping),
    },
  };
}
