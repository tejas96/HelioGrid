import { z } from 'zod';
import { oneOf, packAmount, packLabel, packRate, packWhole } from '../market/stored-values';
import { TAX_STRATEGIES, type TaxPack } from './pack';

const componentShare = z.object({ code: z.string(), parts: packWhole });

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
    }),
  ),
  placeOfSupply: z.object({
    samePlace: z.array(componentShare),
    differentPlace: z.array(componentShare),
  }),
  platformSale: z.object({ serviceCode: z.string(), rateBasisPoints: packRate }),
  platformIsSupplierOfRecord: z.boolean(),
  statutoryExtras: z.array(z.object({ key: z.string(), activatesWhenTurnoverExceeds: packAmount })),
  fiscalYearStartMonth: oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  recordRetentionYears: packWhole,
});
