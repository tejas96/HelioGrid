import type {
  BillingUsage,
  BillingUsageSignals,
  TenantOwners,
  TranslatedText,
  UsageEventMeter,
} from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { BillingChip, BillingValue } from '../BillingHome/BillingHome.types';
import type { BillingViewWords } from '../BillingHome/BillingHome.words';
import type { DataTableWords } from '../DataTable/DataTable.types';
import type { UsageMeterWords, UsageState } from '../UsageMeter/UsageMeter.types';

/** The rows the usage screen draws (`SCR-M12-04`); the V2 meters join with their modules. */
export type UsageRowKey = 'proposals' | 'projects' | 'design' | 'voice' | 'storage' | 'otp';

/** A `Needs you` row (decision 3): the name, its own chip, used of included, and ONE line. */
export interface UsageNeedRow {
  readonly key: UsageRowKey;
  readonly title: TranslatedText;
  readonly chip: BillingChip;
  /** Used of included; `null` for a person who is not the Owner, who sees no figure (`M12-56`). */
  readonly figure: string | null;
  /** What happens next and when, wrapped whole and toned; `null` for a person who is not the Owner. */
  readonly line: BillingValue | null;
  readonly tone: 'warning' | 'danger' | 'info';
}

/** A meter as `UsageMeter` draws it — the props this screen decides. */
export interface UsageMeterView {
  /** `undefined` while the rollup is out: the meter draws its wait, never a placeholder figure. */
  readonly value: number | undefined;
  readonly limit: number | null;
  readonly unit: TranslatedText | null;
  readonly period: string | null;
  readonly state: UsageState;
  readonly graceDaysLeft: number | null;
  readonly note: TranslatedText | null;
  readonly noLimitNote: TranslatedText | null;
  /** Off for a meter in `Needs you`, which says it there (decision 3). */
  readonly statusLine: boolean;
}

/** A sub-fact under a meter, label left and figure right: `So far`, `Charges`, a ceiling. */
export interface UsageFactView {
  readonly key: string;
  readonly label: TranslatedText;
  /** The figure, mono where it is money or energy (`F7-09`); `null` where a chip stands. */
  readonly value: BillingValue | null;
  readonly chip: BillingChip | null;
}

/** One row of a card at 375: a meter, its sub-facts, its events and its way to a bigger plan. */
export interface UsageRowView {
  readonly key: UsageRowKey;
  readonly label: TranslatedText;
  readonly meter: UsageMeterView | null;
  readonly facts: readonly UsageFactView[];
  /** The meter whose events the row's chevron opens (decision 6); `null` for a count or a gauge. */
  readonly ledger: UsageEventMeter | null;
  /** `Bigger plans` under the meter at its cap or paused (decision 12). */
  readonly plans: boolean;
}

/** A card: `Limits` or `Included each month`, its rows, and its two quiet source lines. */
export interface UsageRegionView {
  readonly title: TranslatedText;
  readonly rows: readonly UsageRowView[];
  /** `null` while the rollup is out: a source line labels figures, and none are drawn yet. */
  readonly sources: readonly TranslatedText[] | null;
}

/** A row of the 1536 tables (decision 7). Each cell is text; the meter's chip rides its name. */
export interface UsageTableRow {
  readonly key: UsageRowKey;
  readonly label: TranslatedText;
  readonly chip: BillingChip | null;
  readonly used: string;
  /** Storage's `As of` under its figure (`DataTable` column `sub`). */
  readonly usedSub: string | null;
  readonly included: string;
  readonly rate: BillingValue;
  /** `Not published yet` where the book has no rate — never a zero. */
  readonly rateGap: TranslatedText | null;
  readonly charges: string;
  readonly ledger: UsageEventMeter | null;
  readonly plans: boolean;
}

