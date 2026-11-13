/**
 * The owner dashboard as a CSV, with every label beside its figure (`M13-53`): the dashboard's own
 * words (`owner-dashboard.ts`) plus the few only the export says.
 */
import type { OwnerDashboard } from '@heliogrid/contracts';
import { csvText, LEAD_STAGES, type WinRate } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { LEAD_STAGE_WORD, LOST_REASON_WORD } from './crm-vocabulary';
import { NEEDS_YOU_TITLE, OWNER_DASHBOARD, waitingLineOf } from './owner-dashboard';
import { PROVENANCE_TIER_WORD } from './provenance';

type T = Translator['t'];

const CSV = {
  section: /*i18n*/ { id: 'Section' },
  figure: /*i18n*/ { id: 'Figure' },
  value: /*i18n*/ { id: 'Value' },
  note: /*i18n*/ { id: 'Note' },
  takenOn: /*i18n*/ { id: 'Taken on {day}' },
  lastMonth: /*i18n*/ { id: 'Last month' },
  late: /*i18n*/ { id: 'Late' },
  median: /*i18n*/ { id: '{of, plural, one {Won deal} other {Middle of # won deals}}' },
} satisfies Record<string, MessageRef>;

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
  const soFar = t(OWNER_DASHBOARD.soFarThisMonth);
  const cash = t(OWNER_DASHBOARD.cashTitle);
  const won = t(OWNER_DASHBOARD.wonSoFar);
  const pipeline = t(OWNER_DASHBOARD.pipelineTitle);
  const lost = t(OWNER_DASHBOARD.winLossTitle);
  const counts = new Map(view.pipeline.map((row) => [row.stage, row.count]));
  const needs = view.needsYou;
  const need = t(OWNER_DASHBOARD.needsYouNow);
  const rows: string[][] = [
    [t(CSV.section), t(CSV.figure), t(CSV.value), t(CSV.note)],
    ...(needs.unassigned.count === 0
      ? []
      : [[need, t(NEEDS_YOU_TITLE.unassigned, { count: needs.unassigned.count }), '', '']]),
    ...(needs.paymentsLate.count === 0
      ? []
      : [
          [
            need,
            t(NEEDS_YOU_TITLE.payments_late, { count: needs.paymentsLate.count }),
            format.money(needs.paymentsLate.amount),
            '',
          ],
        ]),
    ...(needs.blockedOnUs.count === 0
      ? []
      : [[need, t(NEEDS_YOU_TITLE.blocked_on_us, { count: needs.blockedOnUs.count }), '', '']]),
    ...needs.waitingLongest.map((lead) => [
      need,
      t(NEEDS_YOU_TITLE.waiting_longest),
      '',
      waitingLineOf(t, lead.name, lead.stage, lead.days),
    ]),
    ...(needs.myOverdueTasks === 0
      ? []
      : [[need, t(NEEDS_YOU_TITLE.my_overdue_tasks, { count: needs.myOverdueTasks }), '', '']]),
    [cash, soFar, format.money(view.cash.collectedThisMonth), tier('measured')],
    [cash, t(CSV.lastMonth), format.money(view.cash.collectedLastMonth), tier('measured')],
    [cash, t(OWNER_DASHBOARD.toCollect), format.money(view.cash.toCollect), tier('derived')],
    [
      cash,
      t(CSV.late),
      format.money(view.cash.late.amount),
      t(NEEDS_YOU_TITLE.payments_late, { count: view.cash.late.count }),
    ],
    [won, soFar, format.money(view.won.thisMonth.amount), tier('derived')],
    [won, t(OWNER_DASHBOARD.wonDeals, { count: view.won.thisMonth.count }), '', ''],
    [won, t(CSV.lastMonth), format.money(view.won.lastMonth.amount), tier('derived')],
    ...(view.won.median === null
      ? []
      : [
          [
            won,
            t(CSV.median, { of: view.won.median.of }),
            format.money(view.won.median.amount),
            tier('derived'),
          ],
        ]),
    [
      t(OWNER_DASHBOARD.targetLabel),
      '',
      view.target === null ? '' : format.money(view.target.amount),
      view.target === null ? t(OWNER_DASHBOARD.noTarget) : '',
    ],
    [
      t(OWNER_DASHBOARD.forecastTitle),
      '',
      t(OWNER_DASHBOARD.forecastGap),
      t(OWNER_DASHBOARD.forecastNote),
    ],
    ...LEAD_STAGES.filter((stage) => stage !== 'won').map((stage) => [
      pipeline,
      t(LEAD_STAGE_WORD[stage]),
      String(counts.get(stage) ?? 0),
      '',
    ]),
    [pipeline, '', '', t(OWNER_DASHBOARD.valuesGap)],
    [
      lost,
      t(OWNER_DASHBOARD.windowDays, { days: view.winLoss.windowDays }),
      winRate.kind === 'rate' ? format.percent(winRate.basisPoints) : '',
      winRate.kind === 'rate'
        ? t(OWNER_DASHBOARD.wonLost, { won: winRate.won, lost: winRate.lost })
        : t(OWNER_DASHBOARD.tooFew, { won: winRate.won, lost: winRate.lost }),
    ],
    ...view.winLoss.lostReasons.map((row) => [
      lost,
      t(LOST_REASON_WORD[row.reason]),
      String(row.count),
      '',
    ]),
    [t(CSV.takenOn, { day: format.day(view.today) })],
  ];
  return csvText(rows);
}
