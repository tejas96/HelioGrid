import type {
  PayableLine,
  PayableReconcileSpec,
  PayableSpec,
  ResolvedPayable,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/**
 * The arithmetic is `@heliogrid/domain`'s `resolvePayable`, in whole minor units — the one
 * equation this block, `DataTable.totalRow` and `DocumentPreview` all run through, so no two
 * surfaces can disagree about a payable or a failed reconciliation. This file adds only what a
 * RENDERED line carries beyond the arithmetic.
 */

/** One member of the equation as this block renders it: the domain's line plus its presentation. */
export type MoneyLine = PayableLine & {
  /** A second line under the label — "PM Surya Ghar, credited by the National Portal". */
  note?: ReactNode;
  strong?: boolean;
};

/** What `MoneySummary.resolve` and `MoneySummary.stands` take. */
export type MoneySummarySpec = PayableSpec<MoneyLine>;

/** The equation resolved over this block's lines. */
export type ResolvedMoney = ResolvedPayable<MoneyLine>;

export interface MoneySummaryProps {
  /** The equation's members, in reading order: cost · battery · tax · incentive · discount. */
  lines: MoneyLine[];
  /** `SCR-M06-14`'s other figure — the BOM total this summary must agree with. */
  reconcile?: PayableReconcileSpec;
  payableLabel?: string;
  overline?: string;
  /** `screen` — a quote screen or a phone card. `document` — on a sheet, at document type. */
  surface?: 'screen' | 'document';
  /** The payable's tier or standing — law 3's headline-figure slot, directly under the value. */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  note?: ReactNode;
  density?: 'expressive' | 'functional';
}
