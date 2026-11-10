import { type FormatPack, phoneE164Of } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { ContractException } from '../../../common/errors/contract-exception';

/**
 * A typed number read the market's way (`M02-02`). A number the pack cannot read whole is refused
 * on its field — stored as typed, it would be an identity dedupe can never meet again.
 */
export function marketPhoneOf(formats: FormatPack, typed: string): string {
  const phone = phoneE164Of(formats, typed);
  if (phone !== null) return phone;
  throw new ContractException(
    'VALIDATION_FAILED',
    'Some fields need attention.',
    HttpStatus.BAD_REQUEST,
    [{ path: 'phoneE164', issue: `a ${formats.phone.nsnLength}-digit national number` }],
  );
}