/** The page, read: everything both halves draw. */
export interface UsagePageView {
  /** The cycle every count covers and its reset; `null` where no figure is drawn. */
  readonly cycleLine: TranslatedText | null;
  /** The one status chip (decision 2); `null` while loading or failed. */
  readonly chip: BillingChip | null;
  readonly needs: readonly UsageNeedRow[] | null;
  /** `Nothing used yet`: every cap still visible below it. */
  readonly teaching: { readonly title: TranslatedText; readonly body: TranslatedText } | null;
  readonly limits: UsageRegionView | null;
  readonly included: UsageRegionView | null;
  readonly tables: {
    readonly limits: readonly UsageTableRow[];
    readonly included: readonly UsageTableRow[];
    readonly limitsCaption: TranslatedText;
    readonly includedCaption: TranslatedText;
  } | null;
  /** `This cycle` at 1536: the cycle and its reset, as facts. */
  readonly cycle: { readonly range: string; readonly resets: string } | null;
  readonly extra: { readonly total: string; readonly billsOn: string } | null;
  /** `Bigger plans` or, on a trial, `Pick a plan`; `null` for a person who is not the Owner. */
  readonly plans: {
    readonly title: TranslatedText;
    readonly subtitle: TranslatedText | null;
  } | null;
  /** Whose screen this is, for a person who is not the Owner (`M12-56`). */
  readonly scope: TranslatedText | null;
}

/** One ledger event as the panel lists it: the site or the person, when, and its figure. */
export interface UsageEventRow {
  readonly key: string;
  /** The person a code signed in, by their own name, else the event's kind in words. */
  // biome-ignore lint/plugin/copy-prop-type: a person's name, a fact of the event
  readonly title: string;
  /** When it was recorded — `15 Sept 2026, 17:42`. */
  readonly subtitle: TranslatedText;
  readonly figure: string | null;
}

/** The events panel of one meter (`M12-36`): a sheet at 375, a side panel at 1536 (`F7-21`). */
export interface UsageLedgerView {
  readonly title: TranslatedText;
  readonly subtitle: TranslatedText;
  readonly read: Read<readonly UsageEventRow[]>;
  readonly emptyTitle: TranslatedText;
  readonly emptyMessage: TranslatedText;
  /** More rows than this page holds: one more page on press. */
  readonly more: boolean;
}

/** The words the logic says, in the reader's language — `@heliogrid/i18n`'s `usagePageWords`. */
export interface UsageViewWords {
  readonly view: BillingViewWords;
  readonly needsYou: TranslatedText;
  readonly limits: TranslatedText;
  readonly included: TranslatedText;
  readonly proposals: TranslatedText;
  readonly otpCodes: TranslatedText;
  readonly minutes: TranslatedText;
  readonly chips: {
    readonly within: TranslatedText;
    readonly nearing: TranslatedText;
    readonly past: TranslatedText;
    readonly trial: TranslatedText;
    readonly atLimit: TranslatedText;
    readonly paused: TranslatedText;
  };
  readonly atTheCap: TranslatedText;
  readonly paused: TranslatedText;
  readonly soFar: TranslatedText;
  readonly charges: TranslatedText;
  readonly notBilled: TranslatedText;
  readonly payAsYouGo: TranslatedText;
  readonly trackedOnly: TranslatedText;
  readonly noLimitTrial: TranslatedText;
  readonly biggerPlans: TranslatedText;
  readonly pickAPlan: TranslatedText;
  readonly nothingUsedTitle: TranslatedText;
  readonly nothingUsedBody: TranslatedText;
  readonly callTitle: TranslatedText;
  readonly codeTitle: TranslatedText;
  readonly noCalls: { readonly title: TranslatedText; readonly body: TranslatedText };
  readonly noCodes: { readonly title: TranslatedText; readonly body: TranslatedText };
  /** A cycle's first and last day — `1 Sept 2026 – 30 Sept 2026`. */
  range(from: string, to: string): TranslatedText;
  /** The plans above this one — `Pro · Enterprise`. */
  plansAbove(plans: readonly TranslatedText[]): TranslatedText;
  cycleLine(range: string, resets: string): TranslatedText;
  trialLine(days: number, range: string): TranslatedText;
  percentUsed(percent: number): TranslatedText;
  usedOf(used: string, limit: string, unit: TranslatedText | null): TranslatedText;
  noLimitOn(plan: TranslatedText): TranslatedText;
  aMonth(count: string): TranslatedText;
  rateAMinute(rate: string): TranslatedText;
  rateBeyond(rate: string, bundle: string): TranslatedText;
  minutesFigure(count: string): TranslatedText;
  gbFigure(count: string): TranslatedText;
  limitsAndRates(priceList: TranslatedText): TranslatedText;
  asOf(date: string, time: string): TranslatedText;
  /** The tables' captions; `plan` is `null` on a trial, which holds no plan. */
  limitsCaption(plan: TranslatedText | null, cycle: string): TranslatedText;
  includedCaption(plan: TranslatedText | null, cycle: string): TranslatedText;
  scope(owners: TenantOwners | null): TranslatedText | null;
  /** The lines of `Needs you`, a rate in a sentence as `FIGURE_SLOT`. */
  readonly lines: {
    bundleWarning(bundle: string): TranslatedText;
    capWarning(): TranslatedText;
    trialVoiceWarning(): TranslatedText;
    grace(date: string): TranslatedText;
    paused(date: string): TranslatedText;
    trialVoicePaused(date: string): TranslatedText;
    storageWarning(ceiling: string): TranslatedText;
    storagePaused(): TranslatedText;
  };
  eventsSubtitleMinutes(cycle: string, minutes: string): TranslatedText;
  eventsSubtitleCodes(cycle: string, count: number): TranslatedText;
  callDuration(minutes: string, seconds: string): TranslatedText;
  eventAt(date: string, time: string): TranslatedText;
}

