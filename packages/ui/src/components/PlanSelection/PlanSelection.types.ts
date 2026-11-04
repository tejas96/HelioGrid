import type { TranslatedText } from '@heliogrid/contracts';
import type { BillingCycle, MinorUnits, Tier } from '@heliogrid/domain';
import type { Ref } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import type {
  BillingChip,
  BillingFact,
  BillingStripView,
  BillingValue,
  BillingWorkingPart,
} from '../BillingHome/BillingHome.types';
import type { CompareAttribute, CompareOption } from '../CompareGrid';
import type { PlanCardFigure, PlanCardLine } from '../PlanCard/PlanCard.types';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';
import type { PlanSelectionWords } from './PlanSelection.words';

export type { PlanSelectionWords } from './PlanSelection.words';

/**
 * The plans (`SCR-M12-03`) as both halves draw them (Law 7): `Your plan`, the cycle chips, the
 * plans as cards with Enterprise beside them, the act, the source line and the comparison; the
 * review is `PlanReview`. Every figure arrives formatted from the server's numbers (`F4-04`).
 */

/** `Your plan`: the state as its one chip, the pairs, and its one ask on a live row. */
export interface PlanHeldView {
  readonly chip: BillingChip;
  readonly rows: readonly BillingFact[];
  readonly source: TranslatedText | null;
  /** `About reading and exporting`; not on a dead row or a non-Owner's page, where nothing is behind it. */
  readonly ask: boolean;
}

/** One plan as a card: its relation chip, or `current` for the plan held, and its body. */
export interface PlanCardView {
  readonly tier: Tier;
  readonly name: TranslatedText;
  /** `Upgrade` or `Downgrade` at 375; `Your plan` too at 1536, where it sits under the title. */
  readonly relation: TranslatedText | null;
  readonly current: boolean;
  readonly figure: PlanCardFigure | null;
  readonly gap: TranslatedText | null;
  readonly lines: readonly PlanCardLine[];
}

/** Enterprise: sold, never bought (`M12-55`) — a row at 375, the fourth card at 1536. */
export interface PlanEnterpriseView {
  readonly name: TranslatedText;
  readonly chip: TranslatedText | null;
  /** `From ₹24,999 / mo`, the row's subtitle at 375. */
  readonly from: BillingValue | null;
  readonly figure: PlanCardFigure | null;
  readonly gap: TranslatedText | null;
  readonly lines: readonly PlanCardLine[];
  /** `Talk to sales`, when the book names a sales address. */
  readonly sales: boolean;
}

export interface PlanChoice<V extends string> {
  readonly value: V;
  readonly label: TranslatedText;
}

/** The Owner's plans region: the cycle above the cards it re-prices, the act at its foot. */
export interface PlanPickView {
  readonly kind: 'pick';
  readonly cycle: BillingCycle;
  readonly cycles: readonly PlanChoice<BillingCycle>[];
  readonly picked: Tier | null;
  readonly cards: readonly PlanCardView[];
  readonly enterprise: PlanEnterpriseView | null;
  /** `Review change`, off with its reason until a plan that changes something is picked. */
  readonly reason: TranslatedText | null;
  readonly source: TranslatedText | null;
  /** `Prices exclude GST`, once the platform is registered for the scheme (`F1-29`). */
  readonly sourceNote: TranslatedText | null;
}

/** A person who is not the Owner: every plan and which one is theirs — no price and no act. */
export interface PlanReadOnlyView {
  readonly kind: 'readonly';
  readonly cards: readonly {
    readonly key: string;
    readonly name: TranslatedText;
    /** `Your plan`, `Upgrade`, `Downgrade` or `Annual contract`; none on a trial (decision 3). */
    readonly word: TranslatedText | null;
  }[];
}

export type PlanSet = 'limits' | 'included' | 'charges';

/** The comparison, ONE region: my plan against one other at 375, all four at 1536. */
export interface PlanCompareView {
  /** The 375 row's line under `Compare all plans`. */
  readonly line: TranslatedText;
  readonly sets: readonly PlanChoice<PlanSet>[];
  readonly set: PlanSet;
  /**
   * The first plan's chip strip on a trial, which holds no plan (`M12-52`): the pair is two plans
   * as the pricing page pairs them, neither marked the reader's own. Empty on a paid plan.
   */
  readonly plans: readonly PlanChoice<Tier>[];
  readonly planValue: Tier | null;
  readonly against: readonly PlanChoice<Tier>[];
  readonly againstValue: Tier | null;
  readonly pairCaption: TranslatedText;
  readonly allCaption: TranslatedText;
  readonly attributes: CompareAttribute[];
  readonly pair: CompareOption[];
  readonly all: CompareOption[];
  readonly source: TranslatedText | null;
}

