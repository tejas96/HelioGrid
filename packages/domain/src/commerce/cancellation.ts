import { nextLocalTime } from '../format/zone';

/**
 * Leaving and coming back (`M12-47`, `M12-50`, `M12-08`): the reasons an Owner may give, the
 * refund's window and how long a reactivation's hosted page stays open.
 */

/**
 * `M12-50` — why an Owner cancelled, captured as product signal and never as a gate: a cancel with
 * no reason is the same act. Values append in the order the enum grew.
 */
export const CANCELLATION_REASONS = [
  'too_expensive',
  'missing_something',
  'moving_tool',
  'business_pausing',
  'something_else',
] as const;
export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

/** `M12-47` — the first paid cycle refunds in full for this many calendar days. */
export const REFUND_WINDOW_DAYS = 7;

/**
 * `M12-08` — a reactivation's hosted page takes money for this many hours. A dead row has no
 * trial end to borrow, and a page left open forever could collect after its company moved on.
 */
export const REACTIVATION_PAGE_HOURS = 24;

const MS_PER_HOUR = 60 * 60 * 1_000;

/** When a reactivation page opened at `openedAt` stops taking money. */
export function reactivationPageExpiresAt(openedAt: number): number {
  return openedAt + REACTIVATION_PAGE_HOURS * MS_PER_HOUR;
}

/**
 * `M12-47` — the moment the refund window closes: the start of the day after the window's last
 * calendar day on the company's clock (`F1-10`). Paid on 12 Sept, the refund is open through
 * 18 Sept and closes as 19 Sept begins. Each step asks the zone for its next midnight, so a
 * daylight shift inside the window moves no day.
 */
export function refundWindowClosesAt(paidAt: number, timeZone: string): number {
  let midnight = paidAt;
  for (let day = 0; day < REFUND_WINDOW_DAYS; day += 1) {
    midnight = nextLocalTime(midnight, 0, timeZone);
  }
  return midnight;
}

/**
 * The scheme's credit-note artefact a refund issues (`M12-47`): a tax credit note once the
 * platform is registered for the scheme's tax (IN: a GST credit note), else a plain one (`F1-29`).
 */
export type CreditNoteArtefact = 'tax_credit_note' | 'plain_credit_note';

export function creditNoteArtefactOf(platformRegistered: boolean): CreditNoteArtefact {
  return platformRegistered ? 'tax_credit_note' : 'plain_credit_note';
}
