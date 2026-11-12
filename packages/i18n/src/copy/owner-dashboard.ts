/**
 * The owner dashboard's words (`OwnerDashboardWords`, `SCR-M13-01`, `M13-14`…`M13-20`), and the
 * CSV it exports with every label beside its figure (`M13-53`).
 */
import type { OwnerDashboard } from '@heliogrid/contracts';
import {
  csvText,
  LEAD_STAGES,
  type LeadStage,
  type LostReason,
  type NeedsYouKind,
  type WinRate,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { LEAD_STAGE_WORD, LOST_REASON_WORD } from './crm-vocabulary';
import { numberFieldWords } from './number-field';
import { PROVENANCE_TIER_WORD } from './provenance';
import { SHELL } from './shell';

type T = Translator['t'];

const OWNER = {
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
  waitingLongest: /*i18n*/ {
    id: '{count, plural, one {# deal waiting longest} other {# deals waiting longest}}',
  },
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
    id: '{name} · {days, plural, one {# day in {stage}} other {# days in {stage}}}',
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
  forecastTitle: /*i18n*/ { id: 'Forecast' },
  forecastGap: /*i18n*/ { id: 'Starts with proposals' },
  forecastNote: /*i18n*/ {
    id: 'Weighted by stage once proposals carry prices. Expected, not promised — never added to won.',
  },
  pipelineTitle: /*i18n*/ { id: 'Pipeline by stage' },
  openLeads: /*i18n*/ { id: '{count, plural, one {# open lead} other {# open leads}}' },
  valuesGap: /*i18n*/ { id: 'Stage values come with proposals.' },
  medianWon: /*i18n*/ {
    id: '{of, plural, one {Won deal: {amount}} other {Middle won deal: {amount} of #}}',
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
  csvSection: /*i18n*/ { id: 'Section' },
  csvFigure: /*i18n*/ { id: 'Figure' },
  csvValue: /*i18n*/ { id: 'Value' },
  csvNote: /*i18n*/ { id: 'Note' },
  csvTakenOn: /*i18n*/ { id: 'Taken on {day}' },
  csvLastMonth: /*i18n*/ { id: 'Last month' },
} satisfies Record<string, MessageRef>;

const NEED_TITLE: Record<NeedsYouKind, MessageRef> = {
  unassigned: OWNER.unassigned,
  payments_late: OWNER.paymentsLate,
  blocked_on_us: OWNER.blockedOnUs,
  waiting_longest: OWNER.waitingLongest,
  my_overdue_tasks: OWNER.myOverdueTasks,
};

const NEED_ACT: Record<NeedsYouKind, MessageRef> = {
  unassigned: OWNER.assign,
  payments_late: OWNER.open,
  blocked_on_us: OWNER.open,
  waiting_longest: OWNER.review,
  my_overdue_tasks: OWNER.openMyDay,
};

/** The owner dashboard's words (`OwnerDashboardWords`). */
export function ownerDashboardWords(t: T) {
  return {
    needsYouNow: t(OWNER.needsYouNow),
    position: (at: number, of: number) => t(OWNER.position, { at, of }),
    needTitle: (kind: NeedsYouKind, count: number) => t(NEED_TITLE[kind], { count }),
    unassignedLine: (hours: number) => t(OWNER.unassignedLine, { hours }),
    lateLine: (amount: string, days: number) => t(OWNER.lateLine, { amount, days }),
    blockedLine: (name: string, days: number) => t(OWNER.blockedLine, { name, days }),
    waitingLine: (name: string, stage: LeadStage, days: number) =>
      t(OWNER.waitingLine, { name, stage: t(LEAD_STAGE_WORD[stage]), days }),
    myTasksLine: t(OWNER.myTasksLine),
    needAct: (kind: NeedsYouKind) => t(NEED_ACT[kind]),
    nextNeed: t(OWNER.nextNeed),
    allClearTitle: t(OWNER.allClearTitle),
    allClearBody: t(OWNER.allClearBody),
    cashTitle: t(OWNER.cashTitle),
    soFarThisMonth: t(OWNER.soFarThisMonth),
    vsLastMonth: (amount: string) => t(OWNER.vsLastMonth, { amount }),
    toCollect: t(OWNER.toCollect),
    late: (count: number) => t(OWNER.late, { count }),
    wonSoFar: t(OWNER.wonSoFar),
    wonDeals: (count: number) => t(OWNER.wonDeals, { count }),
    percent: (value: string): string => t(OWNER.percent, { value }),
    ofTarget: (share: string, target: string) => t(OWNER.ofTarget, { share, target }),
    noTarget: t(OWNER.noTarget),
    setTarget: t(OWNER.setTarget),
    editTarget: t(OWNER.editTarget),
    targetLabel: t(OWNER.targetLabel),
    saveTarget: t(OWNER.saveTarget),
    clearTarget: t(OWNER.clearTarget),
    cancel: t(OWNER.cancel),
    targetFailed: t(OWNER.targetFailed),
    forecastTitle: t(OWNER.forecastTitle),
    forecastGap: t(OWNER.forecastGap),
    forecastNote: t(OWNER.forecastNote),
    pipelineTitle: t(OWNER.pipelineTitle),
    openLeads: (count: number) => t(OWNER.openLeads, { count }),
    stage: (stage: LeadStage) => t(LEAD_STAGE_WORD[stage]),
    valuesGap: t(OWNER.valuesGap),
    medianWon: (amount: string, of: number) => t(OWNER.medianWon, { amount, of }),
    winLossTitle: t(OWNER.winLossTitle),
    windowDays: (days: number) => t(OWNER.windowDays, { days }),
    winRate: (rate: string) => t(OWNER.winRate, { rate }),
    tooFew: (won: number, lost: number) => t(OWNER.tooFew, { won, lost }),
    wonLost: (won: number, lost: number) => t(OWNER.wonLost, { won, lost }),
    lostReason: (reason: LostReason) => t(LOST_REASON_WORD[reason]),
    noLosses: t(OWNER.noLosses),
    export: t(OWNER.export),
    teamScope: t(OWNER.teamScope),
    numberField: numberFieldWords(t),
    loading: t(OWNER.loading),
    failedTitle: t(OWNER.failedTitle),
    failedMessage: t(OWNER.failedMessage),
    retry: t(SHELL.tryAgain),
  };
}

/** How the export writes a figure: money in the tenant's grouping, a share as a percent. */
export interface DashboardCsvFormat {
  readonly money: (amount: string) => string;
  readonly percent: (basisPoints: number) => string;
  readonly day: (date: string) => string;
}

/**
 * The dashboard as a CSV (`M13-52`…`M13-54`): the same scoped figures the screen read, each beside
 * its provenance and caveat — "so far this month", "expected, not promised", the median's n — so
 * an export never says less than the screen. Built from the read the screen already holds, so it
 * can never carry a row the reader could not see.
 */
export function ownerDashboardCsv(
  t: T,
  view: OwnerDashboard,
  winRate: WinRate,
  format: DashboardCsvFormat,
): string {
  const tier = (key: 'measured' | 'derived' | 'estimated') => t(PROVENANCE_TIER_WORD[key]);
  const soFar = t(OWNER.soFarThisMonth);
  const cash = t(OWNER.cashTitle);
  const won = t(OWNER.wonSoFar);
  const pipeline = t(OWNER.pipelineTitle);
  const lost = t(OWNER.winLossTitle);
  const counts = new Map(view.pipeline.map((row) => [row.stage, row.count]));
  const needs = view.needsYou;
  const need = t(OWNER.needsYouNow);
  const rows: string[][] = [
    [t(OWNER.csvTakenOn, { day: format.day(view.today) })],
    [t(OWNER.csvSection), t(OWNER.csvFigure), t(OWNER.csvValue), t(OWNER.csvNote)],
    [need, t(NEED_TITLE.unassigned, { count: needs.unassigned.count }), '', ''],
    [
      need,
      t(NEED_TITLE.payments_late, { count: needs.paymentsLate.count }),
      format.money(needs.paymentsLate.amount),
      '',
    ],
    [need, t(NEED_TITLE.blocked_on_us, { count: needs.blockedOnUs.count }), '', ''],
    ...needs.waitingLongest.map((lead) => [
      need,
      t(OWNER.waitingLine, {
        name: lead.name ?? '',
        stage: t(LEAD_STAGE_WORD[lead.stage]),
        days: lead.days,
      }),
      '',
      '',
    ]),
    [need, t(NEED_TITLE.my_overdue_tasks, { count: needs.myOverdueTasks }), '', ''],
    [cash, soFar, format.money(view.cash.collectedThisMonth), tier('measured')],
    [cash, t(OWNER.csvLastMonth), format.money(view.cash.collectedLastMonth), tier('measured')],
    [cash, t(OWNER.toCollect), format.money(view.cash.toCollect), tier('derived')],
    [cash, t(OWNER.late, { count: view.cash.late.count }), format.money(view.cash.late.amount), ''],
    [won, soFar, format.money(view.won.thisMonth.amount), tier('derived')],
    [won, t(OWNER.wonDeals, { count: view.won.thisMonth.count }), '', ''],
    [won, t(OWNER.csvLastMonth), format.money(view.won.lastMonth.amount), tier('derived')],
    ...(view.won.median === null
      ? []
      : [
          [
            won,
            t(OWNER.medianWon, {
              amount: format.money(view.won.median.amount),
              of: view.won.median.of,
            }),
            format.money(view.won.median.amount),
            tier('derived'),
          ],
        ]),
    [
      t(OWNER.targetLabel),
      '',
      view.target === null ? t(OWNER.noTarget) : format.money(view.target.amount),
      '',
    ],
    [t(OWNER.forecastTitle), '', t(OWNER.forecastGap), t(OWNER.forecastNote)],
    ...LEAD_STAGES.filter((stage) => stage !== 'won').map((stage) => [
      pipeline,
      t(LEAD_STAGE_WORD[stage]),
      String(counts.get(stage) ?? 0),
      '',
    ]),
    [pipeline, '', '', t(OWNER.valuesGap)],
    [
      lost,
      t(OWNER.windowDays, { days: view.winLoss.windowDays }),
      winRate.kind === 'rate'
        ? t(OWNER.winRate, { rate: format.percent(winRate.basisPoints) })
        : t(OWNER.tooFew, { won: winRate.won, lost: winRate.lost }),
      t(OWNER.wonLost, { won: view.winLoss.won, lost: view.winLoss.lost }),
    ],
    ...view.winLoss.lostReasons.map((row) => [
      lost,
      t(LOST_REASON_WORD[row.reason]),
      String(row.count),
      '',
    ]),
  ];
  return csvText(rows);
}
