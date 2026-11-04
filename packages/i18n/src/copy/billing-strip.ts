import type { TenantOwners, TranslatedText, UiLanguage } from '@heliogrid/contracts';
import {
  type BillingCapability,
  type BillingPhase,
  FIGURE_SLOT,
  type PackLabel,
  pauseNoticeOf,
} from '@heliogrid/domain';
import { type MessageRef, packWords, type Translator } from '../runtime';
import { assembled } from './assembled';
import { bannerWords } from './banner';
import { BILLING_HOME, billingScopeWords } from './billing-home';
import { billingCapabilityName } from './billing-notices';
import { derivationWords } from './derivation';
import { SHELL } from './shell';

/**
 * The shell's billing strip, its trial chip and the denial (`SCR-SHELL-06`). Every pause line names
 * what paused, until when and the act that ends it (`M12-31`): what paused and what still works are
 * the soft-block matrix's (`pauseNoticeOf`) or the cap's own, never a generic "account limited". A
 * figure inside a label is `FIGURE_SLOT`, placed in mono where the translation put it (`F7-09`).
 */

type T = Translator['t'];

export const BILLING_STRIP = {
  paused: /*i18n*/ { id: 'Paused' },
  stillWorks: /*i18n*/ { id: 'Still works' },
  until: /*i18n*/ { id: 'Until' },
  graceDayTitle: /*i18n*/ { id: 'Payment failed · day {day} of the 7-day grace' },
  graceEarly: /*i18n*/ { id: 'Payment failed · day {day} of 7 · a retry is coming' },
  haltedTitle: /*i18n*/ { id: 'Account halted · the grace window closed' },
  trialEndedOn: /*i18n*/ { id: 'Your trial ended on {date}' },
  subscriptionEnded: /*i18n*/ { id: 'Subscription ended · reactivate to continue' },
  loading: /*i18n*/ { id: 'Loading your billing state' },
  failedTitle: /*i18n*/ { id: "Couldn't read your billing state" },
  tryAgain: /*i18n*/ { id: 'Try again' },
  trialDaysLeft: /*i18n*/ {
    id: '{days, plural, one {# day left in your trial} other {# days left in your trial}}',
  },
  trialEnds: /*i18n*/ { id: 'Trial ends' },
  finalWarning: /*i18n*/ { id: 'Payment failed · day {day} of 7 · final warning' },
  everythingIncluded: /*i18n*/ { id: 'Everything — voice calls and invites included' },
  amountDue: /*i18n*/ { id: 'Amount due' },
  meteredPause: /*i18n*/ { id: 'Voice calls and invites pause' },
  accountHalts: /*i18n*/ { id: 'Account halts' },
  cycleResets: /*i18n*/ { id: 'Cycle resets' },
  updateMethod: /*i18n*/ { id: 'Update your payment method' },
  payNow: /*i18n*/ { id: 'Pay {amount} now' },
  payWith: /*i18n*/ { id: 'Pay {amount} with {method}' },
  reactivateWith: /*i18n*/ { id: 'Reactivate with one payment of {amount}' },
  pickPlan: /*i18n*/ { id: 'Pick a plan' },
  upgradePlan: /*i18n*/ { id: 'Upgrade plan' },
  stripFigures: /*i18n*/ { id: 'Grace day and amount' },
  graceDay: /*i18n*/ { id: 'Grace day' },
  graceCounted: /*i18n*/ {
    id: 'Day {day} counted from the charge that failed on {date}, which is day 0 of the 7-day grace.',
  },
  amountOnInvoice: /*i18n*/ { id: '{amount} on invoice {number}' },
  graceCountedFrom: /*i18n*/ {
    id: 'Counted from the charge that failed on {date}, which is day 0 of the 7-day grace.',
  },
  capGrace: /*i18n*/ { id: '{meter} · {usage} · 7-day grace running' },
  capPaused: /*i18n*/ { id: '{meter} · {usage} · {paused} paused' },
  capAtLimit: /*i18n*/ { id: '{meter} · at its limit' },
  limitReached: /*i18n*/ { id: 'limit reached' },
  everyOtherFeature: /*i18n*/ { id: 'every other feature' },
  reading: /*i18n*/ { id: 'reading' },
  export: /*i18n*/ { id: 'export' },
  paymentOverdue: /*i18n*/ { id: 'Payment overdue' },
  trialEnded: /*i18n*/ { id: 'Trial ended' },
  accountHalted: /*i18n*/ { id: 'Account halted' },
  subscriptionEndedOverline: /*i18n*/ { id: 'Subscription ended' },
  limitOverline: /*i18n*/ { id: '{meter} limit reached' },
  denialLists: /*i18n*/ { id: 'What is paused and what still works' },
  billingState: /*i18n*/ { id: 'Billing state' },
} as const;

