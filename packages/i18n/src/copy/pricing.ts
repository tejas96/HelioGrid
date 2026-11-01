import type { TranslatedText } from '@heliogrid/contracts';
import type { Tier } from '@heliogrid/domain';
import type { MessageRef } from '../runtime';
import { TIER_LABEL } from './invoice-document';

/**
 * The public pricing page's words (`SCR-M12-01`). Plan names are `TIER_LABEL`'s, the same in every
 * language (`BM-11`). Each plan's positioning line and support terms are Tier-keyed screen copy
 * (`BM-14`, `BM-41`; owner ruling 2026-09-07): no book field carries them and nothing computes on
 * them. A market whose terms differ carries them as pack labels (`F1-22`), never here.
 */
/** A plan's name as words: the same in every language, so no translation can rename it (`BM-11`). */
export function planName(tier: Tier): TranslatedText {
  return TIER_LABEL[tier] as TranslatedText;
}

export const PLAN_POSITIONING: Record<Tier, MessageRef> = {
  starter: /*i18n*/ { id: 'For a home-rooftop team of 1 to 5 people.' },
  growth: /*i18n*/ { id: 'For 15 or more installs a month, or your first business sites.' },
  pro: /*i18n*/ { id: 'For business sites, with voice minutes included.' },
  enterprise: /*i18n*/ { id: 'For the largest designs and utility work.' },
};

export const PLAN_SUPPORT: Record<Tier, MessageRef> = {
  starter: /*i18n*/ { id: 'In the app' },
  growth: /*i18n*/ { id: 'App and WhatsApp' },
  pro: /*i18n*/ { id: 'Priority, and an onboarding call' },
  enterprise: /*i18n*/ { id: 'A named contact' },
};

/** What every plan includes (`BM-05`): one list for every plan, never a grid of ticks. */
export const PLAN_INCLUDES: readonly MessageRef[] = [
  /*i18n*/ { id: 'CRM' },
  /*i18n*/ { id: 'Projects' },
  /*i18n*/ { id: 'Customer links' },
  /*i18n*/ { id: 'All languages' },
];

export const STUDIO_INCLUDES: readonly MessageRef[] = [
  /*i18n*/ { id: 'Shadow analysis' },
  /*i18n*/ { id: 'All obstruction types' },
  /*i18n*/ { id: 'Tin-shed and metal roof' },
  /*i18n*/ { id: 'Ground mount' },
  /*i18n*/ { id: 'Structures' },
  /*i18n*/ { id: 'SLD, AC/DC and earthing layouts' },
  /*i18n*/ { id: 'Industrial drawing sheets' },
  /*i18n*/ { id: 'PV and energy reports' },
  /*i18n*/ { id: 'DXF, SVG and PDF export' },
];

export const PRICING = {
  title: /*i18n*/ { id: 'Plans and prices' },
  claim: /*i18n*/ {
    id: 'Every feature is in every plan — others hold features back for higher plans.',
  },
  includes: /*i18n*/ { id: 'What every plan includes' },
  everyPlan: /*i18n*/ { id: 'Every plan' },
  studio: /*i18n*/ { id: 'The full studio' },
  signIn: /*i18n*/ { id: 'Sign in' },
  startTrial: /*i18n*/ { id: 'Start free trial' },
  trialLine: /*i18n*/ { id: '{days} days, no card needed.' },
  cycle: /*i18n*/ { id: 'Billing cycle' },
  monthly: /*i18n*/ { id: 'Monthly' },
  yearly: /*i18n*/ { id: 'Yearly' },
  yearlyDeal: /*i18n*/ { id: '12 months for the price of 10' },
  plans: /*i18n*/ { id: 'Plans' },
  limits: /*i18n*/ { id: 'Limits' },
  proposalsAMonth: /*i18n*/ { id: '{count} proposals a month' },
  support: /*i18n*/ { id: 'Support' },
  allLimits: /*i18n*/ { id: 'All limits' },
  biggestDesign: /*i18n*/ { id: 'Biggest design' },
  proposalsMonth: /*i18n*/ { id: 'Proposals a month' },
  proposals: /*i18n*/ { id: 'Proposals' },
  activeProjects: /*i18n*/ { id: 'Active projects' },
  users: /*i18n*/ { id: 'Users' },
  voiceMinutesMonth: /*i18n*/ { id: 'Voice minutes a month' },
  voiceMinutes: /*i18n*/ { id: 'Voice minutes' },
  extraVoice: /*i18n*/ { id: 'Extra voice' },
  storage: /*i18n*/ { id: 'Storage' },
  unlimited: /*i18n*/ { id: 'Unlimited' },
  custom: /*i18n*/ { id: 'Custom' },
  none: /*i18n*/ { id: 'None' },
  notCapped: /*i18n*/ { id: 'Not capped' },
  notPublished: /*i18n*/ { id: 'Not published yet' },
  annual: /*i18n*/ { id: 'Annual contract' },
  talkToSales: /*i18n*/ { id: 'Talk to sales' },
  /** Enterprise's anchor: where the price sits is the language's — Hindi says `₹24,999 से`. */
  fromPrice: /*i18n*/ { id: 'From {price}' },
  aMonth: /*i18n*/ { id: 'a month' },
  aYear: /*i18n*/ { id: 'a year' },
  perMonth: /*i18n*/ { id: '{value} / mo' },
  perYear: /*i18n*/ { id: '{value} / yr' },
  perMinute: /*i18n*/ { id: '{value} / min' },
  compare: /*i18n*/ { id: 'Compare two plans' },
  plan: /*i18n*/ { id: 'Plan' },
  against: /*i18n*/ { id: 'Against' },
  show: /*i18n*/ { id: 'Show' },
  setLimits: /*i18n*/ { id: 'Limits' },
  setIncluded: /*i18n*/ { id: 'Included' },
  setCharges: /*i18n*/ { id: 'Extra charges' },
  allPlans: /*i18n*/ {
    id: '{count, select, 2 {Both plans} 3 {All three plans} 4 {All four plans} other {All plans}}',
  },
  comparedWith: /*i18n*/ { id: 'Compared with' },
  duringTrial: /*i18n*/ { id: 'During the trial' },
  priceList: /*i18n*/ { id: '{market} price list · {date}' },
  benchmarkSource: /*i18n*/ { id: '{competitor} price page · {date}' },
  pricesExclude: /*i18n*/ { id: 'Prices exclude {scheme}' },
  power: /*i18n*/ { id: '{amount} {unit}' },
  storageGb: /*i18n*/ { id: '{amount} GB' },
  atCapacity: /*i18n*/ { id: '{name} · {capacity}' },
  competitorRung: /*i18n*/ { id: '{competitor} {rung}' },
  pairCaption: /*i18n*/ { id: '{plan} · {against}' },
  loading: /*i18n*/ { id: 'Loading the prices' },
  emptyTitle: /*i18n*/ { id: 'No prices published for this market yet' },
  errorTitle: /*i18n*/ { id: 'Couldn’t load the prices' },
  errorMessage: /*i18n*/ { id: 'The price list didn’t answer.' },
  retry: /*i18n*/ { id: 'Try again' },
} satisfies Record<string, MessageRef>;
