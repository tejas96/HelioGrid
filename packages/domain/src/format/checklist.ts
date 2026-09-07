import type { SubsidyPack } from '../subsidy/pack';
import { isSubsidyAvailable } from '../subsidy/path';
import type { DealSegment } from '../tenancy/segment';
import type { PackLabel } from './languages';

/**
 * `F1-22`, `F1-52` — the project document checklist: which rows a market's projects carry, and
 * which of them a deal omits. `M08` owns seeding, statuses and the handover rule; the ROW SET is
 * this key's, and the row keys are open-set strings validated against the pack (`F1-09`).
 */

export interface ChecklistRow {
  readonly row: string;
  readonly label: PackLabel;
  /**
   * The row exists only where the market's incentive actually reaches the deal (`F1-52`).
   *
   * Read through `isSubsidyAvailable` rather than a segment list carried here: the eligible
   * segments are declared once, in `pack.subsidy` (`F1-14`), and a second copy is how a
   * commercial project ends up owing a subsidy document the money path says it cannot claim.
   */
  readonly incentiveOnly?: boolean;
}

/**
 * The rows this deal's project carries (`F1-52`, `F1-35`). Residential IN gets all eight;
 * commercial drops the subsidy row, because `pack.subsidy` does not reach that segment.
 *
 * A market declaring no subsidy at all drops the row everywhere by the same read — no market
 * check, no branch on a market name (`F1-01`).
 */
export function checklistForDeal(
  rows: readonly ChecklistRow[],
  subsidy: SubsidyPack,
  segment: DealSegment,
): readonly ChecklistRow[] {
  const incentiveReaches = isSubsidyAvailable(subsidy, segment);
  return rows.filter((row) => !row.incentiveOnly || incentiveReaches);
}

/**
 * India's eight rows, in the order `F1-52` states them (`M08` renders that order; a checklist
 * whose rows arrive shuffled reads as a different document).
 *
 * Keys stay market-neutral where a neutral word exists — `utility_approval` labelled "DISCOM
 * approval", the same shape `F1-51` gives the stages — so a second market re-labels rather than
 * re-keys. `DISCOM` is never translated (`F3-08`), so those rows carry `en` alone.
 */
export const IN_DOCUMENT_CHECKLIST: readonly ChecklistRow[] = [
  { row: 'signed_proposal', label: { en: 'Signed proposal' } },
  { row: 'advance_receipt', label: { en: 'Advance receipt' } },
  { row: 'net_metering_application', label: { en: 'Net-metering application' } },
  { row: 'utility_approval', label: { en: 'DISCOM approval' } },
  {
    row: 'incentive_application',
    label: { en: 'Subsidy application & sanction' },
    incentiveOnly: true,
  },
  { row: 'commissioning_certificate', label: { en: 'Commissioning certificate' } },
  { row: 'warranty_documents', label: { en: 'Warranty documents' } },
  { row: 'handover_pack', label: { en: 'Handover pack' } },
];
