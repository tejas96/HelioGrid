import type { TenantOwners, TranslatedText } from '@heliogrid/contracts';
import { FIGURE_SLOT, type UiLanguage } from '@heliogrid/domain';
import { type MessageRef, packWords, type Translator } from '../runtime';
import { BILLING_HOME, billingViewWords } from './billing-home';
import { dataTableWords } from './data-table';
import { PRICING } from './pricing';
import { ownersHolder } from './role-card';
import { usageMeterWords } from './usage-meter';

/**
 * The usage screen's words (`SCR-M12-04`). Plan names, the limits' labels and the price list's
 * line are Billing's (`BILLING_HOME`, `PRICING`); a rate inside a sentence is `FIGURE_SLOT`, so the
 * reader's language places it and the screen draws it in mono (`F7-09`).
 */

type T = Translator['t'];

const USAGE_PAGE = {
  limits: PRICING.limits,
  included: /*i18n*/ { id: 'Included each month' },
  proposals: /*i18n*/ { id: 'Proposals this month' },
  otpCodes: /*i18n*/ { id: 'OTP codes' },
  minutes: /*i18n*/ { id: 'min' },
  within: /*i18n*/ { id: 'Within plan' },
  nearing: /*i18n*/ { id: 'Nearing a limit' },
  past: /*i18n*/ { id: 'Past what’s included' },
  onTrial: /*i18n*/ { id: 'On trial' },
  atLimit: /*i18n*/ { id: 'At a limit' },
  paused: /*i18n*/ { id: 'Paused' },
  atTheCap: /*i18n*/ { id: 'At the cap' },
  soFar: /*i18n*/ { id: 'So far' },
  charges: /*i18n*/ { id: 'Charges' },
  notBilled: /*i18n*/ { id: 'Not billed' },
  payAsYouGo: /*i18n*/ { id: 'Pay as you go' },
  trackedOnly: /*i18n*/ { id: 'Tracked only' },
  noLimitTrial: /*i18n*/ { id: 'No limit on the trial' },
  noLimitOn: /*i18n*/ { id: 'No limit on {plan}' },
  biggerPlans: /*i18n*/ { id: 'Bigger plans' },
  pickAPlan: /*i18n*/ { id: 'Pick a plan' },
  nothingUsedTitle: /*i18n*/ { id: 'Nothing used yet' },
  nothingUsedBody: /*i18n*/ {
    id: 'Nothing has been used this cycle. Your caps and what’s included are below, ready when you start.',
  },
  callTitle: /*i18n*/ { id: 'Call' },
  codeTitle: /*i18n*/ { id: 'Sign-in code' },
  noCallsTitle: /*i18n*/ { id: 'No calls this cycle' },
  noCallsBody: /*i18n*/ { id: 'Each call the voice agent makes is listed here.' },
  noCodesTitle: /*i18n*/ { id: 'No codes this cycle' },
  noCodesBody: /*i18n*/ { id: 'Each sign-in code sent for your company is listed here.' },
  range: /*i18n*/ { id: '{from} – {to}' },
  plansAbove: /*i18n*/ { id: '{plans}' },
  cycleLine: /*i18n*/ { id: '{range} · resets {date}' },
  trialLine: /*i18n*/ { id: '{days}-day trial · {range}' },
  percentUsed: /*i18n*/ { id: '{percent}% used' },
  usedOf: /*i18n*/ { id: '{used} of {limit}' },
  usedOfUnit: /*i18n*/ { id: '{used} of {limit} {unit}' },
  aMonth: /*i18n*/ { id: '{count} a month' },
  rateAMinute: /*i18n*/ { id: '{rate} a minute' },
  rateBeyond: /*i18n*/ { id: '{rate} a minute beyond {bundle}' },
  minutesFigure: /*i18n*/ { id: '{count} min' },
  gbFigure: /*i18n*/ { id: '{count} GB' },
  limitsAndRates: /*i18n*/ { id: 'Limits and rates · {list}' },
  asOf: /*i18n*/ { id: 'As of {date}, {time}' },
  limitsCaption: /*i18n*/ { id: 'Every cap and ceiling on {plan} · {cycle}' },
  includedCaption: /*i18n*/ { id: 'Every meter on {plan} · {cycle}' },
  limitsCaptionTrial: /*i18n*/ { id: 'Every cap and ceiling on the trial · {cycle}' },
  includedCaptionTrial: /*i18n*/ { id: 'Every meter on the trial · {cycle}' },
  scope: /*i18n*/ { id: 'Only {holder} can see this cycle’s usage.' },
  bundleWarning: /*i18n*/ { id: 'Beyond {bundle}, {rate} a minute — no pause, it bills.' },
  capWarning: /*i18n*/ { id: 'At the cap, a 7-day grace, then new ones pause.' },
  trialVoiceWarning: /*i18n*/ { id: 'At the cap, a 7-day grace, then calls pause.' },
  grace: /*i18n*/ { id: 'Grace ends {date} · reading, editing and export never stop.' },
  pausedUntil: /*i18n*/ {
    id: 'Paused until {date} or an upgrade · reading, editing and export never stop.',
  },
  trialVoicePaused: /*i18n*/ {
    id: 'Paused until {date} or an upgrade · call from your own phone.',
  },
  storageWarning: /*i18n*/ { id: 'Past {ceiling}, new uploads pause · files you have stay.' },
  storagePaused: /*i18n*/ {
    id: 'New uploads paused · remove files or pick a bigger plan · reading and export never stop.',
  },
  eventsMinutes: /*i18n*/ { id: '{cycle} · {minutes} min' },
  eventsCodes: /*i18n*/ { id: '{cycle} · {count, plural, one {# code} other {# codes}}' },
  callDuration: /*i18n*/ { id: '{minutes} min {seconds} s' },
  eventAt: /*i18n*/ { id: '{date}, {time}' },
  loading: /*i18n*/ { id: 'Loading this cycle’s usage' },
  errorTitle: /*i18n*/ { id: 'Couldn’t read this cycle’s usage' },
  errorMessage: /*i18n*/ { id: 'Try again — this screen only ever shows the billed figures.' },
  thisCycle: /*i18n*/ { id: 'This cycle' },
  cycle: /*i18n*/ { id: 'Cycle' },
  resets: /*i18n*/ { id: 'Resets' },
  extraCharges: PRICING.setCharges,
  billsOn: /*i18n*/ { id: 'Bills on' },
  eventsThisCycle: /*i18n*/ { id: 'Events this cycle' },
  eventsFailed: /*i18n*/ { id: 'Couldn’t read these events' },
  eventsLoading: /*i18n*/ { id: 'Loading these events' },
  showMore: /*i18n*/ { id: 'Show more' },
  close: /*i18n*/ { id: 'Close' },
  eventsOf: /*i18n*/ { id: '{meter} — events this cycle' },
  limit: /*i18n*/ { id: 'Limit' },
  usedThisCycle: /*i18n*/ { id: 'Used this cycle' },
  allowed: /*i18n*/ { id: 'Allowed' },
  meter: /*i18n*/ { id: 'Meter' },
  includedColumn: PRICING.setIncluded,
  rate: /*i18n*/ { id: 'Rate' },
  chargesSoFar: /*i18n*/ { id: 'Charges so far' },
} satisfies Record<string, MessageRef>;

