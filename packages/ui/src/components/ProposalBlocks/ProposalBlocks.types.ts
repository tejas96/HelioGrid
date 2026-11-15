import type { ProvenanceTier } from '@heliogrid/contracts';
import type {
  BankDetails,
  ComponentCategory,
  ComponentLine,
  FrozenGeneration,
  MinorUnits,
  ProposalCover,
  ProposalEmi,
  ProposalMoney,
  ProposalPhase,
  ProposalSavings,
  RichTextValue,
  SchedulePart,
  TrancheLine,
} from '@heliogrid/domain';
import type {
  ProposalBankWords,
  ProposalCompanyWords,
  ProposalEmiWords,
  ProposalGenerationWords,
  ProposalPartsWords,
  ProposalPriceWords,
  ProposalSavingsWords,
  ProposalSplitWords,
  ProposalTermsWords,
  ProposalTimelineWords,
  ProposalTrackRecordWords,
} from './ProposalBlocks.parts.types';

/**
 * The blocks a proposal is made of, drawn once and read three ways (`M06-50`: one renderer). `app`
 * is the builder's step, spoken to the person building; `paper` is the document's A4 page and
 * `link` the customer's page, both spoken to the customer. Paper is light in every scheme.
 *
 * A block takes the server's own answer — the money block, the projections, the field set's lines
 * — as `packages/domain` types it (`F4-04`, `F8-24`), so a screen's hook passes it straight
 * through and no block formats or works out a money figure of its own.
 */
export type ProposalBlockMode = 'app' | 'paper' | 'link';

/** The price (`M06-35`): the proposal money block, whole. */
export interface ProposalPriceBlockProps {
  mode: ProposalBlockMode;
  /**
   * The server's money block. The per-kW check and the margin print in `app` alone, and the margin
   * only when the server sent it — it sends it to holders of the cost alone (`M06-37`).
   */
  money: ProposalMoney;
  words: ProposalPriceWords;
}

/** A year of generation, month by month: a version's `FrozenGeneration` is one. */
export type ProposalGenerationFacts = Pick<FrozenGeneration, 'monthlyKwh' | 'yearlyKwh'>;

export interface ProposalGenerationBlockProps {
  mode: ProposalBlockMode;
  generation: ProposalGenerationFacts;
  /** `estimated` for figures the source filled, `assumed` for a person's own (`F8-02`). */
  tier: ProvenanceTier;
  words: ProposalGenerationWords;
}

export interface ProposalSavingsBlockProps {
  mode: ProposalBlockMode;
  savings: ProposalSavings;
  /** The net cost the savings pay back, from the same money block. */
  money: Pick<ProposalMoney, 'netCost' | 'figures'>;
  /** The lead's monthly bill; `null` where it is not known, and then no bill bars are drawn. */
  monthlyBill: MinorUnits | null;
  words: ProposalSavingsWords;
}

/** The EMI example (`M06-40`): a projection, never an offer. */
export interface ProposalEmiBlockProps {
  mode: ProposalBlockMode;
  emi: ProposalEmi;
  /** The monthly saving beside it; `null` where none is projected. */
  savings: Pick<ProposalSavings, 'figures'> | null;
  words: ProposalEmiWords;
}

export interface ProposalSplitBlockProps {
  mode: ProposalBlockMode;
  /** The payment plan's rows, as the field set holds them. */
  tranches: readonly TrancheLine[];
  /** The money block's amounts for them; `null` until the shares add up and the payable is above zero. */
  amounts: readonly SchedulePart[] | null;
  /** The amounts' tier where they are carried to a customer (`F8-01`); absent where the company sets its own plan. */
  tier?: ProvenanceTier;
  /**
   * The run of parts this sheet prints, as the page plan cut them (`priceSheetsOf`); the head and
   * the bar only where the plan starts. Absent: the whole plan.
   */
  slice?: { readonly from: number; readonly to: number; readonly head: boolean };
  words: ProposalSplitWords;
}

export interface ProposalPartsBlockProps {
  mode: ProposalBlockMode;
  /** The categories this proposal must fill (`requiredCategories`), in their order. */
  categories: readonly ComponentCategory[];
  /** Step 8's lines; a category's two or three read as alternatives (`M06-27`). */
  components: readonly ComponentLine[];
  words: ProposalPartsWords;
  /** `app` only: opens the picker for a category. Without it a tile is read, not pressed. */
  onPick?: (category: ComponentCategory) => void;
}

export interface ProposalTimelineBlockProps {
  mode: ProposalBlockMode;
  phases: readonly ProposalPhase[];
  /** How many steps earlier sheets printed: the first step here is numbered one after them. */
  before?: number;
  words: ProposalTimelineWords;
}

export interface ProposalTrackRecordBlockProps {
  mode: ProposalBlockMode;
  /** The company's track record as this proposal prints it (`M06-08`); a count not given is left out. */
  record: ProposalCover;
  words: ProposalTrackRecordWords;
}

/** Who the proposal is from and who it is for. A fact that is absent prints nothing. */
export interface ProposalCompany {
  readonly name: string;
  readonly address?: string;
  /** The tax registration with the pack's label on it — `GSTIN 27AABCS1429P1ZQ`. */
  readonly taxId?: string;
  readonly logoSrc?: string;
  readonly customerName: string;
  readonly siteAddress?: string;
  /** The server's number; absent on a draft. */
  readonly number?: string;
}

export interface ProposalCompanyBlockProps {
  mode: ProposalBlockMode;
  company: ProposalCompany;
  words: ProposalCompanyWords;
}

export interface ProposalTermsBlockProps {
  mode: ProposalBlockMode;
  /** The version's terms, as the company wrote them. */
  terms: RichTextValue;
  /** Fills a logo block the terms hold; a version whose company has no logo holds no such block. */
  logoSrc?: string;
  words: ProposalTermsWords;
}

export interface ProposalBankBlockProps {
  mode: ProposalBlockMode;
  /** The account the customer pays into — the business profile's, never a placeholder. */
  bank: BankDetails;
  /** `app` only: the details are saved and this proposal does not print them (`M06-17`). */
  notPrinted?: boolean;
  words: ProposalBankWords;
}
