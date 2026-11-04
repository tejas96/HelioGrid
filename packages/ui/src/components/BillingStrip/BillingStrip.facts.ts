import type {
  BillingHome,
  BillingStanding,
  BillingUsage,
  BillingUsageSignals,
  TranslatedText,
} from '@heliogrid/contracts';
import type { BillingStripAudience } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type {
  BillingStripGo,
  BillingStripRow,
  BillingStripView,
  BillingStripWords,
} from './BillingStrip.types';
import { figure, figured, plain } from './BillingStrip.values';

/** What the strip is built from: the standing everyone reads, and the Owner's figures. */
export interface BillingStripFacts {
  readonly standing: BillingStanding;
  /** Which meters stand at their cap; empty where the page does not read them. */
  readonly signals: BillingUsageSignals['signals'];
  readonly audience: BillingStripAudience;
  /** The Owner's billing home: the amount owed, its invoice and the way to pay. */
  readonly home: BillingHome | null;
  /** The Owner's counts this cycle, read only while a meter stands at its cap. */
  readonly usage: BillingUsage | null;
  /** The mandate's rail in the reader's words — the day-6 act names it (`M12-10`). */
  readonly methodName: TranslatedText | null;
  /** Whose act it is, for a person who is not the Owner. */
  readonly scope: TranslatedText | null;
}

/** The strip's facts, and whether it is the shell's or a billing page's own (decision 3a). */
export interface StripFacts extends BillingStripFacts {
  /** False on a page that holds the act, the amount and the trial's count itself. */
  readonly withAct: boolean;
}

export interface BillingStripContext {
  readonly words: BillingStripWords;
  readonly format: MarketFormat;
  readonly now: number;
}

export const EMPTY = {
  variant: 'block',
  rows: [],
  working: null,
  act: null,
  scope: null,
} as const satisfies Partial<BillingStripView>;

/**
 * An act before it is drawn: its words, the figures they hold as `FIGURE_SLOT`s, and where it
 * goes. The strip draws it as a banner action, the denial as its one button.
 */
export interface ActSpec {
  readonly sentence: TranslatedText;
  readonly figures: readonly string[];
  /** The words with the figures in place, as a screen reader hears them. */
  readonly spoken: TranslatedText;
  readonly go: BillingStripGo;
}

/** An act of words alone. */
export const actSpec = (sentence: TranslatedText, go: BillingStripGo): ActSpec => ({
  sentence,
  figures: [],
  spoken: sentence,
  go,
});

/** An act holding one amount: its `FIGURE_SLOT` sentence, and the same words with it filled. */
export const amountAct = (
  say: (amount?: string) => TranslatedText,
  amount: string,
  go: BillingStripGo,
): ActSpec => ({ sentence: say(), figures: [amount], spoken: say(amount), go });

/** The act for the Owner, or whose act it is for anyone else; nothing on a page holding it. */
export function actOf(facts: StripFacts, spec: ActSpec): Pick<BillingStripView, 'act' | 'scope'> {
  if (!facts.withAct) return { act: null, scope: null };
  if (facts.audience !== 'owner') return { act: null, scope: facts.scope };
  return { act: { label: figured(spec.sentence, ...spec.figures), go: spec.go }, scope: null };
}

export interface OwnerFigures {
  /** The amount owed as a figure, the Owner's only. */
  readonly owed: string | null;
  /** Reactivation's one payment, or the plans where no reactivation is offered. */
  readonly reactivate: ActSpec;
}

export function ownerOf(
  facts: Pick<BillingStripFacts, 'audience' | 'home'>,
  { words, format }: BillingStripContext,
): OwnerFigures {
  const money = (amount: string) => format.money(amount, { fractionDigits: 2 });
  const { home } = facts;
  const due = home?.due ?? null;
  const owed = facts.audience === 'owner' && due !== null ? money(due.sale.total) : null;
  const again = home?.reactivation ?? null;
  return {
    owed,
    reactivate:
      facts.audience === 'owner' && again !== null
        ? amountAct(words.reactivateWith, money(again.sale.total), 'reactivate')
        : actSpec(words.pickPlan, 'plans'),
  };
}

/** A failed charge's act: update the method until something paused, then pay the amount. */
export function payActOf(
  facts: Pick<BillingStripFacts, 'home' | 'methodName'>,
  { words }: BillingStripContext,
  owner: OwnerFigures,
  rung: 'early' | 'metered' | 'final',
): ActSpec {
  if (rung === 'early' || owner.owed === null) return actSpec(words.updateMethod, 'billing_home');
  const go = (facts.home?.due?.payUrl ?? null) === null ? 'billing_home' : 'pay_link';
  const method = facts.methodName;
  const say =
    rung === 'final' && method !== null
      ? (amount?: string) => words.payWith(method, amount)
      : words.payNow;
  return amountAct(say, owner.owed, go);
}

export const dated = (key: string, label: TranslatedText, date: string): BillingStripRow => ({
  key,
  mark: 'until',
  label,
  value: plain(date),
});

/**
 * `How it is worked out` (decision 13): the grace day, then the amount on its invoice. After the
 * halt there is no day of the grace to count, only where it was counted from.
 */
export function workingOf(
  day: number | null,
  facts: BillingStripFacts,
  { words, format }: BillingStripContext,
): BillingStripView['working'] {
  const due = facts.home?.due ?? null;
  if (facts.audience !== 'owner' || due === null) return null;
  const amount = format.money(due.sale.total, { fractionDigits: 2 });
  return {
    label: words.stripFigures,
    parts: [
      {
        kind: 'formula',
        label: words.graceDay,
        value: plain(
          day === null
            ? words.graceCountedFrom(format.date(due.failedAt))
            : words.graceCounted(day, format.date(due.failedAt)),
        ),
      },
      {
        kind: 'note',
        label: words.amount,
        value:
          due.invoiceNumber === null
            ? figure(amount)
            : figured(words.amountOnInvoice(), amount, due.invoiceNumber),
      },
    ],
  };
}