/** A capped meter in the strip's words: its name, what pauses, and what never does (decision 9). */
interface MeterCopy {
  readonly name: MessageRef;
  /** `New proposals`, as the `Paused` row and the dated row name it. */
  readonly newOnes: MessageRef;
  /** The same, inside a title. */
  readonly newOnesInline: MessageRef;
  /** `editing, duplicating and sharing existing proposals`, inside a list. */
  readonly existing: MessageRef;
  /** Its dated row while the grace runs. */
  readonly pauses: MessageRef;
  /** Its count against the limit while the grace runs, and once paused. */
  readonly usedInGrace: MessageRef;
  readonly usedPaused: MessageRef;
}

const METERS: Record<string, MeterCopy> = {
  proposals: {
    name: /*i18n*/ { id: 'Proposals' },
    newOnes: /*i18n*/ { id: 'New proposals' },
    newOnesInline: /*i18n*/ { id: 'new proposals' },
    existing: /*i18n*/ { id: 'editing, duplicating and sharing existing proposals' },
    pauses: /*i18n*/ { id: 'New proposals pause' },
    usedInGrace: /*i18n*/ { id: '{used} of {limit} used this month' },
    usedPaused: /*i18n*/ { id: '{used} of {limit} used' },
  },
  active_projects: {
    name: /*i18n*/ { id: 'Active projects' },
    newOnes: /*i18n*/ { id: 'New projects' },
    newOnesInline: /*i18n*/ { id: 'new projects' },
    existing: /*i18n*/ { id: 'editing existing projects' },
    pauses: /*i18n*/ { id: 'New projects pause' },
    usedInGrace: /*i18n*/ { id: '{used} of {limit} active' },
    usedPaused: /*i18n*/ { id: '{used} of {limit} active' },
  },
  voice_minutes: {
    name: /*i18n*/ { id: 'Voice minutes' },
    newOnes: /*i18n*/ { id: 'New voice calls' },
    newOnesInline: /*i18n*/ { id: 'new voice calls' },
    existing: /*i18n*/ { id: 'listening to past calls' },
    pauses: /*i18n*/ { id: 'Voice calls pause' },
    usedInGrace: /*i18n*/ { id: '{used} of {limit} minutes used' },
    usedPaused: /*i18n*/ { id: '{used} of {limit} minutes used' },
  },
  storage: {
    name: /*i18n*/ { id: 'Storage' },
    newOnes: /*i18n*/ { id: 'New uploads' },
    newOnesInline: /*i18n*/ { id: 'new uploads' },
    existing: /*i18n*/ { id: 'opening and downloading existing files' },
    pauses: /*i18n*/ { id: 'New uploads pause' },
    usedInGrace: /*i18n*/ { id: '{used} of {limit} used' },
    usedPaused: /*i18n*/ { id: '{used} of {limit} used' },
  },
};

/** A meter a newer api names before this release knows it still reads as a limit, never a code. */
const ANOTHER_METER: MeterCopy = {
  name: /*i18n*/ { id: 'This limit' },
  newOnes: /*i18n*/ { id: 'New items of this kind' },
  newOnesInline: /*i18n*/ { id: 'new items of this kind' },
  existing: /*i18n*/ { id: 'editing what exists' },
  pauses: /*i18n*/ { id: 'New items of this kind pause' },
  usedInGrace: /*i18n*/ { id: '{used} of {limit} used' },
  usedPaused: /*i18n*/ { id: '{used} of {limit} used' },
};

/** The denial's title: what the refused save was, by the capability that refused it (decision 7). */
const DENIED = {
  read_and_search: /*i18n*/ { id: 'Reading is paused' },
  export: /*i18n*/ { id: 'Export is paused' },
  customer_links: /*i18n*/ { id: 'Customer links are paused' },
  billing_screens: /*i18n*/ { id: 'Billing is paused' },
  create_edit_records: /*i18n*/ { id: 'Creating and editing records is paused' },
  studio_design_edit: /*i18n*/ { id: 'Editing designs is paused' },
  sell_and_deliver: /*i18n*/ { id: 'Selling and delivery are paused' },
  new_file_upload: /*i18n*/ { id: 'New file uploads are paused' },
  pending_field_photo_upload: /*i18n*/ { id: 'Uploading field photos is paused' },
  voice_agent: /*i18n*/ { id: 'Voice calls are paused' },
  team_invites: /*i18n*/ { id: 'Inviting a teammate is paused' },
} satisfies Record<BillingCapability, MessageRef>;

/** A capability a newer api names before this release knows it. */
const ANOTHER_DENIAL = /*i18n*/ { id: 'This is paused' };

