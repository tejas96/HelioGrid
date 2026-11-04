import type { BillingUsage, TranslatedText } from '@heliogrid/contracts';
import { MS_PER_DAY, TIERS, type Tier } from '@heliogrid/domain';
import type { BillingChip } from '../BillingHome/BillingHome.types';
import { needsOf } from './UsagePage.needs';
import { inNeeds, isSignal, onTrial, rowsOf, stepChip } from './UsagePage.rows';
import { tableRowsOf } from './UsagePage.tables';
import type {
  UsageInput,
  UsageNeedRow,
  UsagePageFacts,
  UsagePageView,
  UsageViewWords,
} from './UsagePage.types';

/** The page, read (`SCR-M12-04`): the Owner's figures, or a person's chips and whose screen it is. */
export function usagePageViewOf(facts: UsagePageFacts, input: UsageInput): UsagePageView {
  return facts.kind === 'owner' ? ownerView(facts.usage, input) : memberView(facts, input);
}

/**
 * The view while the read is out or failed (decision 15): the cards' own labels with every figure
 * waiting, and `Bigger plans` for the Owner — the way on stays while the figures cannot be read.
 */
export function usageWaitingView(input: UsageInput, owner: boolean): UsagePageView {
  // A person who is not the Owner is never shown the cards, not even while they wait.
  if (!owner) return emptyView();
  const { words } = input;
  const waiting = (
    key: 'proposals' | 'projects' | 'voice' | 'storage' | 'otp',
    label: TranslatedText,
  ) => ({
    key,
    label,
    meter: {
      value: undefined,
      limit: null,
      unit: null,
      period: null,
      state: 'loading' as const,
      graceDaysLeft: null,
      note: null,
      noLimitNote: null,
      statusLine: false,
    },
    facts:
      key === 'otp'
        ? [{ key: 'charges', label: words.charges, value: null, chip: notBilled(words) }]
        : [],
    ledger: null,
    plans: false,
  });
  return {
    ...emptyView(),
    plans: { title: words.biggerPlans, subtitle: null },
    limits: {
      title: words.limits,
      rows: [
        waiting('proposals', words.proposals),
        waiting('projects', words.view.limits.activeProjects),
      ],
      sources: null,
    },
    included: {
      title: words.included,
      rows: [
        waiting('voice', words.view.limits.voiceMinutes),
        waiting('storage', words.view.limits.storage),
        waiting('otp', words.otpCodes),
      ],
      sources: null,
    },
  };
}

function ownerView(usage: BillingUsage, input: UsageInput): UsagePageView {
  const { words, format } = input;
  const cards = rowsOf(usage, input);
  const needs = needsOf(usage, input);
  const sources = [
    words.view.actualUsage,
    words.limitsAndRates(
      words.view.priceList(input.marketName, format.date(usage.priceListPublishedAt)),
    ),
  ];
  const range = rangeOf(usage, input);
  const plan = usage.standing.tier === null ? null : words.view.tier(usage.standing.tier);
  const tables = tableRowsOf(usage, input, cards);
  return {
    cycleLine: onTrial(usage)
      ? words.trialLine(trialDays(usage), range)
      : words.cycleLine(range, format.date(usage.cycle.resetsAt)),
    chip: chipOf(usage, needs, words),
    needs: needs.length === 0 ? null : needs,
    teaching: nothingUsed(usage)
      ? { title: words.nothingUsedTitle, body: words.nothingUsedBody }
      : null,
    limits: { title: words.limits, rows: cards.limits, sources },
    included: { title: words.included, rows: cards.included, sources },
    tables: {
      ...tables,
      limitsCaption: words.limitsCaption(plan, range),
      includedCaption: words.includedCaption(plan, range),
    },
    cycle: { range, resets: format.date(usage.cycle.resetsAt) },
    extra:
      usage.extraCharges === null
        ? null
        : {
            total: format.money(usage.extraCharges.total, { fractionDigits: 2 }),
            billsOn: format.date(usage.extraCharges.billsOn),
          },
    plans: plansOf(usage.standing.tier, words),
    scope: null,
  };
}

