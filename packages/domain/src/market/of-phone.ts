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
