import type { BillingUsage } from '@heliogrid/contracts';
import {
  BYTES_PER_GB,
  FIGURE_SLOT,
  MS_PER_DAY,
  scaledPower,
  type TierLimit,
} from '@heliogrid/domain';
import type { BillingChip } from '../BillingHome/BillingHome.types';
import { figure, figured } from '../BillingHome/BillingHome.values';
import type { UsageState } from '../UsageMeter/UsageMeter.types';
import type { UsageInput, UsageRowView } from './UsagePage.types';

type Step = BillingUsage['voice']['usage'];
type Counted = BillingUsage['proposals'];

/** The steps `Needs you` holds (decision 3): a bundle's overage never enters it (decision 16). */
const NEEDS = new Set<string>(['warning', 'at_cap', 'grace', 'paused']);
/** The steps that also offer `Bigger plans` on the meter itself (decision 12). */
const SIGNAL = new Set<string>(['at_cap', 'grace', 'paused']);

export const inNeeds = (step: Step) => NEEDS.has(step.step);
export const isSignal = (step: Step) => SIGNAL.has(step.step);

/** The meter's own state for a step; a pause or grace the meter only names when the row says it. */
function meterState(step: Step): UsageState {
  if (step.step === 'grace') return 'cap-reached-grace';
  if (step.step === 'paused') return 'creations-paused';
  if (step.step === 'overage') return 'overage-accruing';
  return 'ok';
}

function graceDays(step: Step, now: number): number | null {
  if (step.pausesAt === null) return null;
  return Math.max(0, Math.ceil((Date.parse(step.pausesAt) - now) / MS_PER_DAY));
}

/** A limit a meter can measure against: a positive number; anything else is a count alone. */
export const measured = (limit: TierLimit | null) =>
  typeof limit === 'number' && limit > 0 ? limit : null;

/** The chip a row carries in `Needs you`, or on its own for a person who is not the Owner. */
export function stepChip(step: Step, percent: number | null, input: UsageInput): BillingChip {
  const { words } = input;
  if (step.step === 'paused') return { word: words.paused, tone: 'danger' };
  if (step.step === 'warning' && percent !== null) {
    return { word: words.percentUsed(percent), tone: 'warning' };
  }
  return { word: words.atTheCap, tone: 'warning' };
}

export const percentOf = (used: number, limit: TierLimit | null) => {
  const of = measured(limit);
  return of === null ? null : Math.floor((used * 100) / of);
};

export function noLimitNote(limit: TierLimit | null, usage: BillingUsage, input: UsageInput) {
  const { words } = input;
  if (limit === 'custom') return words.view.yourContract;
  if (limit !== 'unlimited') return null;
  const tier = usage.standing.tier;
  return tier === null ? words.noLimitTrial : words.noLimitOn(words.view.tier(tier));
}

export const onTrial = (usage: BillingUsage) =>
  usage.standing.state === 'trialing' || usage.standing.state === 'expired';

function countedRow(
  key: 'proposals' | 'projects',
  counted: Counted,
  usage: BillingUsage,
  input: UsageInput,
): UsageRowView {
  const { words } = input;
  return {
    key,
    label: key === 'proposals' ? words.proposals : words.view.limits.activeProjects,
    meter: {
      value: counted.used,
      limit: measured(counted.limit),
      unit: null,
      period: null,
      state: meterState(counted.usage),
      graceDaysLeft: graceDays(counted.usage, input.now),
      note: null,
      noLimitNote: noLimitNote(counted.limit, usage, input),
      statusLine: !inNeeds(counted.usage),
    },
    facts: [],
    ledger: null,
    plans: isSignal(counted.usage),
  };
}

/** `Biggest design`: a ceiling, not a count — the row of the same form with no meter. */
export function designFigure(kw: TierLimit | null, input: UsageInput): string {
  const { words, format } = input;
  if (kw === null || kw === 'unlimited') return words.view.notCapped;
  if (kw === 'custom') return words.view.yourContract;
  const { amount, unit } = scaledPower(kw);
  return words.view.power(format.number(amount), unit);
}

export const gbOf = (bytes: number) => bytes / BYTES_PER_GB;

/** The rate sentence as a meter's note, and as runs with the rate in mono (a table cell). */
function rateOf(usage: BillingUsage, input: UsageInput) {
  const { voice } = usage;
  if (voice.rate === null) return null;
  const { words, format } = input;
  const rate = format.money(voice.rate);
  const bundle = measured(voice.limit);
  const say = (amount: string) =>
    bundle === null ? words.rateAMinute(amount) : words.rateBeyond(amount, format.number(bundle));
  return { note: say(rate), value: figured(say(FIGURE_SLOT), rate) };
}

export const money = (amount: string, input: UsageInput) =>
  input.format.money(amount, { fractionDigits: 2 });

/** The 375 cards' rows (decision 1): `Limits`, then `Included each month`. */
export function rowsOf(usage: BillingUsage, input: UsageInput) {
  const { words, format } = input;
  const { voice, storage } = usage;
  const asOf =
    storage.takenAt === null
      ? null
      : words.asOf(format.date(storage.takenAt), format.clockAt(storage.takenAt));
  const limits: UsageRowView[] = [
    countedRow('proposals', usage.proposals, usage, input),
    countedRow('projects', usage.activeProjects, usage, input),
    {
      key: 'design',
      label: words.view.limits.biggestDesign,
      meter: null,
      facts: [
        {
          key: 'design',
          label: words.view.limits.biggestDesign,
          value: figure(designFigure(usage.designCeilingKw, input)),
          chip: null,
        },
      ],
      ledger: null,
      plans: false,
    },
  ];
  const rate = rateOf(usage, input);
  const included: UsageRowView[] = [
    {
      key: 'voice',
      label: words.view.limits.voiceMinutes,
      meter: {
        value: voice.usedMinutes,
        limit: measured(voice.limit),
        unit: words.minutes,
        period: null,
        state: meterState(voice.usage),
        graceDaysLeft: graceDays(voice.usage, input.now),
        note: rate?.note ?? null,
        noLimitNote: null,
        statusLine: !inNeeds(voice.usage),
      },
      facts:
        voice.soFar === null
          ? []
          : [
              {
                key: 'so-far',
                label: words.soFar,
                value: figure(money(voice.soFar, input)),
                chip: null,
              },
            ],
      ledger: 'voice_minutes',
      plans: isSignal(voice.usage),
    },
    {
      key: 'storage',
      label: words.view.limits.storage,
      meter: {
        value: gbOf(storage.usedBytes ?? 0),
        limit: measured(storage.limitGb),
        unit: words.view.gb,
        period: asOf,
        state: 'ok',
        graceDaysLeft: null,
        note: null,
        noLimitNote: noLimitNote(storage.limitGb, usage, input),
        statusLine: !inNeeds(storage.usage),
      },
      facts: [],
      ledger: null,
      plans: isSignal(storage.usage),
    },
    {
      key: 'otp',
      label: words.otpCodes,
      meter: {
        value: usage.otpCodes,
        limit: null,
        unit: null,
        period: null,
        state: 'ok',
        graceDaysLeft: null,
        note: null,
        noLimitNote: null,
        statusLine: false,
      },
      facts: [
        {
          key: 'charges',
          label: words.charges,
          value: null,
          chip: { word: words.notBilled, tone: 'neutral' },
        },
      ],
      ledger: 'otp_delivery',
      plans: false,
    },
  ];
  return { limits, included, rate, asOf };
}