/** What the view model says — `packages/ui`'s `UsageViewWords`. */
export function usageViewWords(t: T, reader: UiLanguage) {
  const W = USAGE_PAGE;
  return {
    view: billingViewWords(t),
    needsYou: t(BILLING_HOME.needsYou),
    limits: t(W.limits),
    included: t(W.included),
    proposals: t(W.proposals),
    otpCodes: t(W.otpCodes),
    minutes: t(W.minutes),
    chips: {
      within: t(W.within),
      nearing: t(W.nearing),
      past: t(W.past),
      trial: t(W.onTrial),
      atLimit: t(W.atLimit),
      paused: t(W.paused),
    },
    atTheCap: t(W.atTheCap),
    paused: t(W.paused),
    soFar: t(W.soFar),
    charges: t(W.charges),
    notBilled: t(W.notBilled),
    payAsYouGo: t(W.payAsYouGo),
    trackedOnly: t(W.trackedOnly),
    noLimitTrial: t(W.noLimitTrial),
    biggerPlans: t(W.biggerPlans),
    pickAPlan: t(W.pickAPlan),
    nothingUsedTitle: t(W.nothingUsedTitle),
    nothingUsedBody: t(W.nothingUsedBody),
    callTitle: t(W.callTitle),
    codeTitle: t(W.codeTitle),
    noCalls: { title: t(W.noCallsTitle), body: t(W.noCallsBody) },
    noCodes: { title: t(W.noCodesTitle), body: t(W.noCodesBody) },
    range: (from: string, to: string) => t(W.range, { from, to }),
    plansAbove: (plans: readonly TranslatedText[]) => t(W.plansAbove, { plans: plans.join(' · ') }),
    cycleLine: (range: string, date: string) => t(W.cycleLine, { range, date }),
    trialLine: (days: number, range: string) => t(W.trialLine, { days, range }),
    percentUsed: (percent: number) => t(W.percentUsed, { percent }),
    usedOf: (used: string, limit: string, unit: TranslatedText | null) =>
      unit === null ? t(W.usedOf, { used, limit }) : t(W.usedOfUnit, { used, limit, unit }),
    noLimitOn: (plan: TranslatedText) => t(W.noLimitOn, { plan }),
    aMonth: (count: string) => t(W.aMonth, { count }),
    rateAMinute: (rate: string) => t(W.rateAMinute, { rate }),
    rateBeyond: (rate: string, bundle: string) => t(W.rateBeyond, { rate, bundle }),
    minutesFigure: (count: string) => t(W.minutesFigure, { count }),
    gbFigure: (count: string) => t(W.gbFigure, { count }),
    limitsAndRates: (list: TranslatedText) => t(W.limitsAndRates, { list }),
    asOf: (date: string, time: string) => t(W.asOf, { date, time }),
    limitsCaption: (plan: TranslatedText | null, cycle: string) =>
      plan === null ? t(W.limitsCaptionTrial, { cycle }) : t(W.limitsCaption, { plan, cycle }),
    includedCaption: (plan: TranslatedText | null, cycle: string) =>
      plan === null ? t(W.includedCaptionTrial, { cycle }) : t(W.includedCaption, { plan, cycle }),
    scope: (owners: TenantOwners | null) => {
      if (owners === null) return null;
      const holder = ownersHolder(t, {
        names: owners.owners.map((owner) => owner.name),
        more: owners.more,
      });
      return holder === null ? null : t(W.scope, { holder });
    },
    lines: {
      bundleWarning: (bundle: string) => t(W.bundleWarning, { bundle, rate: FIGURE_SLOT }),
      capWarning: () => t(W.capWarning),
      trialVoiceWarning: () => t(W.trialVoiceWarning),
      grace: (date: string) => t(W.grace, { date }),
      paused: (date: string) => t(W.pausedUntil, { date }),
      trialVoicePaused: (date: string) => t(W.trialVoicePaused, { date }),
      storageWarning: (ceiling: string) => t(W.storageWarning, { ceiling }),
      storagePaused: () => t(W.storagePaused),
    },
    eventsSubtitleMinutes: (cycle: string, minutes: string) =>
      t(W.eventsMinutes, { cycle, minutes }),
    eventsSubtitleCodes: (cycle: string, count: number) => t(W.eventsCodes, { cycle, count }),
    callDuration: (minutes: string, seconds: string) => t(W.callDuration, { minutes, seconds }),
    eventAt: (date: string, time: string) => t(W.eventAt, { date, time }),
    packText: (label: Parameters<typeof packWords>[0]) => packWords(label, reader),
  };
}

