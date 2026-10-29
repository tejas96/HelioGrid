import type { TranslatedText } from '@heliogrid/contracts';
import type { ComplianceFloorSpec } from './ComplianceFloor.types';

export interface ComplianceFloorSentences {
  /** What cannot happen, flatly. Always first. */
  head: TranslatedText;
  /** Which floor, named — "Statutory opt-out · India · DoT commercial-communications rules". */
  named: string;
  /** The second sentence. In `refusal`, the one move that saves the rest of the work. */
  body: TranslatedText | null;
}

/**
 * ONE WORDING, NOT TWO. The refusal is rendered with the same sentence the row was already
 * carrying, so the owner meets one form of words wherever they meet the floor — which is why this
 * composition is shared by both platform halves rather than written twice.
 */
export function complianceFloorSentences({
  floor,
  authority,
  subject,
  act = 'removed',
  title,
  message,
  variant = 'line',
  words,
}: ComplianceFloorSpec): ComplianceFloorSentences {
  const refusal = variant === 'refusal';
  const head = title ?? (refusal ? words.notSaved(act, subject) : words.cannot(act));
  const named = [floor, authority].filter((part): part is string => Boolean(part)).join(' · ');
  const body = message ?? (refusal && named ? words.putBack(named) : null);
  return { head, named, body };
}