/** A person who is not the Owner: which meter is at its cap or paused, as its chip, and no figure. */
function memberView(
  facts: Extract<UsagePageFacts, { kind: 'member' }>,
  input: UsageInput,
): UsagePageView {
  const { words } = input;
  const titles = {
    proposals: words.proposals,
    active_projects: words.view.limits.activeProjects,
    voice_minutes: words.view.limits.voiceMinutes,
    storage: words.view.limits.storage,
  } as const;
  const keys = {
    proposals: 'proposals',
    active_projects: 'projects',
    voice_minutes: 'voice',
    storage: 'storage',
  } as const;
  const needs: UsageNeedRow[] = facts.signals.signals.flatMap((signal) => {
    if (!(signal.meter in titles)) return [];
    const meter = signal.meter as keyof typeof titles;
    const chip = stepChip(signal.usage, null, input);
    return [
      {
        key: keys[meter],
        title: titles[meter],
        chip,
        figure: null,
        line: null,
        tone: chip.tone === 'danger' ? 'danger' : 'warning',
      },
    ];
  });
  const paused = needs.some((row) => row.chip.tone === 'danger');
  return {
    ...emptyView(),
    chip:
      needs.length === 0
        ? null
        : {
            word: paused ? words.chips.paused : words.chips.atLimit,
            tone: paused ? 'danger' : 'warning',
          },
    needs: needs.length === 0 ? null : needs,
    scope: words.scope(facts.owners),
  };
}

function emptyView(): UsagePageView {
  return {
    cycleLine: null,
    chip: null,
    needs: null,
    teaching: null,
    limits: null,
    included: null,
    tables: null,
    cycle: null,
    extra: null,
    plans: null,
    scope: null,
  };
}

export function rangeOf(usage: BillingUsage, input: UsageInput): string {
  const { format, words } = input;
  // The cycle's last day is the day before it resets.
  const lastDay = new Date(Date.parse(usage.cycle.resetsAt) - 1);
  return words.range(format.date(usage.cycle.from), format.date(lastDay));
}

function trialDays(usage: BillingUsage): number {
  return Math.round((Date.parse(usage.cycle.resetsAt) - Date.parse(usage.cycle.from)) / MS_PER_DAY);
}

/** Every count at zero and nothing stored: `Nothing used yet`, every cap still drawn. */
function nothingUsed(usage: BillingUsage): boolean {
  return (
    usage.proposals.used === 0 &&
    usage.activeProjects.used === 0 &&
    usage.voice.usedMinutes === 0 &&
    (usage.storage.usedBytes ?? 0) === 0 &&
    usage.otpCodes === 0
  );
}

/** The one status chip (decision 2): the trial first, then a pause, a cap, charges, a warning. */
function chipOf(
  usage: BillingUsage,
  needs: readonly UsageNeedRow[],
  words: UsageViewWords,
): BillingChip {
  const steps = [
    usage.proposals.usage,
    usage.activeProjects.usage,
    usage.voice.usage,
    usage.storage.usage,
  ];
  if (onTrial(usage)) return { word: words.chips.trial, tone: 'info' };
  if (steps.some((step) => step.step === 'paused'))
    return { word: words.chips.paused, tone: 'danger' };
  if (steps.some(isSignal)) return { word: words.chips.atLimit, tone: 'warning' };
  if (usage.voice.soFar !== null || usage.voice.usage.step === 'overage') {
    return { word: words.chips.past, tone: 'info' };
  }
  if (needs.length > 0 || steps.some(inNeeds))
    return { word: words.chips.nearing, tone: 'warning' };
  return { word: words.chips.within, tone: 'success' };
}

/** `Bigger plans`, naming the plans above this one; `Pick a plan` on a trial (decision 11). */
function plansOf(tier: Tier | null, words: UsageViewWords): UsagePageView['plans'] {
  if (tier === null) return { title: words.pickAPlan, subtitle: null };
  const above = TIERS.slice(TIERS.indexOf(tier) + 1);
  if (above.length === 0) return null;
  return {
    title: words.biggerPlans,
    subtitle: words.plansAbove(above.map((each) => words.view.tier(each))),
  };
}

const notBilled = (words: UsageViewWords): BillingChip => ({
  word: words.notBilled,
  tone: 'neutral',
});
