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

export interface MoneySummaryProps {
  /**
   * The server's equation: its lines in reading order (cost · battery · tax · incentive ·
   * discount), the payable, and its reconciliation against `SCR-M06-14`'s other figure.
   */
  equation: ResolvedMoney;
  payableLabel?: string;
  overline?: string;
  /** `screen` — a quote screen or a phone card. `document` — on a sheet, at document type. */
  surface?: 'screen' | 'document';
  /** The payable's tier or standing — law 3's headline-figure slot, directly under the value. */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  note?: ReactNode;
  density?: 'expressive' | 'functional';
}