/** One row of the review: a value on one edge, an amount on the right edge, its mark under it. */
export interface PlanReviewRow {
  readonly key: string;
  readonly label: TranslatedText;
  readonly value: BillingValue;
  /** An amount ends on the right edge (decision 6). */
  readonly amount: boolean;
  /** `changed just now` (frame s8), or `with GST` under an amount. */
  readonly mark: TranslatedText | null;
}

export interface PlanMoneyLine {
  readonly key: string;
  // biome-ignore lint/plugin/copy-prop-type: MoneySummary's line label is the caller's words
  readonly label: string;
  readonly amount: MinorUnits;
}

/** The review's groups, in the order drawn. */
export type PlanReviewSection =
  | {
      readonly kind: 'facts';
      readonly key: string;
      readonly overline: TranslatedText | null;
      readonly label: TranslatedText;
      readonly rows: readonly PlanReviewRow[];
      readonly source: TranslatedText | null;
    }
  | {
      /** The downgrade's one tinted block, first (`M12-49`). */
      readonly kind: 'blocked';
      readonly key: string;
      readonly title: TranslatedText;
      readonly rows: readonly PlanReviewRow[];
    }
  | {
      readonly kind: 'money';
      readonly key: string;
      readonly lines: readonly PlanMoneyLine[];
      readonly total: MinorUnits;
      readonly working: {
        readonly label: TranslatedText;
        readonly parts: readonly BillingWorkingPart[];
      } | null;
      readonly source: TranslatedText | null;
    }
  | { readonly kind: 'loading'; readonly key: string; readonly label: TranslatedText }
  | {
      readonly kind: 'failed';
      readonly key: string;
      readonly title: TranslatedText;
      readonly errorTitle: TranslatedText;
      readonly errorMessage: TranslatedText;
      readonly retry: () => void;
    };

export interface PlanReviewView {
  readonly subtitle: TranslatedText;
  /** `Your usage changed while this was open` (frame s8). */
  readonly changed: TranslatedText | null;
  /** Why the act did not land, said in the sheet where it was pressed. */
  readonly failure: TranslatedText | null;
  readonly sections: readonly PlanReviewSection[];
  /** The ONE act and its ONE line; none while no preview stands (`M12-49`: no confirm without it). */
  readonly act: { readonly label: TranslatedText; readonly line: TranslatedText | null } | null;
}

/** The page's failed handoff (frame s11): what failed, what to do, and `Try again`. */
export interface PlanFailureView {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

export interface PlanSelectionView {
  readonly strip: BillingStripView | null;
  readonly failure: PlanFailureView | null;
  readonly held: PlanHeldView | null;
  readonly plans: PlanPickView | PlanReadOnlyView | null;
  /** Whose act it is, for a person who is not the Owner (`M12-56`). */
  readonly scope: TranslatedText | null;
  readonly compare: PlanCompareView | null;
  readonly review: PlanReviewView | null;
}

/** A region's read: loading draws its bars, failed its retry (frames s1, s3). */
export type PlanRegionRead = SurfaceRead;

export interface PlanSelectionActs {
  readonly onCycle: (cycle: BillingCycle) => void;
  readonly onPick: (tier: Tier) => void;
  readonly onReview: () => void;
  readonly onTalkToSales: () => void;
  readonly onCompare: () => void;
  readonly onAgainst: (tier: Tier) => void;
  readonly onComparePlan: (tier: Tier) => void;
  readonly onSet: (set: PlanSet) => void;
  readonly onRetryFailure: () => void;
}

/** The body's focus handle: `Your plan`'s heading, where a landed `Try again` hands focus. */
export interface PlanSelectionFocus {
  focusHeld(): void;
}

export interface PlanSelectionProps {
  readonly ref?: Ref<PlanSelectionFocus>;
  readonly words: PlanSelectionWords;
  /** `column` at 375; `columns` at width — four plans side by side and the full matrix. */
  readonly layout: 'column' | 'columns';
  readonly heldRead: PlanRegionRead;
  readonly plansRead: PlanRegionRead;
  readonly view: PlanSelectionView;
  readonly compareOpen: boolean;
  /** An act's answer is out: every card, chip and act is inert. */
  readonly acting: boolean;
  /** Where focus lands once a region's `Try again` has left: the page's heading. */
  readonly focusAfter: FocusAfter;
  readonly acts: PlanSelectionActs;
}

export interface PlanReviewProps {
  readonly open: boolean;
  /** `column` at 375 — a sheet that rises from the act; `columns` — the non-modal side panel. */
  readonly layout: 'column' | 'columns';
  readonly view: PlanReviewView | null;
  readonly words: PlanSelectionWords;
  readonly acting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}
