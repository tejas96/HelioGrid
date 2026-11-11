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
  /**
   * The chain stage this row's document proves (`M08-15`, owner ruling 2026-11-10): uploading it
   * moves a project standing directly before that stage, and asks one tap of a project further
   * back. A row without one proves nothing and moves nothing.
   */
  readonly movesTo?: string;
  /**
   * Who fills the row instead of a person (owner ruling 2026-11-10): `payments` from the receipt
   * the payments module records, `handover` at the handover itself, since the pack is what
   * handover makes — a row a person waits on would make handover wait on itself.
   */
  readonly madeBy?: ChecklistRowMaker;
}

/** Who fills a checklist row in place of a person. */
export const CHECKLIST_ROW_MAKERS = ['payments', 'handover'] as const;
export type ChecklistRowMaker = (typeof CHECKLIST_ROW_MAKERS)[number];

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
 * India's rows, in the order `F1-52` states them, with the DISCOM feasibility approval and the
 * electrical inspector's (CEIG) approval added by owner ruling 2026-11-10 — each marked *Not
 * needed* with its reason where it does not apply (`M08` renders this order; a checklist whose
 * rows arrive shuffled reads as a different document).
 *
 * Keys stay market-neutral where a neutral word exists — `utility_approval` labelled "DISCOM
 * approval", the same shape `F1-51` gives the stages — so a second market re-labels rather than
 * re-keys. `DISCOM` is a name and stays as written in every language (`F3-08`); the words around it
 * are translated, as the DISCOM inspection stage is (`F3-09`).
 */
export const IN_DOCUMENT_CHECKLIST: readonly ChecklistRow[] = [
  {
    row: 'signed_proposal',
    label: { en: 'Signed proposal', hi: 'हस्ताक्षरित प्रस्ताव', mr: 'स्वाक्षरी केलेला प्रस्ताव' },
  },
  {
    row: 'advance_receipt',
    label: { en: 'Advance receipt', hi: 'अग्रिम रसीद', mr: 'आगाऊ पावती' },
    madeBy: 'payments',
  },
  {
    row: 'utility_feasibility',
    label: {
      en: 'DISCOM feasibility approval',
      hi: 'DISCOM व्यवहार्यता अनुमोदन',
      mr: 'DISCOM व्यवहार्यता मान्यता',
    },
  },
  {
    row: 'net_metering_application',
    label: { en: 'Net-metering application', hi: 'नेट-मीटरिंग आवेदन', mr: 'नेट-मीटरिंग अर्ज' },
  },
  {
    row: 'utility_approval',
    label: { en: 'DISCOM approval', hi: 'DISCOM अनुमोदन', mr: 'DISCOM मान्यता' },
  },
  {
    row: 'electrical_inspector_approval',
    label: {
      en: 'Electrical inspector (CEIG) approval',
      hi: 'विद्युत निरीक्षक (CEIG) अनुमोदन',
      mr: 'विद्युत निरीक्षक (CEIG) मान्यता',
    },
  },
  {
    row: 'commissioning_certificate',
    label: { en: 'Commissioning certificate', hi: 'कमीशनिंग प्रमाणपत्र', mr: 'कार्यान्वयन प्रमाणपत्र' },
    movesTo: 'commissioned',
  },
  {
    row: 'incentive_application',
    label: {
      en: 'Subsidy application & sanction',
      hi: 'सब्सिडी आवेदन और स्वीकृति',
      mr: 'अनुदान अर्ज आणि मंजुरी',
    },
    incentiveOnly: true,
    movesTo: 'incentive_claimed',
  },
  {
    row: 'warranty_documents',
    label: { en: 'Warranty documents', hi: 'वारंटी दस्तावेज़', mr: 'हमीपत्रे' },
  },
  {
    row: 'handover_pack',
    label: { en: 'Handover pack', hi: 'हैंडओवर पैक', mr: 'हस्तांतरण संच' },
    madeBy: 'handover',
  },
];
