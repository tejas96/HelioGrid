import type { BillingHome, BillingStanding, TranslatedText } from '@heliogrid/contracts';
import { MS_PER_DAY, scaledPower, TRIAL_DAYS } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import { workingOf } from './BillingHome.needs';
import type { BillingCountdown, BillingFact, BillingPlanView } from './BillingHome.types';
import { fact, figure, figured, plain } from './BillingHome.values';
import type { BillingInput, BillingViewWords } from './BillingHome.words';

/**
 * `Your plan` — `SCR-M12-03`'s block (inherited): three pairs and the state as its one chip. On a
 * trial or after a lapse the chip changes and the end date takes the price row's place.
 */
export function planOf(input: BillingInput, home: BillingHome): BillingPlanView {
  const { words, format } = input;
  const { standing } = home;
  const enterprise = standing.tier === 'enterprise';
  const source = enterprise
    ? words.yourContract
    : standing.tier === null
      ? null
      : priceListOf(input, home);
  return {
    chip: planChipOf(words, standing, input.now),
    countdown: countdownOf(input, home),
    rows: planRowsOf(input, home),
    working:
      home.taxScheme !== null && home.plan.nextBill !== null
        ? workingOf(input, home, home.plan.nextBill.sale, null)
        : null,
    source,
    route: enterprise
      ? { title: words.talkToUs, subtitle: words.namedContact }
      : { title: words.changePlan, subtitle: null },
    includes: includesOf(words, format, home),
    scope: null,
  };
}

/**
 * The page's one summary line under its title — *Trial · 14 days left · ends 21 Nov 2026*, *Growth ·
 * renews 21 Dec 2026* — or none on a state the needs region speaks for.
 */
export function summaryOf(input: BillingInput, home: BillingHome): TranslatedText | null {
  const { words, format, now } = input;
  const { standing } = home;
  const plan = standing.tier === null ? words.trial : words.tier(standing.tier);
  if (standing.state === 'trialing' && standing.trialEndsAt !== null) {
    const days = Math.max(0, Math.ceil((Date.parse(standing.trialEndsAt) - now) / MS_PER_DAY));
    return words.summaryTrial(plan, format.number(days), days, format.date(standing.trialEndsAt));
  }
  const renewsAt = home.renewal?.dueAt ?? home.plan.nextBill?.at ?? null;
  if (standing.state !== 'active' || renewsAt === null) return null;
  return words.summaryRenews(plan, format.date(renewsAt));
}

/** `India price list · 1 Apr 2026` — the list's one source line, never a tier (owner ruling). */
export function priceListOf(input: BillingInput, home: BillingHome): TranslatedText {
  return input.words.priceList(input.marketName, input.format.date(home.priceListPublishedAt));
}

/** The state's chip; a cancelled plan still running is a warning, not yet the end. */
export function planChipOf(
  words: BillingViewWords,
  standing: BillingStanding,
  now: number,
): BillingPlanView['chip'] {
  const tone = {
    trialing: 'info',
    active: 'success',
    past_due: 'danger',
    halted: 'danger',
    expired: 'danger',
    cancelled: 'danger',
  } as const;
  const running =
    standing.state === 'cancelled' &&
    standing.paidPeriodEnd !== null &&
    Date.parse(standing.paidPeriodEnd) > now;
  return {
    word: words.stateWord(standing.state),
    tone: running ? 'warning' : tone[standing.state],
  };
}

/**
 * The hero's ring: the trial's days left of its 14, or a paid period's days to its next bill out of
 * the period's own length, read back one cycle from that date. Nothing runs on a dead state.
 */
function countdownOf(input: BillingInput, home: BillingHome): BillingCountdown | null {
  const { words, format, now } = input;
  const { standing } = home;
  const daysUntil = (at: number) => Math.max(0, Math.ceil((at - now) / MS_PER_DAY));
  if (standing.state === 'trialing' && standing.trialEndsAt !== null) {
    const left = daysUntil(Date.parse(standing.trialEndsAt));
    const figure = format.number(left);
    return {
      share: left / TRIAL_DAYS,
      figure,
      caption: words.ringDaysLeft,
      spoken: words.ringSpokenLeft(figure, format.number(TRIAL_DAYS)),
    };
  }
  const next = home.plan.nextBill;
  if (standing.state !== 'active' || next === null || standing.cycle === null) return null;
  const end = Date.parse(next.at);
  const start = new Date(end);
  if (standing.cycle === 'yearly') start.setUTCFullYear(start.getUTCFullYear() - 1);
  else start.setUTCMonth(start.getUTCMonth() - 1);
  const left = daysUntil(end);
  const figure = format.number(left);
  return {
    share: left / Math.max(1, Math.round((end - start.getTime()) / MS_PER_DAY)),
    figure,
    caption: words.ringToRenewal,
    spoken: words.ringSpokenRenewal(figure),
  };
}

