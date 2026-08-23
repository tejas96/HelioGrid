import type {
  AllocationEnforcement,
  AllocationMeterProps,
  AllocationPart,
  AllocationSpan,
  AllocationState,
} from './AllocationMeter.types';

/** Two decimals, no trailing zeroes. 99.99 stays 99.99; 30 stays "30". */
export function formatAllocation(value: number): string {
  return String(Math.round(value * 100) / 100);
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
  /** The generated remainder sentence. `null` when there is no resolved figure. */
  remainder: string | null;
  /** The generated enforcement sentence. `null` when nothing is blocked. */
  enforcement: string | null;
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
  state: AllocationState,
  off: number | null,
  unit: string,
): string | null {
  if (off === null) {
    return null;
  }
  if (state === 'met') {
    return 'Fully allocated.';
  }
  return state === 'over'
    ? `${formatAllocation(off)}${unit} over-allocated.`
    : `${formatAllocation(-off)}${unit} unallocated.`;
}

/** The block is a SENTENCE, never a silent refusal. `none` blocks nothing and says nothing. */
function enforcementSentence(
  enforcement: AllocationEnforcement,
  state: AllocationState,
  resolved: boolean,
  target: number,
  unit: string,
): string | null {
  if (enforcement === 'none' || state === 'met' || !resolved) {
    return null;
  }
  return enforcement === 'immediate'
    ? `This has to reach ${formatAllocation(target)}${unit} before it can be saved.`
    : `Generate is blocked until the allocation reaches ${formatAllocation(target)}${unit}.`;
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
  unit = '%',
  tolerance = 0.05,
  enforcement = 'at-generate',
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
    remainder: remainderSentence(current, off, unit),
    enforcement: enforcementSentence(enforcement, current, resolved, target, unit),
  };
}

export { partValue };
