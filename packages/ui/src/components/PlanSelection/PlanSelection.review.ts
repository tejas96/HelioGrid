import type { PlanChangePreview, TranslatedText } from '@heliogrid/contracts';
import { BYTES_PER_GB, minorUnitsOfDecimal, type Tier, tierStepOf } from '@heliogrid/domain';
import type { BillingWorkingPart } from '../BillingHome/BillingHome.types';
import { figured } from '../BillingHome/BillingHome.values';
import { changeRowsOf, cycleRowsOf, row } from './PlanSelection.changes';
import type { PlanSelectionInput, PlanSelectionState } from './PlanSelection.state';
import type {
  PlanMoneyLine,
  PlanReviewRow,
  PlanReviewSection,
  PlanReviewView,
} from './PlanSelection.types';
import { actOf, pendingWhenOf, whenRowsOf } from './PlanSelection.when';

type Sale = PlanChangePreview['afterwards'];
type Kind = PlanChangePreview['kind'];
const BASIS_POINTS_PER_PERCENT = 100;

/**
 * The review (decision 6): `What changes`, `What you pay today`, `When it starts` and ONE act — a
 * downgrade's blocked block first (`M12-49`). Until a preview stands it draws its loading or its
 * retry and no act: the preview is the consent surface.
 */
export function reviewOf(
  state: PlanSelectionState,
  input: PlanSelectionInput,
): PlanReviewView | null {
  const { picked } = state;
  if (!state.owner || !state.reviewing || picked === null) return null;
  const { words } = input;
  const failure = state.failure?.where === 'sheet' ? words.failure(state.failure.why) : null;
  const read = state.preview;
  if (read.kind !== 'ready') return { ...pendingOf(input, picked, state.cycle, read), failure };
  const preview = read.value;
  const from = preview.from;
  return {
    subtitle: subtitleOf(
      input,
      preview.kind,
      from?.tier ?? null,
      preview.to.tier,
      from?.cycle ?? null,
      preview.to.cycle,
    ),
    changed: state.changedFrom === null ? null : words.changedBanner,
    failure,
    sections: sectionsOf(state, input, preview),
    act: actOf(input, preview),
  };
}

/** No preview stands yet: its loading or its retry, and no act (frames s13, s14). */
function pendingOf(
  input: PlanSelectionInput,
  picked: Tier,
  cycle: PlanChangePreview['to']['cycle'],
  read: Exclude<PlanSelectionState['preview'], { kind: 'ready' }>,
): Omit<PlanReviewView, 'failure'> {
  const { words } = input;
  const kind = guessedKind(input.heldTier, picked);
  const downgrade = kind === 'downgrade';
  const pending: PlanReviewSection =
    read.kind === 'failed'
      ? {
          kind: 'failed',
          key: 'preview',
          title: downgrade ? words.blocksTitle(picked) : words.whatChanges,
          errorTitle: downgrade ? words.previewFailedBlocks : words.previewFailedChange,
          errorMessage: words.previewFailedMessage,
          retry: read.retry,
        }
      : {
          kind: 'loading',
          key: 'preview',
          label: downgrade ? words.workingOutBlocks(picked) : words.workingOutChange,
        };
  const when: PlanReviewSection = {
    kind: 'facts',
    key: 'when',
    overline: words.whenItStarts,
    label: words.whenItStarts,
    rows: pendingWhenOf(input, picked, cycle),
    source: null,
  };
  return {
    subtitle: subtitleOf(input, kind, input.heldTier, picked, input.heldCycle, cycle),
    changed: null,
    sections: downgrade ? [pending, when] : [pending],
    act: null,
  };
}

/** The pick's kind before its preview answers, by the tiers' order (decision 2). */
function guessedKind(held: Tier | null, picked: Tier): Kind {
  if (held === null) return 'conversion';
  const step = tierStepOf(held, picked);
  if (step === 'same') return 'cycle_switch';
  return step === 'higher' ? 'upgrade' : 'downgrade';
}

function subtitleOf(
  input: PlanSelectionInput,
  kind: Kind,
  from: Tier | null,
  to: Tier,
  fromCycle: 'monthly' | 'yearly' | null,
  toCycle: 'monthly' | 'yearly',
): TranslatedText {
  const { words } = input;
  if (kind === 'cycle_switch' && fromCycle !== null)
    return words.cycleSubtitle(to, fromCycle, toCycle);
  return words.changeSubtitle(
    kind === 'conversion' && input.heldTier === null ? null : from,
    to,
    toCycle,
  );
}

function sectionsOf(
  state: PlanSelectionState,
  input: PlanSelectionInput,
  preview: PlanChangePreview,
): PlanReviewSection[] {
  const { words } = input;
  const changes: PlanReviewSection = {
    kind: 'facts',
    key: 'changes',
    overline: words.whatChanges,
    label: words.whatChanges,
    rows:
      preview.kind === 'cycle_switch'
        ? cycleRowsOf(
            words,
            input.format,
            preview,
            preview.today?.partCycle?.fromPrice ?? input.heldList ?? preview.afterwards.list,
          )
        : changeRowsOf(words, preview.includes),
    source: input.priceList,
  };
  const when: PlanReviewSection = {
    kind: 'facts',
    key: 'when',
    overline: words.whenItStarts,
    label: words.whenItStarts,
    rows: whenRowsOf(input, preview),
    source: null,
  };
  if (preview.kind !== 'downgrade') return [changes, moneyOf(input, preview), when];
  const blocks = preview.blocks ?? [];
  if (blocks.length === 0) {
    const over = words.overLimits(preview.to.tier);
    const clear: PlanReviewSection = {
      kind: 'facts',
      key: 'clear',
      overline: null,
      label: over,
      rows: [row('over', over, words.nothing)],
      source: null,
    };
    return [clear, changes, when];
  }
  const before = state.changedFrom?.blocks ?? null;
  const blocked: PlanReviewSection = {
    kind: 'blocked',
    key: 'blocked',
    title: words.blocksTitle(preview.to.tier),
    rows: blocks.flatMap((block) => {
      /* Storage is the one block this release can name; one a later release adds waits for it. */
      if (block.block !== 'storage') return [];
      const was = before?.find((old) => old.block === block.block);
      const changed = before !== null && (was === undefined || was.used !== block.used);
      return [{ ...blockRowOf(input, block), mark: changed ? words.changedMark : null }];
    }),
  };
  return [blocked, when];
}

