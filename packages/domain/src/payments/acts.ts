import type { CalendarDate } from '../format/holidays';
import type { PaymentEntryKind, PaymentRefusal, TrancheState } from './vocabulary';

/**
 * The three money acts a person takes and when each is refused (`M11-36`…`M11-49`). A refusal is
 * a word the screen turns into a sentence; `null` lets the act through.
 */

function hasReason(reason: string): boolean {
  return reason.trim() !== '';
}

/** Recording a payment (`M11-33`…`M11-39`). The amount's own check is the server's. */
export interface PaymentToRecord {
  readonly state: TrancheState;
  readonly modeKnown: boolean;
  readonly receivedOn: CalendarDate;
  readonly today: CalendarDate;
  /** Another payment that stands already carries this reference. */
  readonly referenceUsed: boolean;
}

export function refusalToRecord(payment: PaymentToRecord): PaymentRefusal | null {
  if (payment.state === 'waived') return 'tranche_waived';
  if (!payment.modeKnown) return 'mode_unknown';
  if (payment.receivedOn > payment.today) return 'date_in_future';
  if (payment.referenceUsed) return 'reference_used';
  return null;
}

/** Reversing an entry (`M11-46`): a payment, once, with a reason. */
export interface EntryToReverse {
  readonly kind: PaymentEntryKind;
  readonly reversed: boolean;
  readonly reason: string;
}

export function refusalToReverse(entry: EntryToReverse): PaymentRefusal | null {
  if (entry.kind !== 'payment') return 'not_a_payment';
  if (entry.reversed) return 'already_reversed';
  if (!hasReason(entry.reason)) return 'reason_needed';
  return null;
}

/** Waiving a part (`M11-49`): terminal, with a reason, and only while something is still owed. */
export function refusalToWaive(state: TrancheState, reason: string): PaymentRefusal | null {
  if (state === 'waived') return 'tranche_waived';
  if (state === 'received') return 'tranche_received';
  if (!hasReason(reason)) return 'reason_needed';
  return null;
}
