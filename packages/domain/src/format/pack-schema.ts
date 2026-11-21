import { z } from 'zod';
import {
  oneOf,
  packAmount,
  packCount,
  packLabel,
  packMarketCode,
  packRate,
  packWhole,
} from '../market/stored-values';
import { FORECAST_STAGES } from '../proposals/forecast-stage';
import { CHECKLIST_ROW_MAKERS } from './checklist';
import { type FormatPack, MEASUREMENT_SYSTEMS } from './pack';

/** The finest zoom any map service cuts its tiles at. */
const SKY_ZOOM_CEILING = 22;

const stageLabel = z.object({ stage: z.string(), label: packLabel });
const partyLabel = z.object({ party: z.string(), label: packLabel });
const modeLabel = z.object({ mode: z.string(), label: packLabel });
const reasonLabel = z.object({ reason: z.string(), label: packLabel });
const coordinate = z.object({ latitude: z.number().finite(), longitude: z.number().finite() });
const area = z.object({
  code: z.string(),
  name: packLabel,
  coordinate,
  districts: z.array(z.object({ name: z.string(), coordinate })),
});
const proposalFacts = z.object({
  panelCapacityTolerance: packRate,
  inverterBandPercent: z.object({ from: packCount, to: packCount }),
  emiExample: z.object({ tenureYears: packCount, rate: packRate }),
  exportRatePerKwh: packAmount,
  tariffRise: packRate,
  lifetimeYears: packWhole,
  typicalTariffPerKwh: packAmount.nullable().default(null),
  forecastLikelihood: z.array(z.object({ stage: z.enum(FORECAST_STAGES), likelihood: packRate })),
});

/** `pack.formats` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const FORMAT_PACK_SCHEMA: z.ZodType<FormatPack, z.ZodTypeDef, unknown> = z.object({
  id: packMarketCode,
  name: packLabel,
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
  bankRoutingLabel: z.string(),
  phone: z.object({ dialCode: z.string(), nsnGroups: z.array(packWhole), nsnLength: packWhole }),
  measurementSystem: z.enum(MEASUREMENT_SYSTEMS),
  holidayCalendar: z.array(z.string()),
  otpDestinationDialCodes: z.array(z.string()),
  vocabulary: z.object({
    stages: z.array(stageLabel),
    skippableStages: z.array(z.string()),
    blockerParties: z.array(partyLabel),
    /** A pack stored before `M08` declares no reasons: it reads as none until the next revision. */
    blockerReasons: z.array(reasonLabel).default([]),
    paymentModes: z.array(modeLabel),
  }),
  documentChecklist: z.array(
    z.object({
      row: z.string(),
      label: packLabel,
      incentiveOnly: z.boolean().optional(),
      movesTo: z.string().optional(),
      madeBy: z.enum(CHECKLIST_ROW_MAKERS).optional(),
    }),
  ),
  /** A pack stored before `M08` declares no steps: it reads as none until the next revision. */
  installSteps: z.array(z.object({ step: z.string(), label: packLabel })).default([]),
  utilities: z.object({
    regions: z.array(
      z.object({
        region: z.string(),
        /** A pack stored before the studio declares no area code: the region then serves no area. */
        area: z.string().nullable().default(null),
        operators: z.array(z.string()),
      }),
    ),
    waits: z.array(
      z.object({
        procedure: z.string(),
        typicalWeeks: z.object({ from: packWhole, to: packWhole }),
      }),
    ),
  }),
  /** A pack stored before proposals declares no areas and no proposal facts, until the next revision. */
  areas: z.array(area).default([]),
  proposal: proposalFacts.nullable().default(null),
  /** A pack stored before it declares no cap: the sky picture then runs to its provider's own. */
  skyPictureRealZoomMax: z.number().int().min(0).max(SKY_ZOOM_CEILING).nullable().default(null),
});
