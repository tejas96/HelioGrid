import type { PriceBookRateWire, PriceBookVersionSummaryWire } from '@heliogrid/contracts';
import {
  authoredIn,
  PRICE_BOOK_RATE_BASES,
  type PriceBookRateBasis,
  UI_LANGUAGES,
  UI_SOURCE_LOCALE,
  type UiLanguage,
} from '@heliogrid/domain';
import { LANGUAGE_META } from '../languages';
import type { Translator } from '../runtime';
import { FILTER_PANEL } from './filter-panel';

/** Catalog settings' Rates panel (`SCR-M01-15`, `M01-48`), chosen once for both apps (Law 11). */
export const PRICE_BOOK = {
  priceBook: /*i18n*/ { id: 'Price book' },
  version: /*i18n*/ { id: 'V{number}' },
  /** A version tile's disc in the list (s-versions): lower case, as the board writes it. */
  versionTag: /*i18n*/ { id: 'v{number}' },
  marginSince: /*i18n*/ { id: 'Margin {margin} · since {date}' },
  pastVersions: /*i18n*/ { id: 'past versions' },
  noVersion: /*i18n*/ { id: 'No version yet' },
  startVersion: /*i18n*/ { id: 'Start version {number}' },
  searchRates: /*i18n*/ { id: 'Search rates' },
  chargedLabel: /*i18n*/ { id: 'How the rate is charged' },
  allBases: /*i18n*/ { id: 'All' },
  rate: /*i18n*/ { id: 'Rate' },
  charged: /*i18n*/ { id: 'Charged' },
  amount: /*i18n*/ { id: 'Amount' },
  ratesInForce: /*i18n*/ { id: 'Rates in force' },
  groupCount: /*i18n*/ { id: '{count}' },
  noRates: /*i18n*/ { id: 'No rates yet' },
  noRatesBody: /*i18n*/ {
    id: 'Proposals price only hardware until you add rates. Your first set becomes version 1.',
  },
  addFirstRate: /*i18n*/ { id: 'Add your first rate' },
  noMatch: /*i18n*/ { id: 'No rate matches.' },
  versions: /*i18n*/ { id: 'Versions' },
  versionsCount: /*i18n*/ {
    id: '{count, plural, one {Price book · # version} other {Price book · # versions}}',
  },
  versionTitle: /*i18n*/ { id: 'Version {number}' },
  onBy: /*i18n*/ { id: '{date} · {name}' },
  inForce: /*i18n*/ { id: 'In force' },
  readOnly: /*i18n*/ { id: 'Read-only' },
  backToVersions: /*i18n*/ { id: 'Back to versions' },
  defaultMargin: /*i18n*/ { id: 'Default margin' },
  rates: /*i18n*/ { id: 'Rates' },
  startsFrom: /*i18n*/ { id: 'Starts from version {number}' },
  startsFresh: /*i18n*/ { id: 'Your first price book' },
  whatChanged: /*i18n*/ { id: 'What changed' },
  /** Under *What changed* when it is the one thing holding the version back. */
  noteNeeded: /*i18n*/ { id: 'Say what changed to save this version.' },
  addRate: /*i18n*/ { id: 'Add a rate' },
  moreVersions: /*i18n*/ { id: 'Show more versions' },
  rateName: /*i18n*/ { id: 'Rate name' },
  rateNameIn: /*i18n*/ { id: 'Rate name in {language}' },
  missingName: /*i18n*/ { id: 'No {language} name yet — English shows in its place.' },
  rateAmount: /*i18n*/ { id: 'Amount, {name}' },
  rateBasis: /*i18n*/ { id: 'How {name} is charged' },
  removeRate: /*i18n*/ { id: 'Remove {name}' },
  /** A row's name in its labels before any English name is typed. */
  unnamedRate: /*i18n*/ { id: 'the new rate' },
  /** The rate sheet's title before the rate has an English name. */
  newRate: /*i18n*/ { id: 'New rate' },
  was: /*i18n*/ { id: 'was {amount}' },
  changed: /*i18n*/ { id: 'Changed' },
  inForceAtOnce: /*i18n*/ {
    id: 'Version {next} goes in force at once. Version {current} stays readable.',
  },
  firstInForce: /*i18n*/ { id: 'Version 1 goes in force at once.' },
  saveAs: /*i18n*/ { id: 'Save as version {number}' },
  cancel: /*i18n*/ { id: 'Cancel' },
  close: /*i18n*/ { id: 'Close' },
  saved: /*i18n*/ { id: 'Version {number} is in force' },
  saveFailed: /*i18n*/ { id: "The version wasn't saved. Nothing changed — try again." },
  loadFailed: /*i18n*/ { id: "The price book didn't load." },
  tryAgain: /*i18n*/ { id: 'Try again' },
} as const;

