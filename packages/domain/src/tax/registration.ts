import type { PackLabel } from '../format/languages';
import type { TaxPack } from './pack';

/**
 * Why a registration was not accepted (`M01-25`): a type the tenant's market never declared, or
 * a value that does not read as one — with the market's own description of the format, so the
 * refusal explains and the module never names one market's tax id (`F1-22`).
 */
export type TaxRegistrationCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'unknown_type' }
  | { readonly ok: false; readonly reason: 'malformed'; readonly format: PackLabel };

/**
 * The live check a registration field runs and the save runs again (`M01-25`, `F1-13`): the
 * FORMAT only — the check character is the registry's to verify, and the surface says so. Never
 * a hard wall: a caller that hears `malformed` explains and keeps skip available.
 */
export function checkTaxRegistration(
  pack: TaxPack,
  registrationType: string,
  value: string,
): TaxRegistrationCheck {
  const declared = pack.registrationTypes.find((type) => type.type === registrationType);
  if (declared === undefined) return { ok: false, reason: 'unknown_type' };
  if (!new RegExp(declared.pattern).test(value)) {
    return { ok: false, reason: 'malformed', format: declared.format };
  }
  return { ok: true };
}
