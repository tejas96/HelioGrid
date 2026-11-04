import type { TranslatedText } from '@heliogrid/contracts';
import type { Ref } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type { DataTableWords } from '../DataTable/DataTable.types';
import type { DerivationKind, DerivationKindWords } from '../Derivation/Derivation.types';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';
import type { UsageMeterWords } from '../UsageMeter/UsageMeter.types';

/**
 * The billing home's body (`SCR-M12-02`): what needs the Owner, the plan, the usage, the payment
 * method, the latest invoices, the two record rows and the quiet cancel. Both halves draw this one
 * contract (Law 7). The apps own the shell around it, the record sheets and panels, the cancel and
 * refund asks, and every read and act. Every figure arrives formatted; nothing here computes money.
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

/** A word and its tone, drawn as a `StatusChip`. */
export interface BillingChip {
  readonly word: TranslatedText;
  readonly tone: StatusTone;
}

/** One row of a fact list: its label and its value, the value on the region's right edge. */
export interface BillingFact {
  readonly key: string;
  readonly label: TranslatedText;
  readonly value: BillingValue;
  /** A second line under the value — `Next bill`'s amount under its date (decision 9). */
  readonly under: BillingValue | null;
}

/** `SCR-SHELL-06`'s strip as this page draws it: no act and no amount row (brief, owner ruling). */
export interface BillingStripView {
  readonly kind: 'dunning' | 'state';
  readonly title: TranslatedText;
  readonly rows: readonly {
    readonly key: string;
    readonly mark: 'paused' | 'works' | 'until';
    readonly label: TranslatedText;
    readonly value: BillingValue;
  }[];
}

/** One row of `Needs you`: SCR-M12-04's row — the name, its chip, the figure, the line under it. */
export interface BillingNeedRow {
  readonly key: string;
  readonly title: TranslatedText;
  readonly chip: BillingChip | null;
  /** The amount or the date on the right edge; an amount is mono. */
  readonly figure: BillingValue | null;
  readonly line: TranslatedText | null;
}

/** The first region, present only when something needs the Owner (decision 1). */
export interface BillingNeedsView {
  readonly title: TranslatedText;
  readonly badge: BillingChip | null;
  readonly rows: readonly BillingNeedRow[];
  /** `Your data — kept` in the strip's row form, on a dead state (decision 2). */
  readonly dataKept: { readonly label: TranslatedText; readonly value: TranslatedText } | null;
  readonly working: { readonly label: TranslatedText; readonly parts: BillingWorkingPart[] } | null;
  /** The region's ONE act, or `null` for a person who is not the Owner. */
  readonly act: { readonly label: TranslatedText; readonly line: TranslatedText | null } | null;
  /** Whose act it is, for a person who is not the Owner (`M12-56`). */
  readonly scope: { readonly title: TranslatedText } | null;
}

export interface BillingPlanView {
  readonly chip: BillingChip;
  readonly rows: readonly BillingFact[];
  readonly working: { readonly label: TranslatedText; readonly parts: BillingWorkingPart[] } | null;
  readonly source: TranslatedText | null;
  /** `Change plan`, or Enterprise's `Talk to us`; none for a person who is not the Owner. */
  readonly route: {
    readonly title: TranslatedText;
    readonly subtitle: TranslatedText | null;
  } | null;
  /** `What my plan includes`, opened in place. */
  readonly includes: readonly BillingFact[] | null;
  /**
   * Whose act billing is, for a person who is not the Owner, when nothing needs the Owner (`M12-56`):
   * every member's page names it once — in `Needs the owner` when something does, else here.
   */
  readonly scope: { readonly title: TranslatedText } | null;
}

export interface BillingMeterView {
  readonly key: string;
  readonly label: TranslatedText;
  readonly value: number;
  readonly limit: number | null;
  readonly unit: TranslatedText | null;
}

export interface BillingUsageView {
  readonly meters: readonly BillingMeterView[];
  readonly sources: readonly TranslatedText[];
}

export interface BillingMethodView {
  readonly chip: BillingChip | null;
  /** The method as the gateway names it; `null` before any mandate, when `gap` says why. */
  readonly value: TranslatedText | null;
  readonly gap: TranslatedText | null;
  readonly canUpdate: boolean;
}

export interface BillingInvoiceRow {
  readonly id: string;
  /** The issue date, in the market's style. */
  readonly date: string;
  /** What it was for — a column at width, under the date at 375. */
  readonly forWhat: TranslatedText;
  readonly chip: BillingChip;
  /** The amount, mono, on the right edge. */
  readonly amount: string;
  /** The PDF act's spoken name; `null` while the PDF is not made (`T-M12-012d`). */
  readonly pdfLabel: TranslatedText | null;
}