/** How a rate is charged, as the badge and the group overline say it. */
const BASIS: Record<PriceBookRateBasis, { id: string }> = {
  per_job: /*i18n*/ { id: 'Per job' },
  per_kw: /*i18n*/ { id: 'Per kW' },
  per_visit: /*i18n*/ { id: 'Per visit' },
  per_metre: /*i18n*/ { id: 'Per metre' },
};

export const rateBasisWord = (t: Translator['t'], basis: PriceBookRateBasis) => t(BASIS[basis]);

const bases = (t: Translator['t']) =>
  Object.fromEntries(
    PRICE_BOOK_RATE_BASES.map((basis) => [basis, rateBasisWord(t, basis)]),
  ) as Record<PriceBookRateBasis, string>;

/** The Rates panel's fixed words. */
export function catalogRatesWords(t: Translator['t']) {
  return {
    bases: bases(t),
    searchRates: t(PRICE_BOOK.searchRates),
    chargedLabel: t(PRICE_BOOK.chargedLabel),
    allBases: t(PRICE_BOOK.allBases),
    rate: t(PRICE_BOOK.rate),
    charged: t(PRICE_BOOK.charged),
    amount: t(PRICE_BOOK.amount),
    ratesInForce: t(PRICE_BOOK.ratesInForce),
    noRates: t(PRICE_BOOK.noRates),
    noRatesBody: t(PRICE_BOOK.noRatesBody),
    addFirstRate: t(PRICE_BOOK.addFirstRate),
    noMatch: t(PRICE_BOOK.noMatch),
    loadFailed: t(PRICE_BOOK.loadFailed),
    tryAgain: t(PRICE_BOOK.tryAgain),
    loading: t(LOADING),
  };
}

/** A version body's fixed words, the list, the read-only view and the editor alike. */
export function catalogVersionWords(t: Translator['t']) {
  return {
    bases: bases(t),
    inForce: t(PRICE_BOOK.inForce),
    readOnly: t(PRICE_BOOK.readOnly),
    defaultMargin: t(PRICE_BOOK.defaultMargin),
    rates: t(PRICE_BOOK.rates),
    whatChanged: t(PRICE_BOOK.whatChanged),
    addRate: t(PRICE_BOOK.addRate),
    moreVersions: t(PRICE_BOOK.moreVersions),
    rateName: t(PRICE_BOOK.rateName),
    changed: t(PRICE_BOOK.changed),
    was: (amount: string) => t(PRICE_BOOK.was, { amount }),
    loadFailed: t(PRICE_BOOK.loadFailed),
    tryAgain: t(PRICE_BOOK.tryAgain),
    loading: t(LOADING),
  };
}

const LOADING = /*i18n*/ { id: 'Loading the price book' };

