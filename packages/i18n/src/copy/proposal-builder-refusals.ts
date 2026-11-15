import type { TranslatedText } from '@heliogrid/contracts';
import { AMOUNT_TOO_LARGE, AMOUNT_WHOLE_DIGITS_MAX } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { partsLimitWords } from './proposal-builder-sheets';

type T = Translator['t'];

const AMOUNT = {
  tooLarge: /*i18n*/ {
    id: 'Too large to record — an amount has at most {digits} digits before the point.',
  },
} as const;

/** The server's word on a field, as `packages/data` keeps a refused commit's answer — by shape. */
interface FieldRefusalLike {
  readonly kind: string;
  readonly refusal?: string;
  readonly code?: string | null;
  readonly details?: readonly { readonly path: string }[];
}

/**
 * A field's refusal the server names by its path (`F8-36`), said at the field in the step's own
 * words — a section's fourth brand at step 8 (`M06-27`) — or one the device held before sending: an
 * amount past the wire's whole digits. `null` for any other refusal, which the shared failure words say.
 */
export function proposalFieldRefusalWords(t: T, failure: unknown): TranslatedText | null {
  const answer = failure as FieldRefusalLike | null;
  if (answer?.kind === 'refused' && answer.refusal === AMOUNT_TOO_LARGE) {
    return t(AMOUNT.tooLarge, { digits: AMOUNT_WHOLE_DIGITS_MAX });
  }
  if (answer?.kind !== 'failed' || answer.code !== 'DOMAIN_RULE_VIOLATION') return null;
  const paths = (answer.details ?? []).map((detail) => detail.path);
  return paths.includes('fields.components') ? partsLimitWords(t) : null;
}
