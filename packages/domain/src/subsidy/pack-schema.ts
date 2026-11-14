import { z } from 'zod';
import { packAmount, packCount } from '../market/stored-values';
import { SYSTEM_TYPES } from '../proposals/system-type';
import { DEAL_SEGMENTS } from '../tenancy/segment';
import { INCENTIVE_RECEIVERS, type SubsidyPack } from './pack';

const slab = z.object({ kw: packCount, perKw: packAmount });

/** `pack.subsidy` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const SUBSIDY_PACK_SCHEMA: z.ZodType<SubsidyPack, z.ZodTypeDef, unknown> =
  z.discriminatedUnion('offered', [
    z.object({ offered: z.literal(false) }),
    z.object({
      offered: z.literal(true),
      scheme: z.string(),
      eligibility: z.object({
        segments: z.array(z.enum(DEAL_SEGMENTS)),
        requiredSchemes: z.array(z.string()),
        /** A pack stored before the list existed restricted no type. */
        systemTypes: z.array(z.enum(SYSTEM_TYPES)).default([...SYSTEM_TYPES]),
      }),
      /** A pack stored before the fact existed never took the incentive off a payable. */
      paidTo: z.enum(INCENTIVE_RECEIVERS).default('customer'),
      slabs: z.array(slab),
      regionalTopUps: z.array(z.object({ region: z.string(), slabs: z.array(slab) })),
      incentiveStage: z.object({ skippableForSegments: z.array(z.enum(DEAL_SEGMENTS)) }),
    }),
  ]);

/**
 * `pack.subsidy` as a device reads it off the wire, where a pack's keys travel opaque: the pack, or
 * `null` for a value that is not one — a screen that names the incentive then has none to name.
 */
export function subsidyPackOf(value: unknown): SubsidyPack | null {
  const read = SUBSIDY_PACK_SCHEMA.safeParse(value);
  return read.success ? read.data : null;
}
