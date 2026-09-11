import { type PhoneDigitsMismatch, phoneDigitsMismatch } from '../format/phone';
import type { MarketPack } from './pack';

/**
 * The market a phone belongs to, by its calling code (`F1-49`): the pack whose dial code the
 * E.164 number starts with, the longest match winning. The server's assignment at signup
 * (`M01-01`, `F1-07`): a tenant's market and currency come from here and are then fixed.
 * `null` when no authored market claims the number.
 */
export function marketOfPhone(packs: readonly MarketPack[], phoneE164: string): MarketPack | null {
  let match: MarketPack | null = null;
  for (const pack of packs) {
    const code = pack.formats.phone.dialCode;
    const longer = match === null || code.length > match.formats.phone.dialCode.length;
    if (phoneE164.startsWith(code) && longer) match = pack;
  }
  return match;
}

/**
 * Whether the platform can send to a number (`F1-49`): the market its dial code names, that
 * market's destination allowlist, and the national length the market's pack fixes — the rule
 * every door already applies on the field, applied once more where the message leaves. One
 * answer for the code and the invite, so a number no rail reaches never becomes an account.
 */
export type PhoneReach =
  | { readonly kind: 'reachable'; readonly pack: MarketPack }
  | { readonly kind: 'no-market' }
  | { readonly kind: 'not-allowed'; readonly pack: MarketPack }
  | ({ readonly kind: 'wrong-length'; readonly pack: MarketPack } & PhoneDigitsMismatch);

export function phoneReach(packs: readonly MarketPack[], phoneE164: string): PhoneReach {
  const pack = marketOfPhone(packs, phoneE164);
  if (pack === null) return { kind: 'no-market' };
  const allowed = pack.formats.otpDestinationDialCodes.some((code) => phoneE164.startsWith(code));
  if (!allowed) return { kind: 'not-allowed', pack };
  const mismatch = phoneDigitsMismatch(pack.formats, phoneE164);
  if (mismatch !== null) return { kind: 'wrong-length', pack, ...mismatch };
  return { kind: 'reachable', pack };
}
