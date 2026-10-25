import type { ExplainerPagerWords } from '@heliogrid/domain';

/**
 * **The price editor's body** (`SCR-M01-15`, `M01-37`): one item's price, a platform item's tax
 * and its two picker switches — the sparse override — each field naming the tier it comes from.
 * The app holds it in a sheet at 375 and a side panel at 1536 that leaves the list reachable, and
 * draws the *Cancel* / *Save* foot there. Words are the caller's.
 */
export interface CatalogPriceEditorProps {
  words: CatalogPriceEditorWords;
  item: CatalogEditedItem;
  /** The price as typed: a decimal string, `''` while empty. Empty saves as no price. */
  amount: string;
  onAmount: (amount: string) => void;
  /** A platform item's override tax as typed, `''` unset; `null` on an own SKU, which has none. */
  taxPct: string | null;
  onTaxPct: (taxPct: string) => void;
  /** The tax is the tenant's own (it shows *Edited*); unset falls through to the pack. */
  taxOverridden: boolean;
  /** The pack's category rate is unauthored (`D241`): the gap and the lock note are drawn. */
  packRateMissing: boolean;
  /** A platform item's picker switches; `null` on an own SKU (its preference is a row act). */
  switches: CatalogEditorSwitches | null;
  /** The save's refusal or failure, in words; `null` while there is none. */
  problem: string | null;
}

export interface CatalogEditedItem {
  /** *Platform item* · *Your SKU*. */
  readonly overline: string;
  readonly name: string;
  /** *Panel* · *550 Wp · verified datasheet* · *TOPCon*. */
  readonly chips: readonly string[];
  /** The market schemes the item holds, as success badges. */
  readonly held: readonly string[];
}

export interface CatalogEditorSwitches {
  readonly hidden: boolean;
  readonly onHidden: (hidden: boolean) => void;
  readonly hiddenFromOverride: boolean;
  readonly preferred: boolean;
  readonly onPreferred: (preferred: boolean) => void;
  readonly preferredFromOverride: boolean;
}

/** `@heliogrid/i18n`'s `catalogPriceEditorWords`. */
export interface CatalogPriceEditorWords {
  readonly howItResolves: string;
  readonly resolvesPages: readonly [string, string];
  readonly explainer: ExplainerPagerWords;
  readonly yourPrice: string;
  readonly price: string;
  readonly priceHint: string;
  readonly taxRate: string;
  readonly edited: string;
  readonly noMarketRate: string;
  /** *No market rate yet. Your 5% stays until one is set.* — `null` while no tax is set. */
  readonly taxStays: string | null;
  readonly yourOverride: string;
  readonly defaultSource: string;
  readonly inPickers: string;
  readonly hideFromPickers: string;
  readonly preferredInPickers: string;
}
