import { z } from 'zod';
import { oneOf, packLabel, packMarketCode, packWhole } from '../market/stored-values';
import { type FormatPack, MEASUREMENT_SYSTEMS } from './pack';

const stageLabel = z.object({ stage: z.string(), label: packLabel });
const partyLabel = z.object({ party: z.string(), label: packLabel });
const modeLabel = z.object({ mode: z.string(), label: packLabel });

/** `pack.formats` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const FORMAT_PACK_SCHEMA: z.ZodType<FormatPack, z.ZodTypeDef, unknown> = z.object({
  id: packMarketCode,
  locale: z.string(),
  currency: z.string(),
  currencySymbol: z.string().nullable(),
  symbolPosition: z.enum(['before', 'after']),
  currencyFractionDigits: packWhole,
  minorUnitDigits: packWhole,
  compactSteps: z.array(z.object({ from: packWhole, divisor: packWhole, suffix: z.string() })),
  clock: z.enum(['24h', '12h']),
  timeZone: z.string(),
  firstDayOfWeek: oneOf([1, 2, 3, 4, 5, 6, 7]),
  taxIdLabel: z.string(),
  phone: z.object({ dialCode: z.string(), nsnGroups: z.array(packWhole), nsnLength: packWhole }),
  measurementSystem: z.enum(MEASUREMENT_SYSTEMS),
  holidayCalendar: z.array(z.string()),
  otpDestinationDialCodes: z.array(z.string()),
  vocabulary: z.object({
    stages: z.array(stageLabel),
    skippableStages: z.array(z.string()),
    blockerParties: z.array(partyLabel),
    paymentModes: z.array(modeLabel),
  }),
  documentChecklist: z.array(
    z.object({ row: z.string(), label: packLabel, incentiveOnly: z.boolean().optional() }),
  ),
  utilities: z.object({
    regions: z.array(z.object({ region: z.string(), operators: z.array(z.string()) })),
    waits: z.array(
      z.object({
        procedure: z.string(),
        typicalWeeks: z.object({ from: packWhole, to: packWhole }),
      }),
    ),
  }),
});
