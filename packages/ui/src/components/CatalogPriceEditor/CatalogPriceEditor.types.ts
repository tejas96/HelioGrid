import type { TranslatedText } from '@heliogrid/contracts';
import type { CatalogProvenanceLabel, ComponentKind, ExplainerPagerWords } from '@heliogrid/domain';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/**
 * **The price editor's body** (`SCR-M01-15`, `M01-37`): one item's price, a platform item's tax
 * and its two picker toggles — the sparse override; the tax names the market's gap.
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
  /**
   * A platform item's two picker states, drawn as *Prefer* and *Hide* (direction A) and saved with
   * the price; `null` on an own SKU.
   */
  switches: CatalogEditorSwitches | null;
  /**
   * An own SKU's acts, done at once as its row did them: *Prefer*, and *Archive*, which asks first.
   * Absent or `null` on a platform item, or where the person may not act.
   */
  ownActs?: CatalogEditorOwnActs | null;
  /** The save's refusal or failure, in words; `null` while there is none. */
  problem: TranslatedText | null;
}

/**
 * The item at the detail's head: its kind tile, whose it is, its name large, the marks it carries
 * and its spec as a grid — the facts an installer quotes with, read before the price is set.
 */
export interface CatalogEditedItem {
  readonly kind: ComponentKind;
  /** *Panel*: beside whose it is, over the name. */
  readonly kindWord: TranslatedText;
  /** *Platform item* · *Your SKU*. */
  readonly overline: TranslatedText;
  readonly name: string;
  /** The spec as the grid draws it: each fact's name over its value. */
  readonly specs: readonly CatalogEditedSpec[];
  readonly provenance: CatalogProvenanceLabel;
  /** *Verified datasheet* · *Representative data* · *Your own*. */
  readonly provenanceWord: TranslatedText;
  /** The market schemes the item holds, as success badges. */
  readonly held: readonly string[];
}

/** One cell of the spec grid: *Rated power* over *545 Wp*. */
export interface CatalogEditedSpec {
  readonly label: TranslatedText;
  /** The figure with its unit, formatted by the caller. */
  readonly value: string;
}

export interface CatalogEditorSwitches {
  readonly hidden: boolean;
  readonly onHidden: (hidden: boolean) => void;
  readonly preferred: boolean;
  readonly onPreferred: (preferred: boolean) => void;
}

export interface CatalogEditorOwnActs {
  readonly preferred: boolean;
  readonly onPrefer: () => void;
  readonly onArchive: () => void;
}

/** `@heliogrid/i18n`'s `catalogPriceEditorWords`. */
export interface CatalogPriceEditorWords {
  readonly howItResolves: TranslatedText;
  readonly resolvesPages: readonly [TranslatedText, TranslatedText];
  readonly explainer: ExplainerPagerWords;
  readonly yourPrice: TranslatedText;
  readonly price: TranslatedText;
  readonly priceHint: TranslatedText;
  /** The hint while the field holds no price: what a price is for. */
  readonly priceNeeded: TranslatedText;
  readonly taxRate: TranslatedText;
  readonly edited: TranslatedText;
  readonly noMarketRate: TranslatedText;
  /** *No market rate yet. Your 5% stays until one is set.* — `null` while no tax is set. */
  readonly taxStays: TranslatedText | null;
  readonly inPickers: TranslatedText;
  readonly hideFromPickers: TranslatedText;
  readonly preferredInPickers: TranslatedText;
  /** The two picker acts' words on their glass buttons: *Prefer*, *Hide*; an own SKU's *Archive*. */
  readonly prefer: TranslatedText;
  readonly hide: TranslatedText;
  readonly archive: TranslatedText;
  /** What the price and tax fields say of their own. */
  readonly numberField: NumberFieldWords;
}
