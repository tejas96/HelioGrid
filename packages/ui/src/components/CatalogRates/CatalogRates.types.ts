import type { TranslatedText } from '@heliogrid/contracts';
import type { PriceBookRateBasis, Read, UiLanguage } from '@heliogrid/domain';
import type { CatalogStrip, CatalogTableWords } from '../CatalogItems/CatalogItems.types';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/**
 * **Catalog settings' Rates panel** (`SCR-M01-15`, `M01-48`): the price book's version in force —
 * its strip, then its rates, grouped by how each is charged at 375 and one searchable table at
 * 1536. Versions are immutable: browsing one is read-only, and a change is a whole new version
 * (`CatalogVersion`). Words are the caller's.
 */
export interface CatalogRatesProps {
  words: CatalogRatesWords;
  /** The price book's read: its strip and rates draw once it is in. */
  read: Read<unknown>;
  strip: CatalogStrip;
  rates: readonly CatalogRate[];
  /** Before the first version: the empty teaching, with its first act for the grant. */
  onAddFirst: (() => void) | null;
}

/** One rate as shown: its name already in the reader's language, its amount as the server sent it. */
export interface CatalogRate {
  readonly key: string;
  readonly name: string;
  readonly basis: PriceBookRateBasis;
  readonly amount: string;
}

/** `@heliogrid/i18n`'s `catalogRatesWords`. */
export interface CatalogRatesWords {
  readonly bases: Readonly<Record<PriceBookRateBasis, TranslatedText>>;
  readonly searchRates: TranslatedText;
  /** The search's clear button. */
  readonly clearSearch: TranslatedText;
  readonly chargedLabel: TranslatedText;
  readonly allBases: TranslatedText;
  readonly rate: TranslatedText;
  readonly charged: TranslatedText;
  readonly amount: TranslatedText;
  readonly ratesInForce: TranslatedText;
  readonly noRates: TranslatedText;
  readonly noRatesBody: TranslatedText;
  readonly addFirstRate: TranslatedText;
  readonly noMatch: TranslatedText;
  readonly loadFailed: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly loading: TranslatedText;
  readonly table: CatalogTableWords;
}

/**
 * **One price-book version** — browsed read-only, or the new one being written. The app holds it
 * in a sheet at 375 and a side panel at 1536 (640 wide for the editor) and draws the foot there.
 */
export type CatalogVersionProps = CatalogVersionList | CatalogVersionRead | CatalogVersionEdit;

export interface CatalogVersionList {
  readonly mode: 'list';
  readonly words: CatalogVersionWords;
  readonly versions: readonly CatalogVersionSummary[];
  /** The versions' read: they draw once it is in. */
  readonly read: Read<unknown>;
  readonly onOpen: (id: string) => void;
  readonly hasMore: boolean;
  readonly onMore: () => void;
}

export interface CatalogVersionSummary {
  readonly id: string;
  readonly number: number;
  /** *v7* — the tile's disc. */
  readonly tag: string;
  // biome-ignore lint/plugin/copy-prop-type: the release note as a person wrote it
  readonly note: string;
  /** *12 Aug 2026 · Rajesh Kulkarni*. */
  readonly byline: string;
  /** The year it is grouped under. */
  readonly year: string;
  /** *16.5%* — shown on a past version; the one in force shows its status instead. */
  readonly margin: string;
  readonly inForce: boolean;
}

export interface CatalogVersionRead {
  readonly mode: 'read';
  readonly words: CatalogVersionWords;
  readonly margin: string;
  readonly rateCount: string;
  // biome-ignore lint/plugin/copy-prop-type: the release note as a person wrote it
  readonly note: string;
  readonly rates: readonly CatalogRate[];
  /** The version's read: its margin, note and rates draw once it is in. */
  readonly read: Read<unknown>;
}

export interface CatalogVersionEdit {
  readonly mode: 'edit';
  readonly words: CatalogVersionWords;
  /** The default margin as typed, a percent. */
  readonly margin: string;
  readonly onMargin: (margin: string) => void;
  // biome-ignore lint/plugin/copy-prop-type: the release note as a person types it
  readonly note: string;
  readonly onNote: (note: string) => void;
  readonly rows: readonly CatalogVersionRow[];
  readonly onAddRate: () => void;
  /** Under *What changed* when it alone holds the version back; `null` otherwise. */
  readonly noteHint: TranslatedText | null;
  readonly problem: TranslatedText | null;
}

