import type { PlanChangePreview, TranslatedText } from '@heliogrid/contracts';
import { BYTES_PER_GB, scaledPower, type TierLimit } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import { figured, plain } from '../BillingHome/BillingHome.values';
import type { PlanSelectionInput } from './PlanSelection.state';
import type { PlanReviewRow } from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

type Includes = PlanChangePreview['includes']['from'];

/** A review row on one edge, with no mark. */
export function row(key: string, label: TranslatedText, value: string): PlanReviewRow {
  return { key, label, value: plain(value), amount: false, mark: null };
}

/** One limit of `What changes`: how to say it, and whether a count of it is per month. */
interface LimitSpec {
  readonly key: string;
  readonly label: TranslatedText;
  readonly of: (includes: Includes) => TierLimit;
  readonly say: (value: TierLimit) => string;
  readonly monthly: boolean;
}

/**
 * `What changes` (decision 6): each limit that differs as `from → to`, then the ones that do not
 * on ONE line — `Unchanged · Active projects · Users`. Users are unlimited on every plan, so they
 * are always unchanged (`BM-41`).
 */
export function changeRowsOf(
  words: PlanSelectionWords,
  includes: PlanChangePreview['includes'],
): PlanReviewRow[] {
  const { limits } = words.view;
  const book = words.book;
  const power = (value: TierLimit) =>
    typeof value === 'number' ? book.power(scaledPower(value)) : book.limit(value);
  const voice = (value: TierLimit) => (value === 0 ? words.perMinute : book.limit(value));
  const notCapped = (value: TierLimit) =>
    value === 'unlimited' ? words.view.notCapped : book.limit(value);
  const specs: LimitSpec[] = [
    {
      key: 'design',
      label: limits.biggestDesign,
      of: (i) => i.designCeilingKw,
      say: power,
      monthly: false,
    },
    {
      key: 'proposals',
      label: words.proposals,
      of: (i) => i.proposalsPerMonth,
      say: notCapped,
      monthly: true,
    },
    {
      key: 'projects',
      label: limits.activeProjects,
      of: (i) => i.activeProjects,
      say: book.limit,
      monthly: false,
    },
    {
      key: 'storage',
      label: limits.storage,
      of: (i) => i.storageGb,
      say: book.storage,
      monthly: false,
    },
    {
      key: 'voice',
      label: limits.voiceMinutes,
      of: (i) => i.voiceMinutesIncluded,
      say: voice,
      monthly: true,
    },
  ];
  const changed = specs.filter((spec) => spec.of(includes.from) !== spec.of(includes.to));
  const unchanged = specs.filter((spec) => spec.of(includes.from) === spec.of(includes.to));
  const rows = changed.map((spec) => {
    const to = spec.of(includes.to);
    const sentence =
      spec.monthly && typeof to === 'number' && to > 0 ? words.arrowMonth : words.arrow;
    return row(spec.key, spec.label, sentence(spec.say(spec.of(includes.from)), spec.say(to)));
  });
  const kept = [...unchanged.map((spec) => spec.label), limits.users];
  return [...rows, row('unchanged', words.unchanged, words.joined(kept))];
}

/** A cycle switch's `What changes`: the cycle, the price, and every limit unchanged (decision 1). */
export function cycleRowsOf(
  words: PlanSelectionWords,
  format: MarketFormat,
  preview: PlanChangePreview,
  fromList: string,
): PlanReviewRow[] {
  const from = preview.from?.cycle ?? preview.to.cycle;
  const to = preview.to.cycle;
  const whole = (amount: string) => format.money(amount, { fractionDigits: 0 });
  return [
    row('cycle', words.cycleRow, words.arrow(cycleName(words, from), cycleName(words, to))),
    {
      key: 'price',
      label: words.view.price,
      value: figured(words.priceChange(from, to), whole(fromList), whole(preview.afterwards.list)),
      amount: false,
      mark: null,
    },
    row('unchanged', words.unchanged, words.everyLimit),
  ];
}

function cycleName(words: PlanSelectionWords, cycle: 'monthly' | 'yearly'): string {
  return cycle === 'yearly' ? words.yearly : words.monthly;
}

/** One thing the lower plan blocks: what is used now against its limit (`M12-49`). */
export function blockRowOf(
  { words, format }: Pick<PlanSelectionInput, 'words' | 'format'>,
  block: NonNullable<PlanChangePreview['blocks']>[number],
): PlanReviewRow {
  if (block.block === 'active_projects') {
    return row(
      block.block,
      words.view.limits.activeProjects,
      words.usedOf(format.number(block.used), words.book.limit(block.limit)),
    );
  }
  const gb = (bytes: number) => format.number(Math.round(bytes / BYTES_PER_GB));
  /* `used` is the gauge in bytes; `limit` is the book's own figure, already in GB (the contract). */
  return row(
    block.block,
    words.view.limits.storage,
    words.usedOf(gb(block.used), words.book.storage(block.limit)),
  );
}
