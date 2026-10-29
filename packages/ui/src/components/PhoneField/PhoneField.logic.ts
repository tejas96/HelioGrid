import { nationalNumber } from '@heliogrid/domain';
import type { FormatPack } from '../../utils/format';

/**
 * What the caller stores for what was typed: E.164, the pack's dial code before the national
 * digits, or `''` when there are none. A number pasted whole carries its `+` and code, which the box
 * already shows beside it.
 */
export function e164Of(pack: FormatPack, typed: string): string {
  const entered = nationalNumber(pack, typed);
  return entered.length === 0 ? '' : `${pack.phone.dialCode}${entered}`;
}