/**
 * One rate of the new version as the board lists it (s-version-new): its name — the way into the
 * rate sheet — its amount in a small money box, and what the version in force had when it moved.
 */
export interface CatalogVersionRow {
  readonly key: string;
  /** The name in the reader's language, English standing in. */
  readonly name: string;
  readonly onOpen: () => void;
  readonly basis: PriceBookRateBasis;
  readonly amount: string;
  readonly onAmount: (amount: string) => void;
  /** The version in force's amount when this one differs; drawn struck with *Changed*. */
  readonly was: string | null;
  readonly labels: { readonly amount: TranslatedText };
}

/**
 * **The rate sheet's body** (owner ruling 2026-10-24): a rate's name in each language, its basis and
 * *Remove*. The app's sheet or modal holds it and draws *Cancel* and *Done*.
 */
export interface CatalogRateEditProps {
  readonly names: readonly {
    readonly language: UiLanguage;
    readonly label: TranslatedText;
    readonly value: string;
    /** The English name the company wrote, shown while this language is empty. */
    // biome-ignore lint/plugin/copy-prop-type: the English name the company wrote
    readonly placeholder: string;
    /** *No Hindi name yet — English shows in its place.*; `null` when written. */
    readonly missing: TranslatedText | null;
  }[];
  readonly onName: (language: UiLanguage, name: string) => void;
  readonly basis: PriceBookRateBasis;
  readonly basisLabel: TranslatedText;
  readonly bases: Readonly<Record<PriceBookRateBasis, TranslatedText>>;
  /** The basis list's own words: its trigger while nothing is picked, the phone's close. */
  readonly select: { readonly placeholder: TranslatedText; readonly closeLabel: TranslatedText };
  readonly onBasis: (basis: PriceBookRateBasis) => void;
  /** `null` for a rate not yet in the list. */
  readonly remove: { readonly label: TranslatedText; readonly onRemove: () => void } | null;
}

/** `@heliogrid/i18n`'s `catalogVersionWords`. */
export interface CatalogVersionWords {
  readonly bases: Readonly<Record<PriceBookRateBasis, TranslatedText>>;
  readonly inForce: TranslatedText;
  readonly readOnly: TranslatedText;
  readonly defaultMargin: TranslatedText;
  readonly rates: TranslatedText;
  readonly whatChanged: TranslatedText;
  readonly addRate: TranslatedText;
  /** The phone's next page of versions. */
  readonly moreVersions: TranslatedText;
  readonly rateName: TranslatedText;
  readonly changed: TranslatedText;
  readonly was: (amount: string) => TranslatedText;
  readonly loadFailed: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly loading: TranslatedText;
  /** What the margin and an amount field say of their own. */
  readonly numberField: NumberFieldWords;
}

/**
 * One item the company changed, as the Rates panel's attribution table reads it at 375
 * (`SCR-M01-15` m15-d): each field's value and whether the company set it.
 */
export interface CatalogAttributionRow {
  readonly id: string;
  readonly name: string;
  /** *Panel · Your override*. */
  readonly what: string;
  /** The price as the market writes money; `null` is the named gap. */
  readonly price: string | null;
  readonly priceFrom: string;
  /** The tax rate with its % sign; `null` is the market's gap. */
  readonly tax: string | null;
  readonly taxOverridden: boolean;
  readonly pickers: string;
  readonly pickersOwn: boolean;
  readonly preferred: string;
  readonly preferredOwn: boolean;
}

/** `@heliogrid/i18n`'s `catalogAttributionWords`. */
export interface CatalogAttributionWords {
  readonly caption: TranslatedText;
  readonly item: TranslatedText;
  readonly whatItIs: TranslatedText;
  readonly price: TranslatedText;
  readonly priceFrom: TranslatedText;
  readonly taxRate: TranslatedText;
  readonly pickers: TranslatedText;
  readonly preferred: TranslatedText;
  readonly noPrice: TranslatedText;
  readonly noMarketRate: TranslatedText;
  readonly yourOverride: TranslatedText;
  readonly defaultSource: TranslatedText;
  readonly more: TranslatedText;
  readonly loadFailed: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly table: CatalogTableWords;
}

/** *Why a price is what it is*: the changed items as cards, and the way to more of them. */
export interface CatalogAttributionProps {
  words: CatalogAttributionWords;
  /** The changed list's read: nothing while it loads, the failure with *Try again* if it fails. */
  read: Read<unknown>;
  rows: readonly CatalogAttributionRow[];
  /** `null` when every changed item is listed. */
  onMore: (() => void) | null;
}