export interface BillingInvoicesView {
  readonly rows: readonly BillingInvoiceRow[];
  /** `All 24 invoices`; `null` with no invoice yet, when `empty` teaches. */
  readonly all: TranslatedText | null;
  readonly empty: { readonly title: TranslatedText; readonly message: TranslatedText } | null;
  readonly source: TranslatedText | null;
}

/** The invoice table's own words and its blocked states' titles (the table at width). */
export interface BillingTableWords extends DataTableWords {
  readonly emptyTitle: TranslatedText;
  readonly errorTitle: TranslatedText;
  readonly unavailableTitle: TranslatedText;
}

/** Every word the body draws itself; `@heliogrid/i18n`'s `billingHomeWords` writes them. */
export interface BillingHomeWords {
  readonly yourPlan: TranslatedText;
  readonly usageThisCycle: TranslatedText;
  readonly allUsage: TranslatedText;
  readonly paymentMethod: TranslatedText;
  readonly method: TranslatedText;
  readonly update: TranslatedText;
  readonly aboutMethod: TranslatedText;
  readonly aboutMethodTitle: TranslatedText;
  readonly aboutMethodBody: TranslatedText;
  readonly invoices: TranslatedText;
  readonly whatMyPlanIncludes: TranslatedText;
  readonly paymentReminders: TranslatedText;
  readonly paymentRemindersLine: TranslatedText;
  readonly planHistory: TranslatedText;
  readonly planHistoryLine: TranslatedText;
  readonly cancelSubscription: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly howWorkedOut: TranslatedText;
  readonly invoiceColumns: {
    readonly date: TranslatedText;
    readonly forWhat: TranslatedText;
    readonly state: TranslatedText;
    readonly pdf: TranslatedText;
    readonly amount: TranslatedText;
  };
  readonly derivationKinds: DerivationKindWords;
  readonly usageMeter: UsageMeterWords;
  readonly table: BillingTableWords;
  /** `BannerStack`'s line for notices it capped away; the strip is one, so it never shows. */
  bannerMore(hidden: number): TranslatedText;
}

export interface BillingHomeActs {
  readonly onNeedAct: () => void;
  readonly onRoute: () => void;
  readonly onAllUsage: () => void;
  readonly onUpdateMethod: () => void;
  readonly onInvoice: (id: string) => void;
  readonly onInvoicePdf: (id: string) => void;
  readonly onAllInvoices: () => void;
  readonly onReminders: () => void;
  readonly onHistory: () => void;
  readonly onCancel: () => void;
}

/** What the body's acts wait on: an act's answer, or a PDF being signed. */
export type BillingBodyActing = 'need' | 'method' | 'pdf' | null;

/** The body's focus handle: where focus goes once an ask has landed and closed. */
export interface BillingHomeFocus {
  /**
   * Lands focus — the keyboard's on the web, the screen reader's on the phone — on the needs
   * region's heading: `Needs you` after a cancel, `The way back` after a refund. The page refetches
   * after the act, so a region not drawn yet takes focus as soon as it is.
   */
  focusNeeds(): void;
  /** `Your plan`'s heading: `Keep <plan> instead` swapped its need away (frame 16). */
  focusPlan(): void;
}

export interface BillingHomeProps {
  readonly ref?: Ref<BillingHomeFocus>;
  readonly words: BillingHomeWords;
  /** The page's one read (`T-SHELL-013`): loading, failed with its retry, or ready. */
  readonly read: SurfaceRead;
  /** Where focus lands once `Try again` has left: the page's heading, which the screen draws. */
  readonly focusAfter: FocusAfter;
  /** `column` at 375; `columns` at width — what needs me, the plan and the usage on the left (5fr). */
  readonly layout: 'column' | 'columns';
  readonly strip: BillingStripView | null;
  readonly needs: BillingNeedsView | null;
  readonly plan: BillingPlanView | null;
  readonly usage: BillingUsageView | null;
  readonly method: BillingMethodView | null;
  readonly invoices: BillingInvoicesView | null;
  /** The two record rows; the Owner's alone. */
  readonly records: boolean;
  /** `Cancel subscription`, last and quiet; `active` rows alone (`M12-50`). */
  readonly cancellable: boolean;
  /** The act whose answer is awaited: it shows pending, and every other act waits. */
  readonly pending: 'need' | 'method' | null;
  /** The invoice whose PDF link is being signed: its act shows pending, and every other act waits. */
  readonly pendingPdf: string | null;
  /** Why the need's act did not land (a reactivation's page did not open), under its line. */
  readonly needFailure: TranslatedText | null;
  readonly acts: BillingHomeActs;
}