function planRowsOf(input: BillingInput, home: BillingHome): BillingFact[] {
  const { words, format } = input;
  const { standing } = home;
  const date = (value: string | null) => (value === null ? '' : format.date(value));
  const planRow = fact(
    'plan',
    words.plan,
    standing.tier === null ? words.trial : words.tier(standing.tier),
  );
  switch (standing.state) {
    case 'trialing': {
      const left = Math.max(
        0,
        Math.ceil((Date.parse(standing.trialEndsAt ?? '') - input.now) / MS_PER_DAY),
      );
      const days = words.daysOf(format.number(left), format.number(TRIAL_DAYS));
      return [
        planRow,
        fact('left', words.daysLeft, days),
        fact('ends', words.ends, date(standing.trialEndsAt)),
      ];
    }
    case 'expired':
      return [planRow, fact('ended', words.ended, date(standing.trialEndsAt))];
    case 'halted':
      return [planRow, fact('since', words.haltedSince, date(standing.stateEnteredAt))];
    case 'cancelled': {
      const end = standing.paidPeriodEnd;
      const running = end !== null && Date.parse(end) > input.now;
      return running
        ? [planRow, ...priceRowOf(input, home), fact('until', words.runsUntil, date(end))]
        : [planRow, fact('ended', words.ended, date(end))];
    }
    default: {
      if (home.renewal !== null) {
        return [
          planRow,
          ...priceRowOf(input, home),
          fact('renews', words.renews, date(home.renewal.dueAt)),
        ];
      }
      const next = home.plan.nextBill;
      /* A scheduled change bills its new plan from the next bill on (frame 16, decision 12). */
      const nextSale = home.scheduledChange?.afterwards ?? next?.sale;
      const nextRow: BillingFact[] =
        next === null || nextSale === undefined
          ? []
          : [
              {
                key: 'next',
                label: words.nextBill,
                value: plain(format.date(next.at)),
                under: figure(format.money(nextSale.total, { fractionDigits: 2 })),
              },
            ];
      return [planRow, ...priceRowOf(input, home), ...nextRow];
    }
  }
}

/** `₹3,999 / mo` — a list price prints whole; the cycle rides it, and `+ GST` once registered. */
function priceRowOf(input: BillingInput, home: BillingHome): BillingFact[] {
  const { listPrice } = home.plan;
  const { cycle } = home.standing;
  if (listPrice === null || cycle === null) return [];
  return [
    {
      key: 'price',
      label: input.words.price,
      value: figured(
        input.words.perCycle(cycle, home.taxScheme),
        input.format.money(listPrice, { fractionDigits: 0 }),
      ),
      under: null,
    },
  ];
}

/** The plan's published limits, or the trial's caps (decision 16), opened in place. */
function includesOf(
  words: BillingViewWords,
  format: MarketFormat,
  home: BillingHome,
): BillingFact[] {
  const { includes } = home;
  const limit = (value: number | 'unlimited' | 'custom', unit?: TranslatedText) => {
    if (value === 'unlimited') return words.notCapped;
    if (value === 'custom') return words.yourContract;
    return unit === undefined ? format.number(value) : `${format.number(value)} ${unit}`;
  };
  const voice =
    includes.voiceMinuteRate === null
      ? plain(limit(includes.voiceMinutesIncluded))
      : figured(words.perMinute(), format.money(includes.voiceMinuteRate));
  return [
    fact('design', words.limits.biggestDesign, designOf(includes.designCeilingKw, words, format)),
    fact('proposals', words.limits.proposalsMonth, limit(includes.proposalsPerMonth)),
    { key: 'voice', label: words.limits.voiceMinutes, value: voice, under: null },
    fact('storage', words.limits.storage, limit(includes.storageGb, words.gb)),
    fact('projects', words.limits.activeProjects, limit(includes.activeProjects)),
    fact('users', words.limits.users, words.limits.unlimited),
  ];
}

/** A design ceiling as the pricing page prints it — `500 kW`, `100 MW`; the unit never translates. */
function designOf(
  kw: number | 'unlimited' | 'custom',
  words: BillingViewWords,
  format: MarketFormat,
): string {
  if (kw === 'unlimited') return words.notCapped;
  if (kw === 'custom') return words.yourContract;
  const { amount, unit } = scaledPower(kw);
  return words.power(format.number(amount), unit);
}
