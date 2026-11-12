import type { OwnerDashboard, TranslatedText } from '@heliogrid/contracts';
import type { LeadStage, LostReason, NeedsYouKind, Read, WinRate } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/**
 * The owner dashboard's words (`SCR-M13-01`), built in `packages/i18n` (`ownerDashboardWords`).
 * Every figure arrives already formatted; a word beside a value is one message with it.
 */
export interface OwnerDashboardWords {
  readonly needsYouNow: TranslatedText;
  readonly position: (at: number, of: number) => TranslatedText;
  /** Each attention item's headline, its count in it where it has one. */
  readonly needTitle: (kind: NeedsYouKind, count: number) => TranslatedText;
  readonly unassignedLine: (hours: number) => TranslatedText;
  readonly lateLine: (amount: string, days: number) => TranslatedText;
  readonly blockedLine: (name: string, days: number) => TranslatedText;
  readonly waitingLine: (name: string, stage: LeadStage, days: number) => TranslatedText;
  readonly myTasksLine: TranslatedText;
  /** The act each item opens: Assign, Open, Review, Open My Day. */
  readonly needAct: (kind: NeedsYouKind) => TranslatedText;
  readonly nextNeed: TranslatedText;
  readonly allClearTitle: TranslatedText;
  readonly allClearBody: TranslatedText;
  readonly cashTitle: TranslatedText;
  readonly soFarThisMonth: TranslatedText;
  readonly vsLastMonth: (amount: string) => TranslatedText;
  readonly toCollect: TranslatedText;
  readonly late: (count: number) => TranslatedText;
  readonly wonSoFar: TranslatedText;
  readonly wonDeals: (count: number) => TranslatedText;
  /** A share already formatted as a number (`format.number`), with its percent sign in place. */
  // biome-ignore lint/plugin/copy-prop-type: a figure — it fills a ring's centre and another sentence, never stands as words
  readonly percent: (value: string) => string;
  readonly ofTarget: (share: string, target: string) => TranslatedText;
  readonly noTarget: TranslatedText;
  readonly setTarget: TranslatedText;
  readonly editTarget: TranslatedText;
  readonly targetLabel: TranslatedText;
  readonly saveTarget: TranslatedText;
  readonly clearTarget: TranslatedText;
  readonly cancel: TranslatedText;
  readonly targetFailed: TranslatedText;
  /** The device's refusals of a typed target, said on the field before anything is sent. */
  readonly targetNotPositive: TranslatedText;
  readonly targetTooLarge: TranslatedText;
  /** An amount finer than the currency's minor unit: at most `digits` places. */
  readonly targetTooFine: (digits: number) => TranslatedText;
  /** The inline target field's own words (`numberFieldWords`). */
  readonly numberField: NumberFieldWords;
  readonly forecastTitle: TranslatedText;
  readonly forecastGap: TranslatedText;
  readonly forecastNote: TranslatedText;
  readonly pipelineTitle: TranslatedText;
  readonly openLeads: (count: number) => TranslatedText;
  readonly stage: (stage: LeadStage) => TranslatedText;
  readonly valuesGap: TranslatedText;
  readonly medianWon: (amount: string, of: number) => TranslatedText;
  readonly winLossTitle: TranslatedText;
  readonly windowDays: (days: number) => TranslatedText;
  readonly winRate: (rate: string) => TranslatedText;
  readonly tooFew: (won: number, lost: number) => TranslatedText;
  readonly wonLost: (won: number, lost: number) => TranslatedText;
  readonly lostReason: (reason: LostReason) => TranslatedText;
  readonly noLosses: TranslatedText;
  readonly export: TranslatedText;
  readonly teamScope: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/** Which record an attention item opens. */
export type NeedOpen =
  | { readonly kind: 'unassigned' }
  | { readonly kind: 'payments_late'; readonly projectId: string }
  | { readonly kind: 'blocked_on_us'; readonly projectId: string }
  | { readonly kind: 'waiting_longest'; readonly leadId: string }
  | { readonly kind: 'my_overdue_tasks' };

/**
 * The owner dashboard (`SCR-M13-01`, `M13-14`…`M13-20`): the hero is what needs you now — one item
 * at a time with its act, the rest one tap on — then cash (collected so far, to collect, late),
 * won so far against the inline target, the forecast's honest gap until proposals price the
 * pipeline, the pipeline by stage, and win/loss on closed deals. Read-only, save the target.
 */
export interface OwnerDashboardProps {
  readonly read: Exclude<Read<OwnerDashboard>, { readonly kind: 'empty' }>;
  readonly words: OwnerDashboardWords;
  readonly needsYou: readonly NeedsYouKind[];
  readonly winRate: WinRate | null;
  readonly onNeed: (open: NeedOpen) => void;
  readonly onSetTarget: (amount: string | null) => void;
  readonly targetSaving: boolean;
  readonly targetFailed: boolean;
  readonly onExport: () => void;
  readonly focusAfter: FocusAfter;
}
