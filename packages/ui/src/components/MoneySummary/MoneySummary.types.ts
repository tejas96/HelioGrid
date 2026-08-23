import type { ReactNode } from 'react';
import type {
  MoneyLine,
  MoneyReconcileSpec,
  MoneyReconciliation,
  MoneySummarySpec,
  ResolvedMoney,
} from '../../utils/money-lines';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/**
 * The equation's data shapes are DECLARED in `utils/money-lines` — the one arithmetic this block
 * and `DataTable.totalRow` both run through, so the two can never disagree about a payable, a
 * floor at zero or a failed reconciliation. Re-exported here as the component's contract.
 */
export type { MoneyLine, MoneyReconcileSpec, MoneyReconciliation, MoneySummarySpec, ResolvedMoney };

export interface MoneySummaryProps {
  /** The equation's members, in reading order: cost · battery · tax · incentive · discount. */
  lines: MoneyLine[];
  /** `SCR-M06-14`'s other figure — the BOM total this summary must agree with. */
  reconcile?: MoneyReconcileSpec;
  payableLabel?: string;
  overline?: string;
  /** `screen` — a quote screen or a phone card. `document` — on a sheet, at document type. */
  surface?: 'screen' | 'document';
  /** The payable's tier or standing — law 3's headline-figure slot, directly under the value. */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  note?: ReactNode;
  density?: 'expressive' | 'functional';
}
