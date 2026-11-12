import type { LeadStage, LostReason, NeedsYouKind } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { LEAD_STAGE_WORD, LOST_REASON_WORD } from './crm-vocabulary';
import { numberFieldWords } from './number-field';
import { SHELL } from './shell';

type T = Translator['t'];

/** The dashboard's messages; the export (`owner-dashboard-csv.ts`) writes the same words. */
export const OWNER_DASHBOARD = {
  needsYouNow: /*i18n*/ { id: 'Needs you now' },
  position: /*i18n*/ { id: '{at} of {of}' },
  unassigned: /*i18n*/ {
    id: '{count, plural, one {# lead has no owner} other {# leads have no owner}}',
  },
  paymentsLate: /*i18n*/ {
    id: '{count, plural, one {# payment is late} other {# payments are late}}',
  },
  blockedOnUs: /*i18n*/ {
    id: '{count, plural, one {# project is blocked on us} other {# projects are blocked on us}}',
  },
  waitingLongest: /*i18n*/ { id: 'Waiting longest' },
  myOverdueTasks: /*i18n*/ {
    id: '{count, plural, one {# of your tasks is overdue} other {# of your tasks are overdue}}',
  },
  unassignedLine: /*i18n*/ {
    id: '{hours, plural, one {Oldest waiting # hour} other {Oldest waiting # hours}}',
  },
  lateLine: /*i18n*/ {
    id: '{amount} · {days, plural, one {oldest # day late} other {oldest # days late}}',
  },
  blockedLine: /*i18n*/ {
    id: '{name} · {days, plural, one {# day} other {# days}}',
  },
  waitingLine: /*i18n*/ {
    id: '{name} · {days, plural, =0 {in {stage} since today} one {# day in {stage}} other {# days in {stage}}}',
  },
  myTasksLine: /*i18n*/ { id: 'They are on your My Day' },
  assign: /*i18n*/ { id: 'Assign' },
  open: /*i18n*/ { id: 'Open' },
  review: /*i18n*/ { id: 'Review' },
  openMyDay: /*i18n*/ { id: 'Open My Day' },
  nextNeed: /*i18n*/ { id: 'Next' },
  allClearTitle: /*i18n*/ { id: 'Nothing needs you right now' },
  allClearBody: /*i18n*/ {
    id: 'Leads without an owner, late payments and blocked work show here first.',
  },
  cashTitle: /*i18n*/ { id: 'Collected' },
  soFarThisMonth: /*i18n*/ { id: 'So far this month' },
  vsLastMonth: /*i18n*/ { id: 'Last month {amount}' },
  toCollect: /*i18n*/ { id: 'To collect' },
  late: /*i18n*/ { id: '{count, plural, one {Late · #} other {Late · #}}' },
  wonSoFar: /*i18n*/ { id: 'Won so far' },
  wonDeals: /*i18n*/ { id: '{count, plural, one {# deal} other {# deals}}' },
  ofTarget: /*i18n*/ { id: '{share} of {target} target' },
  percent: /*i18n*/ { id: '{value}%' },
  noTarget: /*i18n*/ { id: 'No target set' },
  setTarget: /*i18n*/ { id: 'Set a target' },
  editTarget: /*i18n*/ { id: 'Edit target' },
  targetLabel: /*i18n*/ { id: 'Target for this month' },
  saveTarget: /*i18n*/ { id: 'Save target' },
  clearTarget: /*i18n*/ { id: 'Clear target' },
  cancel: /*i18n*/ { id: 'Cancel' },
  targetFailed: /*i18n*/ { id: 'The target did not save. Try again.' },
  targetNotPositive: /*i18n*/ { id: 'Enter a target above zero.' },
  targetTooLarge: /*i18n*/ { id: 'That amount is too large for a target.' },
  targetTooFine: /*i18n*/ {
    id: '{digits, plural, =0 {Use a whole amount, with no decimals.} one {Use at most # decimal place.} other {Use at most # decimal places.}}',
  },
  forecastTitle: /*i18n*/ { id: 'Forecast' },
  forecastGap: /*i18n*/ { id: 'Starts with proposals' },
  forecastNote: /*i18n*/ {
    id: 'Weighted by stage once proposals carry prices. Expected, not promised — never added to won.',
  },
  pipelineTitle: /*i18n*/ { id: 'Pipeline by stage' },
  openLeads: /*i18n*/ { id: '{count, plural, one {# open lead} other {# open leads}}' },
  valuesGap: /*i18n*/ { id: 'Stage values come with proposals.' },
  medianWon: /*i18n*/ {
    id: '{of, plural, one {Won deal: {amount}} other {Middle of # won deals: {amount}}}',
  },
  winLossTitle: /*i18n*/ { id: 'Why deals were lost' },
  windowDays: /*i18n*/ { id: 'Last {days} days' },
  winRate: /*i18n*/ { id: '{rate} win rate' },
  tooFew: /*i18n*/ {
    id: 'Too few closed deals for a rate yet · {won} won, {lost} lost',
  },
  wonLost: /*i18n*/ { id: '{won} won · {lost} lost' },
  noLosses: /*i18n*/ { id: 'No deals lost in this time.' },
  export: /*i18n*/ { id: 'Export CSV' },
  teamScope: /*i18n*/ { id: 'Your team' },
  loading: /*i18n*/ { id: 'Loading the dashboard' },
  failedTitle: /*i18n*/ { id: 'The dashboard did not load' },
  failedMessage: /*i18n*/ { id: 'Check your connection and try again.' },
} satisfies Record<string, MessageRef>;