/** The Rates strip: the version in force and its margin, and *Start version N* for the grant. */
export function priceBookStripWords(
  t: Translator['t'],
  version: { readonly number: number; readonly margin: string; readonly since: string } | null,
  administers: boolean,
) {
  const next = (version?.number ?? 0) + 1;
  return {
    title: t(PRICE_BOOK.priceBook),
    tag: version === null ? null : t(PRICE_BOOK.version, { number: version.number }),
    tagAs: 'chip' as const,
    detail:
      version === null
        ? t(PRICE_BOOK.noVersion)
        : t(PRICE_BOOK.marginSince, { margin: version.margin, date: version.since }),
    link: version === null ? null : t(PRICE_BOOK.pastVersions),
    action: administers && version !== null ? t(PRICE_BOOK.startVersion, { number: next }) : null,
  };
}

/**
 * One rate of the new version as the editor's list shows it (s-version-new): its name in the
 * reader's language, English standing in (`F3-10`), and its struck *was* once its amount moved.
 */
export function versionRowWords(
  t: Translator['t'],
  rate: {
    readonly name: Partial<Record<UiLanguage, string>>;
    readonly amount: string;
    readonly was: string | null;
  },
  language: UiLanguage,
  money: (amount: string) => string,
) {
  const name = authoredIn({ ...rate.name, en: rate.name.en }, language).value ?? '';
  return {
    name,
    /* Compared as figures: the wire writes *6500.00*, a typed amount *6500*. */
    was: rate.was !== null && Number(rate.was) !== Number(rate.amount) ? money(rate.was) : null,
    labels: { amount: t(PRICE_BOOK.rateAmount, { name }) },
  };
}

/**
 * The rate sheet (owner ruling 2026-10-24): a rate's name in each language — English required,
 * an empty Hindi or Marathi one named with English standing in (`F3-10`) — its basis and *Remove*.
 */
export function rateSheetWords(
  t: Translator['t'],
  rate: { readonly name: Partial<Record<UiLanguage, string>> },
  added: boolean,
) {
  const english = (rate.name.en ?? '').trim();
  const named = english === '' ? t(PRICE_BOOK.unnamedRate) : english;
  return {
    title: english === '' ? t(PRICE_BOOK.newRate) : english,
    names: UI_LANGUAGES.map((language) => {
      const endonym = LANGUAGE_META[language].endonym;
      const written = (rate.name[language] ?? '').trim() !== '';
      return {
        language,
        label: t(PRICE_BOOK.rateNameIn, { language: endonym }),
        value: rate.name[language] ?? '',
        placeholder: language === UI_SOURCE_LOCALE ? '' : english,
        missing:
          language === UI_SOURCE_LOCALE || written
            ? null
            : t(PRICE_BOOK.missingName, { language: endonym }),
      };
    }),
    basis: t(PRICE_BOOK.rateBasis, { name: named }),
    remove: added ? null : t(PRICE_BOOK.removeRate, { name: named }),
    done: t(FILTER_PANEL.done),
    cancel: t(PRICE_BOOK.cancel),
  };
}

/** One version as the list shows it: its note, *date · who*, its year and margin. */
export function versionSummaryOf(
  t: Translator['t'],
  summary: PriceBookVersionSummaryWire,
  formats: {
    readonly date: (value: string) => string;
    readonly year: (value: string) => string;
    readonly margin: (pct: string) => string;
  },
) {
  return {
    id: summary.id,
    number: summary.number,
    tag: t(PRICE_BOOK.versionTag, { number: summary.number }),
    note: summary.note,
    byline: t(PRICE_BOOK.onBy, {
      date: formats.date(summary.publishedAt),
      name: summary.publishedBy.name ?? '',
    }),
    year: formats.year(summary.publishedAt),
    margin: formats.margin(summary.defaultMarginPct),
    inForce: summary.active,
  };
}

/** A version's rates, each named in the reader's language with English standing in (`F3-10`). */
export function versionRatesOf(rates: readonly PriceBookRateWire[], language: UiLanguage) {
  return rates.map((rate, at) => ({
    key: String(at),
    name: authoredIn(rate.name, language).value,
    basis: rate.basis,
    amount: rate.amount,
  }));
}
