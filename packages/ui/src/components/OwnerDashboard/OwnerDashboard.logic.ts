import type { OwnerDashboard, TranslatedText } from '@heliogrid/contracts';
import type { LeadStage, LostReason, NeedsYouKind } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HueTileProps } from '../HueTile/HueTile.types';
import type { NeedOpen, OwnerDashboardProps, OwnerDashboardWords } from './OwnerDashboard.types';

/** What each part of the dashboard takes: the props and the read's value. */
export type DashboardPartProps = OwnerDashboardProps & { readonly view: OwnerDashboard };

/** One attention item as both halves draw it: its mark, headline, line and the act it opens. */
export interface NeedItem {
  readonly kind: NeedsYouKind;
  readonly glyph: ShellGlyphName;
  readonly hue: HueTileProps['hue'];
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly act: TranslatedText;
  readonly open: NeedOpen;
}

/** Each kind's mark: glyph and tint together, never the tint alone (`F7-12`). */
const NEED_MARK: Record<NeedsYouKind, Pick<NeedItem, 'glyph' | 'hue'>> = {
  unassigned: { glyph: 'user-plus', hue: 'warning' },
  payments_late: { glyph: 'rupee', hue: 'danger' },
  blocked_on_us: { glyph: 'blocked', hue: 'ocean' },
  waiting_longest: { glyph: 'clock', hue: 'plum' },
  my_overdue_tasks: { glyph: 'flag', hue: 'danger' },
};

type Needs = OwnerDashboard['needsYou'];

function countOf(kind: NeedsYouKind, needs: Needs): number {
  switch (kind) {
    case 'unassigned':
      return needs.unassigned.count;
    case 'payments_late':
      return needs.paymentsLate.count;
    case 'blocked_on_us':
      return needs.blockedOnUs.count;
    case 'waiting_longest':
      return needs.waitingLongest.length;
    case 'my_overdue_tasks':
      return needs.myOverdueTasks;
  }
}

/**
 * The item's detail line and what its act opens — `null` when the read names nothing to open (a
 * blocked count with no oldest project, a waiting list that came back empty): such an item is left
 * out rather than offering an act that leads nowhere.
 */
function detailOf(
  kind: NeedsYouKind,
  needs: Needs,
  words: OwnerDashboardWords,
  money: (amount: string) => string,
): { readonly line: TranslatedText; readonly open: NeedOpen } | null {
  switch (kind) {
    case 'unassigned':
      return {
        line: words.unassignedLine(needs.unassigned.oldestHours ?? 0),
        open: { kind },
      };
    case 'payments_late': {
      const late = needs.paymentsLate;
      if (late.oldestProjectId === null) return null;
      return {
        line: words.lateLine(money(late.amount), late.oldestDays ?? 0),
        open: { kind, projectId: late.oldestProjectId },
      };
    }
    case 'blocked_on_us': {
      const oldest = needs.blockedOnUs.oldest;
      if (oldest === null) return null;
      return {
        line: words.blockedLine(oldest.name ?? '', oldest.days),
        open: { kind, projectId: oldest.projectId },
      };
    }
    case 'waiting_longest': {
      const [first] = needs.waitingLongest;
      if (first === undefined) return null;
      return {
        line: words.waitingLine(first.name ?? '', first.stage, first.days),
        open: { kind, leadId: first.leadId },
      };
    }
    case 'my_overdue_tasks':
      return { line: words.myTasksLine, open: { kind } };
  }
}

/** The attention items in the order the caller decided (`needsYouKindsOf`), each ready to draw. */
export function needItemsOf(
  needs: Needs,
  kinds: readonly NeedsYouKind[],
  words: OwnerDashboardWords,
  money: (amount: string) => string,
): readonly NeedItem[] {
  return kinds.flatMap((kind) => {
    const detail = detailOf(kind, needs, words, money);
    if (detail === null) return [];
    return [
      {
        kind,
        ...NEED_MARK[kind],
        title: words.needTitle(kind, countOf(kind, needs)),
        act: words.needAct(kind),
        ...detail,
      },
    ];
  });
}

/** The item after `at`, round to the first after the last. */
export function nextNeedAt(at: number, count: number): number {
  return count === 0 ? 0 : (at + 1) % count;
}

/**
 * Won so far against the target as a display ratio for the bar and its words, 0 to 1 — never a
 * money figure. `null` when no target is set or it is zero.
 */
export function targetShareOf(view: OwnerDashboard): number | null {
  if (view.target === null) return null;
  const target = Number(view.target.amount);
  if (!(target > 0)) return null;
  return Math.min(1, Math.max(0, Number(view.won.thisMonth.amount) / target));
}

/** A share, 0 to 1, as the reader's percent — `74%`. */
export function percentOf(share: number, words: OwnerDashboardWords, format: MarketFormat): string {
  return words.percent(format.number(share * 100, { maximumFractionDigits: 0 }));
}

/** Basis points in one whole: 10 000 bp is 100%. */
const BASIS_POINTS_WHOLE = 10_000;

/** A rate in basis points as the reader's percent — the win rate, on screen and in the export. */
export function percentOfBasisPoints(
  basisPoints: number,
  words: OwnerDashboardWords,
  format: MarketFormat,
): string {
  return percentOf(basisPoints / BASIS_POINTS_WHOLE, words, format);
}

/** One bar of a card's chart: its words, its count, and its length against the longest. */
export interface DashBar {
  readonly key: string;
  readonly label: TranslatedText;
  readonly count: number;
  readonly share: number;
  readonly tone: 'accent' | 'danger' | 'neutral';
}

function shareAgainst(count: number, longest: number): number {
  return longest === 0 ? 0 : count / longest;
}

/** The pipeline's bars, stage by stage in the funnel's order, and how many leads are open. */
export function pipelineBarsOf(
  pipeline: OwnerDashboard['pipeline'],
  stageWord: (stage: LeadStage) => TranslatedText,
): { readonly bars: readonly DashBar[]; readonly open: number } {
  const longest = Math.max(0, ...pipeline.map((row) => row.count));
  return {
    open: pipeline.reduce((sum, row) => sum + row.count, 0),
    bars: pipeline.map((row) => ({
      key: row.stage,
      label: stageWord(row.stage),
      count: row.count,
      share: shareAgainst(row.count, longest),
      tone: 'accent',
    })),
  };
}

/** Why deals were lost, the commonest first: its bar the danger tone, the rest neutral. */
export function lostBarsOf(
  reasons: OwnerDashboard['winLoss']['lostReasons'],
  reasonWord: (reason: LostReason) => TranslatedText,
): readonly DashBar[] {
  const sorted = [...reasons].filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
  const longest = sorted[0]?.count ?? 0;
  return sorted.map((row, index) => ({
    key: row.reason,
    label: reasonWord(row.reason),
    count: row.count,
    share: shareAgainst(row.count, longest),
    tone: index === 0 ? 'danger' : 'neutral',
  }));
}
