import { z } from 'zod';
import {
  CERTIFICATION_EVIDENCE,
  type CertificationScheme,
  type CertificationSchemesPack,
} from './pack';
import { badgedSchemes } from './schemes';

/** `pack.certification-schemes` as a row stores it, validated whole (`T-FCORE-017`). */
export const CERTIFICATION_SCHEMES_PACK_SCHEMA: z.ZodType<
  CertificationSchemesPack,
  z.ZodTypeDef,
  unknown
> = z.object({
  schemes: z.array(z.object({ scheme: z.string(), evidence: z.enum(CERTIFICATION_EVIDENCE) })),
  standards: z.object({ family: z.string(), additional: z.array(z.string()) }),
});

/**
 * The schemes a list badges, read off the wire where a pack's keys travel opaque: `null` for a
 * value that is not the key, so a screen tells "this market declares none" from "unread".
 */
export function badgedSchemesOf(value: unknown): readonly string[] | null {
  const read = CERTIFICATION_SCHEMES_PACK_SCHEMA.safeParse(value);
  return read.success ? badgedSchemes(read.data) : null;
}

/** The schemes a market declares, each with the evidence its form collects; `null` while unread. */
export function declaredSchemesOf(value: unknown): readonly CertificationScheme[] | null {
  const read = CERTIFICATION_SCHEMES_PACK_SCHEMA.safeParse(value);
  return read.success ? read.data.schemes : null;
}