/** One thing the lower plan blocks: what is used now against its limit (`M12-49`). */
function blockRowOf(
  input: PlanSelectionInput,
  block: NonNullable<PlanChangePreview['blocks']>[number],
): PlanReviewRow {
  const { words, format } = input;
  const gb = (bytes: number) => format.number(Math.round(bytes / BYTES_PER_GB));
  /* `used` is the gauge in bytes; `limit` is the book's own figure, already in GB (the contract). */
  return row(
    block.block,
    words.view.limits.storage,
    words.usedOf(gb(block.used), words.book.storage(block.limit)),
  );
}

/** `What you pay today`: the part of this cycle, or a conversion's first cycle, with its tax. */
function moneyOf(input: PlanSelectionInput, preview: PlanChangePreview): PlanReviewSection {
  const { words, format } = input;
  const minor = (amount: string) => minorUnitsOfDecimal(amount, format.pack.minorUnitDigits);
  const today = preview.today;
  const part = today?.partCycle ?? null;
  const label =
    preview.kind === 'conversion'
      ? words.firstCycleOf(preview.to.tier, preview.to.cycle)
      : part === null
        ? words.partOfCycle
        : words.partOfCycleDays(format.number(part.daysLeft), format.number(part.daysInCycle));
  const zero = minor('0');
  const lines: PlanMoneyLine[] = [
    { key: 'today', label, amount: today === null ? zero : minor(today.sale.list) },
  ];
  const rate = taxRateOf(input, today?.sale ?? null);
  if (today !== null && today.sale.tax !== null && rate !== null && preview.taxScheme !== null) {
    lines.push({
      key: 'tax',
      label: words.taxLine(preview.taxScheme, rate),
      amount: minor(today.sale.tax),
    });
  }
  return {
    kind: 'money',
    key: 'pay',
    lines,
    total: today === null ? zero : minor(today.sale.total),
    working:
      part === null || today === null ? null : workingOf(input, preview, part, today.sale, rate),
    source: input.priceList,
  };
}

function workingOf(
  input: PlanSelectionInput,
  preview: PlanChangePreview,
  part: NonNullable<NonNullable<PlanChangePreview['today']>['partCycle']>,
  sale: Sale,
  rate: string | null,
): NonNullable<Extract<PlanReviewSection, { kind: 'money' }>['working']> {
  const { words, format } = input;
  const paisa = (amount: string) => format.money(amount, { fractionDigits: 2 });
  const parts: BillingWorkingPart[] = [
    {
      kind: 'formula',
      label: words.days,
      value: figured(
        words.daysText(
          format.number(part.daysLeft),
          format.number(part.daysInCycle),
          format.date(new Date(input.now)),
        ),
      ),
    },
    comparisonOf(input, preview, part, sale),
  ];
  if (rate !== null && preview.taxScheme !== null && sale.tax !== null) {
    parts.push({
      kind: 'note',
      label: words.tax,
      value: figured(words.taxText(preview.taxScheme, rate), paisa(sale.list)),
    });
  }
  if (preview.kind === 'cycle_switch') {
    parts.push({ kind: 'note', label: words.refund, value: figured(words.noRefundMidCycle) });
  }
  return { label: words.partOfCycle, parts };
}

/**
 * The charge's second working line, every figure the server's (`F4-04`): two prices on one cycle
 * differ by `difference` a cycle; two cycles compare their day rates, the cycle switched to first.
 */
function comparisonOf(
  input: PlanSelectionInput,
  preview: PlanChangePreview,
  part: NonNullable<NonNullable<PlanChangePreview['today']>['partCycle']>,
  sale: Sale,
): BillingWorkingPart {
  const { words, format } = input;
  const paisa = (amount: string) => format.money(amount, { fractionDigits: 2 });
  const from = preview.from?.tier ?? preview.to.tier;
  if (part.difference !== null) {
    return {
      kind: 'formula',
      label: words.difference,
      value: figured(
        words.differenceText(preview.to.cycle, from, preview.to.tier),
        paisa(part.difference),
        paisa(part.fromPrice),
        paisa(part.toPrice),
      ),
    };
  }
  const nothing = minorUnitsOfDecimal(sale.total, format.pack.minorUnitDigits) === 0;
  return {
    kind: 'formula',
    label: words.rates,
    value: figured(
      words.ratesText(preview.to.cycle, nothing),
      paisa(part.toDayRate),
      paisa(part.fromDayRate),
    ),
  };
}

function taxRateOf(input: PlanSelectionInput, sale: Sale | null): string | null {
  const basis = sale?.taxRateBasisPoints ?? null;
  return basis === null ? null : input.format.number(basis / BASIS_POINTS_PER_PERCENT);
}