export const NEEDS_YOU_TITLE: Record<NeedsYouKind, MessageRef> = {
  unassigned: OWNER_DASHBOARD.unassigned,
  payments_late: OWNER_DASHBOARD.paymentsLate,
  blocked_on_us: OWNER_DASHBOARD.blockedOnUs,
  waiting_longest: OWNER_DASHBOARD.waitingLongest,
  my_overdue_tasks: OWNER_DASHBOARD.myOverdueTasks,
};

const NEED_ACT: Record<NeedsYouKind, MessageRef> = {
  unassigned: OWNER_DASHBOARD.assign,
  payments_late: OWNER_DASHBOARD.open,
  blocked_on_us: OWNER_DASHBOARD.open,
  waiting_longest: OWNER_DASHBOARD.review,
  my_overdue_tasks: OWNER_DASHBOARD.openMyDay,
};

/** The owner dashboard's words (`OwnerDashboardWords`). */
export function ownerDashboardWords(t: T) {
  return {
    needsYouNow: t(OWNER_DASHBOARD.needsYouNow),
    position: (at: number, of: number) => t(OWNER_DASHBOARD.position, { at, of }),
    needTitle: (kind: NeedsYouKind, count: number) => t(NEEDS_YOU_TITLE[kind], { count }),
    unassignedLine: (hours: number) => t(OWNER_DASHBOARD.unassignedLine, { hours }),
    lateLine: (amount: string, days: number) => t(OWNER_DASHBOARD.lateLine, { amount, days }),
    blockedLine: (name: string, days: number) => t(OWNER_DASHBOARD.blockedLine, { name, days }),
    waitingLine: (name: string, stage: LeadStage, days: number) =>
      t(OWNER_DASHBOARD.waitingLine, { name, stage: t(LEAD_STAGE_WORD[stage]), days }),
    myTasksLine: t(OWNER_DASHBOARD.myTasksLine),
    needAct: (kind: NeedsYouKind) => t(NEED_ACT[kind]),
    nextNeed: t(OWNER_DASHBOARD.nextNeed),
    allClearTitle: t(OWNER_DASHBOARD.allClearTitle),
    allClearBody: t(OWNER_DASHBOARD.allClearBody),
    cashTitle: t(OWNER_DASHBOARD.cashTitle),
    soFarThisMonth: t(OWNER_DASHBOARD.soFarThisMonth),
    vsLastMonth: (amount: string) => t(OWNER_DASHBOARD.vsLastMonth, { amount }),
    toCollect: t(OWNER_DASHBOARD.toCollect),
    late: (count: number) => t(OWNER_DASHBOARD.late, { count }),
    wonSoFar: t(OWNER_DASHBOARD.wonSoFar),
    wonDeals: (count: number) => t(OWNER_DASHBOARD.wonDeals, { count }),
    percent: (value: string): string => t(OWNER_DASHBOARD.percent, { value }),
    ofTarget: (share: string, target: string) => t(OWNER_DASHBOARD.ofTarget, { share, target }),
    noTarget: t(OWNER_DASHBOARD.noTarget),
    setTarget: t(OWNER_DASHBOARD.setTarget),
    editTarget: t(OWNER_DASHBOARD.editTarget),
    targetLabel: t(OWNER_DASHBOARD.targetLabel),
    saveTarget: t(OWNER_DASHBOARD.saveTarget),
    clearTarget: t(OWNER_DASHBOARD.clearTarget),
    cancel: t(OWNER_DASHBOARD.cancel),
    targetFailed: t(OWNER_DASHBOARD.targetFailed),
    targetNotPositive: t(OWNER_DASHBOARD.targetNotPositive),
    targetTooLarge: t(OWNER_DASHBOARD.targetTooLarge),
    targetTooFine: (digits: number) => t(OWNER_DASHBOARD.targetTooFine, { digits }),
    forecastTitle: t(OWNER_DASHBOARD.forecastTitle),
    forecastGap: t(OWNER_DASHBOARD.forecastGap),
    forecastNote: t(OWNER_DASHBOARD.forecastNote),
    pipelineTitle: t(OWNER_DASHBOARD.pipelineTitle),
    openLeads: (count: number) => t(OWNER_DASHBOARD.openLeads, { count }),
    stage: (stage: LeadStage) => t(LEAD_STAGE_WORD[stage]),
    valuesGap: t(OWNER_DASHBOARD.valuesGap),
    medianWon: (amount: string, of: number) => t(OWNER_DASHBOARD.medianWon, { amount, of }),
    winLossTitle: t(OWNER_DASHBOARD.winLossTitle),
    windowDays: (days: number) => t(OWNER_DASHBOARD.windowDays, { days }),
    winRate: (rate: string) => t(OWNER_DASHBOARD.winRate, { rate }),
    tooFew: (won: number, lost: number) => t(OWNER_DASHBOARD.tooFew, { won, lost }),
    wonLost: (won: number, lost: number) => t(OWNER_DASHBOARD.wonLost, { won, lost }),
    lostReason: (reason: LostReason) => t(LOST_REASON_WORD[reason]),
    noLosses: t(OWNER_DASHBOARD.noLosses),
    export: t(OWNER_DASHBOARD.export),
    teamScope: t(OWNER_DASHBOARD.teamScope),
    numberField: numberFieldWords(t),
    loading: t(OWNER_DASHBOARD.loading),
    failedTitle: t(OWNER_DASHBOARD.failedTitle),
    failedMessage: t(OWNER_DASHBOARD.failedMessage),
    retry: t(SHELL.tryAgain),
  };
}
