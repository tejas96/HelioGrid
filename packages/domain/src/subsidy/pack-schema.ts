import { z } from 'zod';
import { packAmount, packCount } from '../market/stored-values';
import { DEAL_SEGMENTS } from '../tenancy/segment';
import type { SubsidyPack } from './pack';

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
      }),
      slabs: z.array(slab),
      regionalTopUps: z.array(z.object({ region: z.string(), slabs: z.array(slab) })),
      incentiveStage: z.object({ skippableForSegments: z.array(z.enum(DEAL_SEGMENTS)) }),
    }),
  ]);