/** The tables' own words at 1536. */
export interface UsageTableWords extends ReturnType<typeof dataTableWords> {}

/** What only the markup says — `packages/ui`'s `UsagePageWords`. */
export function usagePageWords(t: T) {
  const W = USAGE_PAGE;
  const table: UsageTableWords = dataTableWords(t);
  return {
    needsYou: t(BILLING_HOME.needsYou),
    loading: t(W.loading),
    errorTitle: t(W.errorTitle),
    errorMessage: t(W.errorMessage),
    tryAgain: t(BILLING_HOME.tryAgain),
    thisCycle: t(W.thisCycle),
    cycle: t(W.cycle),
    resets: t(W.resets),
    extraCharges: t(W.extraCharges),
    soFar: t(W.soFar),
    billsOn: t(W.billsOn),
    eventsThisCycle: t(W.eventsThisCycle),
    actualUsage: t(BILLING_HOME.actualUsage),
    eventsFailed: t(W.eventsFailed),
    eventsLoading: t(W.eventsLoading),
    showMore: t(W.showMore),
    close: t(W.close),
    columns: {
      limit: t(W.limit),
      used: t(W.usedThisCycle),
      allowed: t(W.allowed),
      meter: t(W.meter),
      included: t(W.includedColumn),
      rate: t(W.rate),
      charges: t(W.chargesSoFar),
    },
    usageMeter: usageMeterWords(t),
    table,
    eventsOf: (meter: TranslatedText) => t(W.eventsOf, { meter }),
  };
}
