import type { TranslatedText } from '@heliogrid/contracts';
import type { PayableLine, ResolvedPayable } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/**
 * The arithmetic is the SERVER's (`F4-04`: no device computes a money figure): it runs
 * `resolvePayable` and this block prints the result. The rows and the payable arrive as ONE value,
 * so the rows shown can never be from another draft than the payable under them. This file adds
 * only what a RENDERED line carries beyond the arithmetic.
 */

/** One member of the equation as this block renders it: the domain's line plus its presentation. */
export type MoneyLine = PayableLine & {
  /** A second line under the label — "PM Surya Ghar, credited by the National Portal". */
  note?: ReactNode;
  strong?: boolean;
};

/** The server's resolved equation, each line carrying its presentation. */
export type ResolvedMoney = ResolvedPayable<MoneyLine>;

/** The two figures a failed reconciliation names, already formatted by the market's pack. */
export interface MoneyDisagreement {
  /** The equation's own name for its total — the server's words. */
  // biome-ignore lint/plugin/copy-prop-type: the server's name for the reconciled figure
  label: string;
  amount: string;
  // biome-ignore lint/plugin/copy-prop-type: the server's name for the compared figure
  againstLabel: string;
  target: string;
  gap: string;
}

/**
 * Every word the summary says itself, in the reader's language — `@heliogrid/i18n`'s
 * `moneySummaryWords(t)`. The figures in them arrive formatted by the market's pack.
 */
export interface MoneySummaryWords {
  /** The payable's word, unless `payableLabel` replaces it. */
  payable: TranslatedText;
  /** The block's overline, unless `overline` replaces it. */
  overline: TranslatedText;
  /** An unresolved line's amount — *not resolved yet*, never a zero. */
  unresolvedLine: TranslatedText;
  /** No price: the two figures disagree, named with the distance between them (`SCR-M06-14`). */
  disagrees: (figures: MoneyDisagreement) => TranslatedText;
  /** No price: this many lines have no resolved amount yet. */
  unresolved: (count: number) => TranslatedText;
  /** A payable at or below zero, shown with its warning (`M06-35`). */
  belowZero: (payable: string) => TranslatedText;
  /** The reconciliation that agreed — *Bill of materials reconciles · ₹4,52,000*. */
  reconciles: (label: string, amount: string) => TranslatedText;
}

export interface MoneySummaryProps {
  /**
   * The server's equation: its lines in reading order (cost · battery · tax · incentive ·
   * discount), the payable, and its reconciliation against `SCR-M06-14`'s other figure.
   */
  equation: ResolvedMoney;
  /** The summary's own words — `moneySummaryWords(t)`. */
  words: MoneySummaryWords;
  /** Replaces `words.payable`. */
  payableLabel?: TranslatedText;
  /** Replaces `words.overline`. */
  overline?: TranslatedText;
  /** `screen` — a quote screen or a phone card. `document` — on a sheet, at document type. */
  surface?: 'screen' | 'document';
  /** The payable's tier or standing — law 3's headline-figure slot, directly under the value. */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  note?: ReactNode;
  density?: 'expressive' | 'functional';
}
