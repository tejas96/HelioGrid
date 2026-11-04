import type {
  BillingHome,
  BillingStanding,
  PlanChangePreview,
  PublicPricingRead,
  TenantOwners,
  TranslatedText,
} from '@heliogrid/contracts';
import type { BillingCycle, Read, Tier } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { BillingInput } from '../BillingHome/BillingHome.words';
import type { PlanSet } from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

/** `Your plan`'s facts: the Owner's whole home, or a member's standing and whose act it is. */
export type PlanSelectionFacts =
  | { readonly kind: 'owner'; readonly home: BillingHome }
  | {
      readonly kind: 'member';
      readonly standing: BillingStanding;
      readonly owners: TenantOwners | null;
    };

/**
 * The plans' state and acts as both screens hold them — `@heliogrid/data`'s
 * `usePlanSelectionScreen` gives exactly this — so the page is assembled once (Law 11).
 */
export interface PlanSelectionState {
  readonly owner: boolean;
  readonly plan: Read<PlanSelectionFacts>;
  readonly book: Read<PublicPricingRead>;
  readonly cycle: BillingCycle;
  chooseCycle(cycle: BillingCycle): void;
  readonly picked: Tier | null;
  pick(tier: Tier): void;
  readonly pickedIsHeld: boolean;
  readonly reviewing: boolean;
  openReview(): void;
  closeReview(): void;
  readonly preview: Read<PlanChangePreview>;
  readonly changedFrom: PlanChangePreview | null;
  readonly acting: boolean;
  readonly failure: { readonly where: 'sheet' | 'page'; readonly why: string } | null;
  confirm(): void;
  readonly compareOpen: boolean;
  toggleCompare(): void;
  readonly comparePlan: Tier | null;
  readonly planOptions: readonly Tier[];
  choosePlan(tier: Tier): void;
  readonly against: Tier | null;
  readonly againstOptions: readonly Tier[];
  chooseAgainst(tier: Tier): void;
  readonly set: PlanSet;
  chooseSet(set: PlanSet): void;
  readonly talkToSales: (() => void) | null;
}

/** What only the app knows: the market's format and the clock. */
export interface PlanSelectionPlace {
  readonly format: MarketFormat;
  readonly now: number;
}

/** What every builder reads, worked out once from the state and the place. */
export interface PlanSelectionInput {
  readonly words: PlanSelectionWords;
  readonly format: MarketFormat;
  readonly now: number;
  /** Billing's builders' input — `Your plan`'s pairs and the strip are Billing's (`SCR-M12-02`). */
  readonly billing: BillingInput;
  readonly heldTier: Tier | null;
  readonly heldCycle: BillingCycle | null;
  /** The paid period's end: a downgrade's `From` while its preview is still out (s13, s14). */
  readonly heldPeriodEnd: string | null;
  /** The price list, once read: a plan's listed price read as written. */
  readonly book: PublicPricingRead | null;
  /** The held plan's list price for its cycle, when the home has one. */
  readonly heldList: string | null;
  /** `India price list · 1 Apr 2026`; the region that prints a price names it (decision 5). */
  readonly priceList: TranslatedText | null;
}