/** The denial's overline: the state that refused the save. */
const OVERLINE: Record<BillingPhase, MessageRef> = {
  trialing: BILLING_STRIP.trialEnded,
  active: BILLING_STRIP.paymentOverdue,
  past_due_full_function: BILLING_STRIP.paymentOverdue,
  past_due_metered_paused: BILLING_STRIP.paymentOverdue,
  halted: BILLING_STRIP.accountHalted,
  expired: BILLING_STRIP.trialEnded,
  cancelled_post_period: BILLING_STRIP.subscriptionEndedOverline,
};

/** The strip's and the denial's words; a builder in `packages/ui` places each figure. */
export function billingStripWords(t: T) {
  const meter = (name: string) => METERS[name] ?? ANOTHER_METER;
  const fixed = Object.fromEntries(
    Object.entries(BILLING_STRIP).map(([key, message]) => [key, t(message)]),
  ) as Record<keyof typeof BILLING_STRIP, TranslatedText>;
  return {
    ...fixed,
    /** The strip's title in the grace: `day {day} of 7`, with a retry coming while nothing paused. */
    graceTitle: (day: number, early: boolean) =>
      t(early ? BILLING_STRIP.graceEarly : BILLING_STRIP.graceDayTitle, { day }),
    trialEndedOn: (date: string) => t(BILLING_STRIP.trialEndedOn, { date }),
    /** The matrix's lists for a phase, each joined with ` · ` as the strip's rows show them. */
    matrix: (phase: BillingPhase) => {
      const { paused, stillWorks } = pauseNoticeOf(phase);
      const list = (capabilities: readonly BillingCapability[]) =>
        assembled(
          capabilities.map((capability) => billingCapabilityName(t, capability)).join(' · '),
        );
      return { paused: list(paused), stillWorks: list(stillWorks) };
    },
    howWorkedOut: derivationWords(t).kinds.formula,
    derivationKinds: derivationWords(t).kinds,
    amount: t(BILLING_HOME.amount),
    moreLabel: bannerWords(t).moreLabel,
    trialDaysLeft: (days: number) => t(BILLING_STRIP.trialDaysLeft, { days }),
    finalWarning: (day: number) => t(BILLING_STRIP.finalWarning, { day }),
    /** With no amount, the figure's place as `FIGURE_SLOT`; with one, the line a screen reader hears. */
    payNow: (amount: string = FIGURE_SLOT) => t(BILLING_STRIP.payNow, { amount }),
    payWith: (method: string, amount: string = FIGURE_SLOT) =>
      t(BILLING_STRIP.payWith, { amount, method }),
    reactivateWith: (amount: string = FIGURE_SLOT) => t(BILLING_STRIP.reactivateWith, { amount }),
    amountOnInvoice: () =>
      t(BILLING_STRIP.amountOnInvoice, { amount: FIGURE_SLOT, number: FIGURE_SLOT }),
    graceCounted: (day: number, date: string) => t(BILLING_STRIP.graceCounted, { day, date }),
    graceCountedFrom: (date: string) => t(BILLING_STRIP.graceCountedFrom, { date }),
    meterName: (name: string) => t(meter(name).name),
    newOnes: (name: string) => t(meter(name).newOnes),
    pauses: (name: string) => t(meter(name).pauses),
    existing: (name: string) => t(meter(name).existing),
    capGrace: (name: string, usage: string) =>
      t(BILLING_STRIP.capGrace, { meter: t(meter(name).name), usage }),
    capPaused: (name: string, usage: string) =>
      t(BILLING_STRIP.capPaused, {
        meter: t(meter(name).name),
        usage,
        paused: t(meter(name).newOnesInline),
      }),
    capAtLimit: (name: string) => t(BILLING_STRIP.capAtLimit, { meter: t(meter(name).name) }),
    usedInGrace: (name: string, used: string, limit: string) =>
      t(meter(name).usedInGrace, { used, limit }),
    usedPaused: (name: string, used: string, limit: string) =>
      t(meter(name).usedPaused, { used, limit }),
    denied: (capability: string) =>
      t(capability in DENIED ? DENIED[capability as BillingCapability] : ANOTHER_DENIAL),
    overline: (phase: BillingPhase) => t(OVERLINE[phase]),
    limitOverline: (name: string) => t(BILLING_STRIP.limitOverline, { meter: t(meter(name).name) }),
    scope: (owners: TenantOwners | null) => billingScopeWords(t, owners),
  };
}
export type BillingStripCopy = ReturnType<typeof billingStripWords>;

/** The shell's strip words in the reader's language: the rail's name a pack gives, put in words. */
export function shellBillingWords(t: T, reader: UiLanguage) {
  return {
    ...billingStripWords(t),
    packText: (label: PackLabel) => packWords(label, reader),
  };
}

/** The denial's own words. */
export function billingDenialWords(t: T) {
  return { lists: t(BILLING_STRIP.denialLists), closeLabel: t(SHELL.close) };
}
