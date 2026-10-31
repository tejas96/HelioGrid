import { z } from 'zod';
import { oneOf, packAmount, packLabel, packRate, packWhole } from '../market/stored-values';
import { TAX_STRATEGIES, type TaxPack } from './pack';

const componentShare = z.object({ code: z.string(), parts: packWhole });

/** A pack stored before these keys existed reads them as absent: no place rule, no registration. */
const registrationPlace = z
  .object({ start: packWhole, length: packWhole })
  .nullable()
  .default(null);
const registrationName = packLabel.nullable().default(null);
const platformSupplier = z
  .object({ legalName: z.string().min(1), address: z.string().min(1) })
  .nullable()
  .default(null);
const platformRegistration = z
  .object({ registrationType: z.string(), value: z.string() })
  .nullable()
  .default(null);

/** `pack.tax` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const TAX_PACK_SCHEMA: z.ZodType<TaxPack, z.ZodTypeDef, unknown> = z.object({
  scheme: z.string(),
  strategy: z.enum(TAX_STRATEGIES),
  registrationTypes: z.array(
    z.object({
      type: z.string(),
      pattern: z.string(),
      capturedAt: z.literal('conversion'),
      format: packLabel,
      placeAt: registrationPlace,
      name: registrationName,
    }),
  ),
  placeOfSupply: z.object({
    samePlace: z.array(componentShare),
    differentPlace: z.array(componentShare),
  }),
  platformSale: z.object({ serviceCode: z.string(), rateBasisPoints: packRate }),
  platformIsSupplierOfRecord: z.boolean(),
  platformRegistration,
  platformSupplier,
  statutoryExtras: z.array(z.object({ key: z.string(), activatesWhenTurnoverExceeds: packAmount })),
  fiscalYearStartMonth: oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  recordRetentionYears: packWhole,
});

/**
 * `pack.tax` as a device reads it off the wire, where a pack's keys travel opaque: the pack, or
 * `null` for a value that is not one — a screen that needs the tax rules then has none to show.
 */
export function taxPackOf(value: unknown): TaxPack | null {
  const read = TAX_PACK_SCHEMA.safeParse(value);
  return read.success ? read.data : null;
}
