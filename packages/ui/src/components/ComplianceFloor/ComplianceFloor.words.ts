import type { ComplianceFloorSpec } from './ComplianceFloor.types';

export interface ComplianceFloorWords {
  /** What cannot happen, flatly. Always first. */
  head: string;
  /** Which floor, named — "Statutory opt-out · India · DoT commercial-communications rules". */
  named: string;
  /** The second sentence. In `refusal`, the one move that saves the rest of the work. */
  body: string | null;
}

/**
 * ONE WORDING, NOT TWO. The refusal is rendered with the same sentence the row was already
 * carrying, so the owner meets one form of words wherever they meet the floor — which is why this
 * composition is shared by both platform halves rather than written twice.
 */
export function complianceFloorWords({
  floor,
  authority,
  subject,
  act = 'removed',
  title,
  message,
  variant = 'line',
}: ComplianceFloorSpec): ComplianceFloorWords {
  const refusal = variant === 'refusal';
  const head =
    title ??
    (refusal
      ? `Not saved — ${subject ?? 'this'} cannot be ${act}`
      : `Required by law — cannot be ${act}`);
  const named = [floor, authority].filter((part): part is string => Boolean(part)).join(' · ');
  const body =
    message ?? (refusal && named ? `${named}. Put it back to save your other changes.` : null);
  return { head, named, body };
}
