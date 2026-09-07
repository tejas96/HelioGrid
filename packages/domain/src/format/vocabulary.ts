import type { PackLabel } from './languages';

/**
 * `F1-22` — the display vocabularies half of `pack.formats`: what a user READS for a canonical
 * machine value. The machines themselves keep market-neutral value names everywhere (`F1-09`);
 * `M08` owns the project chain, `M11` the payment ledger, and neither carries a label.
 *
 * **Every key here is an open-set string, and that is deliberate.** `F1-09` validates market
 * vocabularies against the pack rather than baking one market's set into a `pg` enum or a union,
 * and `M08`'s stage machine is not authored yet (Law 9) — a closed union would either invent it
 * or block this key on it. A reader returns `null` for an undeclared key rather than guessing.
 *
 * A label is per language (`Q87`, `PackLabel`), so a label change stays a pack revision (`F1-11`)
 * instead of a catalog release. Names in the never-translated set — `DISCOM` above all (`F3-08`,
 * `F1-51`) — carry `en` alone and read identically everywhere by construction.
 */

/** One canonical stage's label. `stage` is `M08`'s value name, never a market's word (`F1-09`). */
export interface StageLabel {
  readonly stage: string;
  readonly label: PackLabel;
}

/** One blocker party's label — who a project is waiting on (`F1-22`; `M08` owns the blocker). */
export interface BlockerPartyLabel {
  readonly party: string;
  readonly label: PackLabel;
}

/**
 * One payment mode's display name. The MODE is `pack.payment-rails` vocabulary (`F1-18`,
 * `rails/pack.ts`) and the NAME is this key's (§F1.2's assignment ruling), so the two are
 * declared once each and a market renames without touching the ledger.
 */
export interface PaymentModeLabel {
  readonly mode: string;
  readonly label: PackLabel;
}

export interface DisplayVocabulary {
  readonly stages: readonly StageLabel[];
  /**
   * The stages a project may pass without entering (`F1-22`). Names stages, never removes them:
   * a skipped stage stays in `M08`'s chain. The INCENTIVE stage's skippability is computed from
   * the deal by `subsidy/path.ts` (`F1-35`) — this list is the market's static declaration.
   */
  readonly skippableStages: readonly string[];
  readonly blockerParties: readonly BlockerPartyLabel[];
  readonly paymentModes: readonly PaymentModeLabel[];
}

/** The market's label for a stage, or `null` where it declares none (`F1-09`). */
export function stageLabel(vocabulary: DisplayVocabulary, stage: string): PackLabel | null {
  return vocabulary.stages.find((declared) => declared.stage === stage)?.label ?? null;
}

/** The market's label for a blocker party, or `null` where it declares none (`F1-09`). */
export function blockerPartyLabel(vocabulary: DisplayVocabulary, party: string): PackLabel | null {
  return vocabulary.blockerParties.find((declared) => declared.party === party)?.label ?? null;
}

/** The market's display name for a payment mode, or `null` where it declares none (`F1-09`). */
export function paymentModeLabel(vocabulary: DisplayVocabulary, mode: string): PackLabel | null {
  return vocabulary.paymentModes.find((declared) => declared.mode === mode)?.label ?? null;
}

/** `F1-22` — whether the market lets a project pass this stage without entering it. */
export function isSkippableStage(vocabulary: DisplayVocabulary, stage: string): boolean {
  return vocabulary.skippableStages.includes(stage);
}

/**
 * India (`F1-51`). Two stage labels and one blocker party, which is every value the PRD names —
 * the rest of `M08`'s chain is labelled when `M08` authors it (Law 9), and inventing labels for
 * stages that do not exist yet would put words on a machine nobody has designed.
 *
 * `DISCOM` is an operator-class name in the never-translated set (`F3-08`), so these carry `en`
 * alone: "DISCOM inspection" reads the same in Marathi, and three identical strings would be
 * three places to get it wrong.
 */
export const IN_VOCABULARY: DisplayVocabulary = {
  stages: [
    { stage: 'utility_inspection', label: { en: 'DISCOM inspection' } },
    { stage: 'incentive_claimed', label: { en: 'Subsidy claimed' } },
  ],
  /** `F1-51`, per `F1-35`. */
  skippableStages: ['incentive_claimed'],
  blockerParties: [{ party: 'utility', label: { en: 'DISCOM' } }],
  /**
   * One name per mode `IN_PAYMENT_RAILS` declares (`F1-18`). `UPI`, `NEFT` and `cheque` are the
   * market's own words, not translated copy.
   */
  paymentModes: [
    { mode: 'upi', label: { en: 'UPI' } },
    { mode: 'neft', label: { en: 'NEFT' } },
    { mode: 'cheque', label: { en: 'Cheque' } },
    { mode: 'cash', label: { en: 'Cash' } },
    { mode: 'payment_link', label: { en: 'Payment link' } },
  ],
};
