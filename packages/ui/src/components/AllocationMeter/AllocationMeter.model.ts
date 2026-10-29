import type { TranslatedText } from '@heliogrid/contracts';
import type {
  AllocationEnforcement,
  AllocationMeterProps,
  AllocationMeterWords,
  AllocationPart,
  AllocationSpan,
  AllocationState,
} from './AllocationMeter.types';

/** Two decimals, no trailing zeroes. 99.99 stays 99.99; 30 stays "30". */
export function formatAllocation(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** A figure as the meter prints it, with its unit — "62%". */
export function allocationFigure(value: number, unit: string): string {
  return `${formatAllocation(value)}${unit}`;
}

export interface AllocationModel {
  /** No figure without a resolved value — the same rule UsageMeter runs before any of its logic. */
  resolved: boolean;
  sum: number | null;
  /** sum − target. Positive is over-allocated. */
  off: number | null;
  state: AllocationState;
  /** The parts that carry a finite figure, in the caller's order. */
  parts: AllocationPart[];
  /** max(allocated, target) — so an over-allocation has somewhere to go. */
  scale: number;
  spans: AllocationSpan[];
  /** The target line's position along the track, as a percentage. */
  tickAt: number;
}

function partValue(part: AllocationPart): number {
  return Number(part.value ?? part.percent);
}

/**
 * Each part draws up to two spans: the piece inside the target and the piece beyond it. A segment
 * that straddles the target line is therefore SPLIT AT THE LINE rather than tinted by its whole.
 */
function buildSpans(parts: AllocationPart[], target: number, scale: number): AllocationSpan[] {
  const spans: AllocationSpan[] = [];
  let run = 0;
  parts.forEach((part, index) => {
    const value = partValue(part);
    const inside = Math.max(0, Math.min(value, target - run));
    const beyond = Math.max(0, value - inside);
    if (inside > 0) {
      spans.push({
        key: `${index}-in`,
        width: (inside / scale) * 100,
        over: false,
        label: part.label,
      });
    }
    if (beyond > 0) {
      spans.push({
        key: `${index}-out`,
        width: (beyond / scale) * 100,
        over: true,
        label: part.label,
      });
    }
    run += value;
  });
  return spans;
}

/**
 * The whole arithmetic of the meter, shared by both platform halves so the sentence a reader gets
 * is the same sentence on either — `met` IS A TOLERANCE, NOT AN EQUALITY, because the ordinary
 * split is unrounded: three tranches of 33.33% sum to 99.99%, and an `===` test called that "0%
 * unallocated" and invented a refusal out of a hundredth of a percent.
 */
function resolveSum(list: AllocationPart[], allocated: number | undefined): number | null {
  if (list.length > 0) {
    return list.reduce((acc, part) => acc + partValue(part), 0);
  }
  return Number.isFinite(allocated) ? Number(allocated) : null;
}

/** `met` IS A TOLERANCE: three tranches of 33.33% sum to 99.99% and are fully allocated. */
function deriveState(off: number | null, tolerance: number): AllocationState {
  if (off === null || off < -tolerance) {
    return 'under';
  }
  return off > tolerance ? 'over' : 'met';
}

/** THE REMAINDER IS IN WORDS, NOT A GAP IN A BAR — M06-13 quotes the sentence. */
function remainderSentence(
  model: AllocationModel,
  words: AllocationMeterWords,
  unit: string,
): TranslatedText | null {
  if (model.off === null) {
    return null;
  }
  if (model.state === 'met') {
    return words.met;
  }
  return model.state === 'over'
    ? words.over(allocationFigure(model.off, unit))
    : words.under(allocationFigure(-model.off, unit));
}

/** The block is a SENTENCE, never a silent refusal. `none` blocks nothing and says nothing. */
function enforcementSentence(
  model: AllocationModel,
  words: AllocationMeterWords,
  enforcement: AllocationEnforcement,
  target: string,
): TranslatedText | null {
  if (enforcement === 'none' || model.state === 'met' || !model.resolved) {
    return null;
  }
  return enforcement === 'immediate' ? words.blocksSave(target) : words.blocksGenerate(target);
}

/** What the meter says: the remainder, the rule's bite, and the whole figure for a screen reader. */
export interface AllocationSentences {
  /** The line under the bar — the caller's, else the remainder, else the unresolved words. */
  remainder: TranslatedText;
  /** The rule's bite, or `null` when nothing is blocked. */
  enforcement: TranslatedText | null;
  /** "62% of 100% — 38% unallocated.", or `undefined` with no resolved figure. */
  figure: TranslatedText | undefined;
}

/** Every sentence the meter draws or speaks, in the reader's language, from the one model. */
export function allocationSentences(
  model: AllocationModel,
  words: AllocationMeterWords,
  {
    target = 100,
    unit = '%',
    enforcement = 'at-generate',
    remainderWords,
    enforcementNote,
    unresolvedNote,
  }: AllocationMeterProps,
): AllocationSentences {
  const goal = allocationFigure(target, unit);
  const remainder =
    remainderWords ?? remainderSentence(model, words, unit) ?? unresolvedNote ?? words.unresolved;
  return {
    remainder,
    enforcement:
      enforcementNote === undefined
        ? enforcementSentence(model, words, enforcement, goal)
        : enforcementNote,
    figure:
      model.sum === null
        ? undefined
        : words.figure(allocationFigure(model.sum, unit), goal, remainder),
  };
}

/** The no-parts case: the caller summed for us, so the bar is one span and maybe an excess. */
function wholeSpans(sum: number, target: number, scale: number): AllocationSpan[] {
  const spans: AllocationSpan[] = [];
  const inside = Math.min(sum, target);
  const beyond = Math.max(0, sum - target);
  if (inside > 0) {
    spans.push({ key: 'in', width: (inside / scale) * 100, over: false });
  }
  if (beyond > 0) {
    spans.push({ key: 'out', width: (beyond / scale) * 100, over: true });
  }
  return spans;
}

/**
 * The whole arithmetic of the meter, shared by both platform halves so the sentence a reader gets
 * is the same sentence on either.
 */
export function allocationModel({
  parts = [],
  allocated,
  target = 100,
  tolerance = 0.05,
  state,
}: AllocationMeterProps): AllocationModel {
  const list = parts.filter((part) => Number.isFinite(partValue(part)));
  const sum = resolveSum(list, allocated);
  const resolved = sum !== null;
  const off = sum === null ? null : sum - target;
  const current = state ?? deriveState(off, tolerance);
  const scale = Math.max(target, sum ?? target) || 1;
  const spans =
    list.length > 0 || sum === null
      ? buildSpans(list, target, scale)
      : wholeSpans(sum, target, scale);

  return {
    resolved,
    sum,
    off,
    state: current,
    parts: list,
    scale,
    spans,
    tickAt: (target / scale) * 100,
  };
}

export { partValue };

/** The state the words and their mark draw: a meter with no resolved figure reads as under. */
export function drawnState(model: AllocationModel): AllocationState {
  return model.resolved ? model.state : 'under';
}

/** The meter's top for a screen reader — the target, or the sum once it passes it. */
export function meterTop(target: number, sum: number): number {
  return Math.max(target, sum);
}

/** A legend entry's key: its label and its share, since two parts may share a label. */
export function legendKey(part: AllocationPart): string {
  return `${part.label ?? ''}-${partValue(part)}`;
}

/**
 * Up to four parts keep ONE key row, so template cards side by side stay one height; five or more
 * wrap. Both halves read it, so the phone and the web break the key at the same count.
 */
const SPLIT_KEY_ONE_ROW_LIMIT = 4;

export function splitKeyFitsOneRow(partCount: number): boolean {
  return partCount <= SPLIT_KEY_ONE_ROW_LIMIT;
}
