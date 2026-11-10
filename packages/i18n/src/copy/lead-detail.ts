/**
 * Lead Detail's words (`SCR-M02-04`, `M02-32`): the page's reads and its honest landing, the hero
 * (`packages/ui`'s `LeadHeroWords`), the five actions and the state acts (`LeadActionDock`). The
 * qualify card, contacts and sections are `lead-detail-parts.ts`; the sheets
 * `lead-detail-sheets.ts`; the timeline's entries `lead-timeline.ts`.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import {
  type DialBlock,
  LEAD_STAGES,
  type LeadLifecycleState,
  type LeadStage,
  type LeadStateAct,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { DEAL_SEGMENT_WORD, LEAD_STAGE_WORD } from './crm-vocabulary';
import { leadSourceWord, leadStateLabel, stageTrackWords } from './lead-marks';
import { NOTIFICATION_CENTRE } from './notifications';
import { SHELL } from './shell';

type T = Translator['t'];

export const LEAD_DETAIL = {
  loading: /*i18n*/ { id: 'Loading the lead' },
  failedTitle: /*i18n*/ { id: 'Couldn’t load this lead' },
  gone: /*i18n*/ { id: 'This lead is no longer in your scope, or was removed.' },
  noName: /*i18n*/ { id: 'No name yet' },
  noCity: /*i18n*/ { id: 'No city yet' },
  noOwner: /*i18n*/ { id: 'No owner yet' },
  phoneCity: /*i18n*/ { id: '{phone} · {city}' },
  ownerSpoken: /*i18n*/ { id: 'Owner: {name}. Give the lead to someone' },
  noOwnerSpoken: /*i18n*/ { id: 'No owner yet. Give the lead to someone' },
  cameFrom: /*i18n*/ { id: 'Came from {name}' },
  tries: /*i18n*/ {
    id: '{count, plural, one {# try, no answer} other {# tries, no answer}}',
  },
  valueLabel: /*i18n*/ { id: 'Value' },
  noValue: /*i18n*/ { id: 'No value yet' },
  provisional: /*i18n*/ { id: 'Provisional' },
  nextStage: /*i18n*/ { id: 'Next, {stage}' },
  call: /*i18n*/ { id: 'Call' },
  message: /*i18n*/ { id: 'Message' },
  logActivity: /*i18n*/ { id: 'Log activity' },
  log: /*i18n*/ { id: 'Log' },
  bookVisit: /*i18n*/ { id: 'Book visit' },
  visit: /*i18n*/ { id: 'Visit' },
  createDesign: /*i18n*/ { id: 'Create design' },
  design: /*i18n*/ { id: 'Design' },
  doNotCallOn: /*i18n*/ { id: 'Do not call is on for this customer.' },
  wrongNumber: /*i18n*/ { id: 'This number was marked wrong. No call goes to it.' },
  designLater: /*i18n*/ {
    id: 'Designs are made in the design studio, which arrives in a later release.',
  },
  closedNoVisit: /*i18n*/ { id: 'Reopen the lead to book a visit.' },
  snooze: /*i18n*/ { id: 'Snooze' },
  wake: /*i18n*/ { id: 'Wake up now' },
  disqualify: /*i18n*/ { id: 'Disqualify' },
  junk: /*i18n*/ { id: 'Junk' },
  reopen: /*i18n*/ { id: 'Reopen' },
  waking: /*i18n*/ { id: 'Waking the lead…' },
  reopening: /*i18n*/ { id: 'Reopening the lead…' },
  moreActs: /*i18n*/ { id: 'More acts' },
  addReferral: /*i18n*/ { id: 'Add a referral' },
  merge: /*i18n*/ { id: 'Merge with another customer' },
} as const;

const STATE_ACT: Record<LeadStateAct, MessageRef> = {
  snooze: LEAD_DETAIL.snooze,
  wake: LEAD_DETAIL.wake,
  disqualify: LEAD_DETAIL.disqualify,
  junk: LEAD_DETAIL.junk,
  reopen: LEAD_DETAIL.reopen,
};

const DIAL_BLOCK: Record<DialBlock, MessageRef> = {
  do_not_call: LEAD_DETAIL.doNotCallOn,
  wrong_number: LEAD_DETAIL.wrongNumber,
};

/**
 * The page's own words: its reads and its ways back. A lead gone from the reader's scope — a
 * notice opened after a reassignment, a stale link, a search result — lands on the honest landing
 * (RFC decision 12), in words that hold however the lead was opened.
 */