/** The words only the markup says. */
export interface UsagePageWords {
  readonly needsYou: TranslatedText;
  readonly loading: TranslatedText;
  readonly errorTitle: TranslatedText;
  readonly errorMessage: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly thisCycle: TranslatedText;
  readonly cycle: TranslatedText;
  readonly resets: TranslatedText;
  readonly extraCharges: TranslatedText;
  readonly soFar: TranslatedText;
  readonly billsOn: TranslatedText;
  readonly eventsThisCycle: TranslatedText;
  readonly actualUsage: TranslatedText;
  readonly eventsFailed: TranslatedText;
  readonly eventsLoading: TranslatedText;
  readonly showMore: TranslatedText;
  readonly close: TranslatedText;
  readonly columns: {
    readonly limit: TranslatedText;
    readonly used: TranslatedText;
    readonly allowed: TranslatedText;
    readonly meter: TranslatedText;
    readonly included: TranslatedText;
    readonly rate: TranslatedText;
    readonly charges: TranslatedText;
  };
  readonly usageMeter: UsageMeterWords;
  readonly table: DataTableWords;
  /** The ledger chevron's name — `Voice minutes — events this cycle`. */
  eventsOf(meter: TranslatedText): TranslatedText;
}

export interface UsagePageActs {
  /** `Bigger plans` / `Pick a plan` — the one way to a bigger plan, `SCR-M12-03` (decision 8). */
  onPlans(): void;
  onLedger(meter: UsageEventMeter): void;
  onCloseLedger(): void;
  onMoreEvents(): void;
}

export interface UsagePageProps {
  readonly words: UsagePageWords;
  /** The page's one read; failed carries its own retry (`T-SHELL-013`). */
  readonly read: Read<UsagePageView>;
  /**
   * The view as far as it is known while the read is out or failed: the list's own facts and,
   * for the Owner, `Bigger plans` (decision 15).
   */
  readonly waiting: UsagePageView;
  /** One column at 375, two lanes at width (decision 14). */
  readonly layout: 'column' | 'columns';
  /** The meter whose events stand open, and its panel; `null` while none. */
  readonly ledger: { readonly meter: UsageEventMeter; readonly view: UsageLedgerView } | null;
  readonly acts: UsagePageActs;
}

/** The page's facts: the Owner's usage, or which meter is at its cap and whose screen this is. */
export type UsagePageFacts =
  | { readonly kind: 'owner'; readonly usage: BillingUsage }
  | {
      readonly kind: 'member';
      readonly signals: BillingUsageSignals;
      readonly owners: TenantOwners | null;
    };

/** What every builder reads. */
export interface UsageInput {
  readonly words: UsageViewWords;
  readonly format: MarketFormat;
  /** The market's name in the reader's language — the price list's source line. */
  readonly marketName: string;
  readonly now: number;
}
