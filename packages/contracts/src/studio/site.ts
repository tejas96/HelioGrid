import { SITE_NAME_MAX, SUPPLY_PHASES } from '@heliogrid/domain';
import { z } from 'zod';
import { areaRefSchema, capturedAtSchema, extensibleEnum, geoPointSchema } from '../common';
import { designMountSchema } from './vocabulary';

/**
 * The site a design is made for, as the studio reads and writes it. The host gives it and keeps
 * it: this shape names no record of the host's.
 */

export const studioSiteSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
  /** The exact point of the roof or the land. */
  pin: geoPointSchema.nullable(),
  /** The market pack's region code and the district, where one is known. */
  area: z.object({ area: z.string(), district: z.string().nullable() }).nullable(),
  /** The network operator, as the market's utility directory spells it. */
  utilityOperator: z.string().nullable(),
  supplyPhase: extensibleEnum(SUPPLY_PHASES).nullable(),
  sanctionedLoadKw: z.number().positive().nullable(),
});
export type StudioSiteWire = z.infer<typeof studioSiteSchema>;

/**
 * Site details, saved whole when the person starts the design. Only the pin is required: a design
 * cannot start without a place, and every other fact can be given where a later step needs it.
 */
export const saveSiteSchema = z
  .object({
    name: z.string().trim().min(1).max(SITE_NAME_MAX).nullable(),
    address: z.string().trim().min(1).max(500).nullable(),
    pin: geoPointSchema,
    area: areaRefSchema.nullable(),
    utilityOperator: z.string().trim().min(1).max(120).nullable(),
    supplyPhase: z.enum(SUPPLY_PHASES).nullable(),
    sanctionedLoadKw: z.number().positive().max(100000).nullable(),
    /** Where the panels go. The design's own fact: one site can carry a roof and a ground design. */
    mount: designMountSchema,
    capturedAt: capturedAtSchema,
  })
  .strict();
export type SaveSite = z.infer<typeof saveSiteSchema>;