export function leadDetailPageWords(t: T) {
  return {
    loading: t(LEAD_DETAIL.loading),
    failedTitle: t(LEAD_DETAIL.failedTitle),
    failedMessage: t(SHELL.keepsFailing),
    retry: t(SHELL.tryAgain),
    goneTitle: t(NOTIFICATION_CENTRE.landingTitle),
    goneMessage: t(LEAD_DETAIL.gone),
    backToList: t(NOTIFICATION_CENTRE.backToList),
    close: t(SHELL.close),
    noName: t(LEAD_DETAIL.noName),
  };
}

/**
 * The page's large title from the record's own facts: the name as typed, else its named gap; and
 * one summary line — the number, with the city when one is known.
 */
export function leadTitleWords(
  t: T,
  facts: { readonly name: string | null; readonly phone: string; readonly city: string | null },
) {
  return {
    title: facts.name === null ? t(LEAD_DETAIL.noName) : shownAsSent(facts.name),
    summary:
      facts.city === null
        ? shownAsSent(facts.phone)
        : t(LEAD_DETAIL.phoneCity, { phone: facts.phone, city: facts.city }),
  };
}

/** What the hero's words are chosen by — every one a fact the lead read carries. */
export interface LeadHeroFacts {
  readonly stage: LeadStage;
  readonly segment: keyof typeof DEAL_SEGMENT_WORD | null;
  readonly source: string;
  readonly cameFrom: string | null;
  readonly state: LeadLifecycleState | null;
  /** The wake day as the caller formats it, for a snoozed lead. */
  readonly wakeDay: string | null;
  readonly triesWithoutAnswer: number | null;
  readonly ownerName: string | null;
}

/** `LeadHero`'s words for this lead. */
export function leadHeroWords(t: T, facts: LeadHeroFacts) {
  const next = LEAD_STAGES[LEAD_STAGES.indexOf(facts.stage) + 1];
  return {
    noName: t(LEAD_DETAIL.noName),
    noCity: t(LEAD_DETAIL.noCity),
    stage: t(LEAD_STAGE_WORD[facts.stage]),
    segment: facts.segment === null ? null : t(DEAL_SEGMENT_WORD[facts.segment]),
    source: leadSourceWord(t, facts.source),
    cameFrom: facts.cameFrom === null ? null : t(LEAD_DETAIL.cameFrom, { name: facts.cameFrom }),
    state: facts.state === null ? null : leadStateLabel(t, facts.state, facts.wakeDay),
    tries:
      facts.triesWithoutAnswer === null
        ? null
        : t(LEAD_DETAIL.tries, { count: facts.triesWithoutAnswer }),
    owner: facts.ownerName === null ? t(LEAD_DETAIL.noOwner) : shownAsSent(facts.ownerName),
    ownerSpoken:
      facts.ownerName === null
        ? t(LEAD_DETAIL.noOwnerSpoken)
        : t(LEAD_DETAIL.ownerSpoken, { name: facts.ownerName }),
    valueLabel: t(LEAD_DETAIL.valueLabel),
    noValue: t(LEAD_DETAIL.noValue),
    provisional: t(LEAD_DETAIL.provisional),
    stepLine: stageTrackWords(t).stepOf(facts.stage),
    nextLine:
      next === undefined ? null : t(LEAD_DETAIL.nextStage, { stage: t(LEAD_STAGE_WORD[next]) }),
    stageTrack: stageTrackWords(t),
  };
}

/** The action dock's words: the five actions, their short forms, and why one is off. */
export function leadDockWords(t: T) {
  return {
    call: t(LEAD_DETAIL.call),
    callBlocked: (block: DialBlock) => t(DIAL_BLOCK[block]),
    message: { label: t(LEAD_DETAIL.message), short: t(LEAD_DETAIL.message) },
    log: { label: t(LEAD_DETAIL.logActivity), short: t(LEAD_DETAIL.log) },
    visit: { label: t(LEAD_DETAIL.bookVisit), short: t(LEAD_DETAIL.visit) },
    design: { label: t(LEAD_DETAIL.createDesign), short: t(LEAD_DETAIL.design) },
    designLater: t(LEAD_DETAIL.designLater),
    closedNoVisit: t(LEAD_DETAIL.closedNoVisit),
    stateAct: (act: LeadStateAct) => t(STATE_ACT[act]),
    /** The line a sheet-less act draws while it is out. */
    stateActWaiting: (act: Extract<LeadStateAct, 'wake' | 'reopen'>): TranslatedText =>
      t(act === 'wake' ? LEAD_DETAIL.waking : LEAD_DETAIL.reopening),
    moreActs: t(LEAD_DETAIL.moreActs),
    addReferral: t(LEAD_DETAIL.addReferral),
    merge: t(LEAD_DETAIL.merge),
  };
}
