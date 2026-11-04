import type { TranslatedText } from '@heliogrid/contracts';
import type { BillingPhase, BillingStripGo, Read } from '@heliogrid/domain';
import type { DerivationKind, DerivationKindWords } from '../Derivation/Derivation.types';

/**
 * `SCR-SHELL-06`'s billing strip: one title line, rows of one family — what paused, what still
 * works, the dated row and, for the Owner, the amount — the amount's working, then ONE act, or
 * whose act it is. The shell draws it with its act; Billing Home and Plan Selection draw it with
 * none (decision 3a). Both halves draw this one contract (Law 7); every figure arrives formatted.
 */

/**
 * A value as runs of words and figures: a figure — money, an invoice number — is drawn in mono
 * where the translation placed it (`F7-09`); a plain value is one run of words.
 */
export type BillingValue = readonly { readonly text: string; readonly mono: boolean }[];

/** One part of `How it is worked out`. */
export interface BillingWorkingPart {
  readonly kind: DerivationKind;
  readonly label: TranslatedText;
  readonly value: BillingValue;
}

/** A row's mark: only the two pause rows carry a semantic one (decision 2). */
export type BillingStripMark = 'paused' | 'works' | 'until' | 'amount';

export interface BillingStripRow {
  readonly key: string;
  readonly mark: BillingStripMark;
  readonly label: TranslatedText;
  readonly value: BillingValue;
}

export type { BillingStripGo };

export interface BillingStripView {
  readonly kind: 'dunning' | 'state' | 'cap' | 'bundle';
  /** A pill is the trial's quiet countdown chip: no rows, no act (`M12-53`). */
  readonly variant: 'block' | 'pill';
  readonly title: TranslatedText;
  readonly rows: readonly BillingStripRow[];
  /** The amount's working, the Owner's only (`F8-07`). */
  readonly working: {
    readonly label: TranslatedText;
    readonly parts: readonly BillingWorkingPart[];
  } | null;
  /** The ONE act, its label carrying its figure in mono; `null` on a page that holds the act. */
  readonly act: { readonly label: BillingValue; readonly go: BillingStripGo } | null;
  /** Whose act it is, in the act's place, for a person who is not the Owner (`M12-56`). */
  readonly scope: TranslatedText | null;
}

/** The words a drawn strip says itself. */
export interface BillingStripOwnWords {
  readonly howWorkedOut: TranslatedText;
  readonly derivationKinds: DerivationKindWords;
  moreLabel(hidden: number): TranslatedText;
}

export interface BillingStripProps {
  strip: BillingStripView;
  words: BillingStripOwnWords;
  /** The act; omitted where the strip carries none. */
  onAct?: () => void;
  /** The act is out: the act is inert and a second press sends nothing. */
  acting?: boolean;
  /** Why the act did not land, said under the strip, where the person acted. */
  failure?: TranslatedText | null;
}

/** The slot's words: the drawn strip's, and its read's wait and failure. */
export interface BillingStripSlotWords extends BillingStripOwnWords {
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly tryAgain: TranslatedText;
}

/**
 * The shell's slot: the strip's read. Loading holds the slot with no tone, glyph or numeral; a
 * failed read is neutral, never danger, with no figure and its `Try again`. The shell draws no
 * slot at all where there is nothing to say.
 */
export interface BillingStripSlotProps extends Omit<BillingStripProps, 'strip' | 'words'> {
  read: Exclude<Read<BillingStripView>, { kind: 'empty' }>;
  words: BillingStripSlotWords;
}

/** The words the strip's builder reads, from `packages/i18n`'s `billingStripWords`. */
export interface BillingStripWords extends BillingStripSlotWords {
  readonly paused: TranslatedText;
  readonly stillWorks: TranslatedText;
  readonly until: TranslatedText;
  readonly haltedTitle: TranslatedText;
  readonly subscriptionEnded: TranslatedText;
  readonly trialEnds: TranslatedText;
  readonly everythingIncluded: TranslatedText;
  readonly amountDue: TranslatedText;
  readonly meteredPause: TranslatedText;
  readonly accountHalts: TranslatedText;
  readonly cycleResets: TranslatedText;
  readonly updateMethod: TranslatedText;
  readonly pickPlan: TranslatedText;
  readonly upgradePlan: TranslatedText;
  readonly stripFigures: TranslatedText;
  readonly graceDay: TranslatedText;
  readonly amount: TranslatedText;
  readonly limitReached: TranslatedText;
  readonly everyOtherFeature: TranslatedText;
  readonly reading: TranslatedText;
  readonly export: TranslatedText;
  readonly billingState: TranslatedText;
  readonly denialLists: TranslatedText;
  graceTitle(day: number, early: boolean): TranslatedText;
  finalWarning(day: number): TranslatedText;
  trialDaysLeft(days: number): TranslatedText;
  trialEndedOn(date: string): TranslatedText;
  /** With no amount, its place as `FIGURE_SLOT`; with one, as a screen reader hears it. */
  payNow(amount?: string): TranslatedText;
  payWith(method: string, amount?: string): TranslatedText;
  reactivateWith(amount?: string): TranslatedText;
  graceCounted(day: number, date: string): TranslatedText;
  graceCountedFrom(date: string): TranslatedText;
  /** `{amount} on invoice {number}`: two `FIGURE_SLOT`s, the amount's first. */
  amountOnInvoice(): TranslatedText;
  meterName(meter: string): TranslatedText;
  newOnes(meter: string): TranslatedText;
  pauses(meter: string): TranslatedText;
  existing(meter: string): TranslatedText;
  capGrace(meter: string, usage: string): TranslatedText;
  capPaused(meter: string, usage: string): TranslatedText;
  capAtLimit(meter: string): TranslatedText;
  usedInGrace(meter: string, used: string, limit: string): TranslatedText;
  usedPaused(meter: string, used: string, limit: string): TranslatedText;
  denied(capability: string): TranslatedText;
  overline(phase: BillingPhase): TranslatedText;
  limitOverline(meter: string): TranslatedText;
  matrix(phase: BillingPhase): {
    readonly paused: TranslatedText;
    readonly stillWorks: TranslatedText;
  };
}
