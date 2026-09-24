import { z } from 'zod';
import { CERTIFICATION_EVIDENCE, type CertificationSchemesPack } from './pack';

/** `pack.certification-schemes` as a row stores it, validated whole (`T-FCORE-017`). */
export const CERTIFICATION_SCHEMES_PACK_SCHEMA: z.ZodType<
  CertificationSchemesPack,
  z.ZodTypeDef,
  unknown
> = z.object({
  schemes: z.array(z.object({ scheme: z.string(), evidence: z.enum(CERTIFICATION_EVIDENCE) })),
  standards: z.object({ family: z.string(), additional: z.array(z.string()) }),
});
