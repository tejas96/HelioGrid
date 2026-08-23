import type { ReactNode } from 'react';
import type { PendingActionSpec } from '../PendingAction';

/**
 * `aria-busy` (and its native `accessibilityState` partner) is true only while an act is STILL in
 * flight — a spec that came back `returned` is a finished, failed act, and the row is already back
 * to what it was. A ready node in the slot carries its own semantics and is never treated as busy.
 *
 * One declaration, because both halves of the row ask the same question.
 */
export function isPendingInFlight(pending?: PendingActionSpec | ReactNode): boolean {
  if (!pending) return false;
  if (typeof pending !== 'object') return true;
  if (!('state' in pending)) return true;
  return pending.state !== 'returned';
}
