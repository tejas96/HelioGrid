import { z } from 'zod';
import { capturedAtSchema, memberRefSchema, phoneE164Schema, uuidSchema } from '../common';
import { errorEnvelopeWithFacts } from '../error';
import { studioSiteSchema } from './site';
import {
  designActRefusalSchema,
  designMountReadSchema,
  designStatusReadSchema,
} from './vocabulary';

/** One design as a card and the studio's top bar show it. */
export const designSchema = z.object({
  id: uuidSchema,
  /** The N of "Design N": the server's count within the record the design hangs on. */
  ordinal: z.number().int().positive(),
  mount: designMountReadSchema,
  status: designStatusReadSchema,
  /** The one design of its set the company puts first for the customer. */
  recommended: z.boolean(),
  createdBy: memberRefSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DesignWire = z.infer<typeof designSchema>;

/**
 * Who a design is for and where the host keeps it. This block is the HOST's: HelioGrid hangs a
 * design on a lead, and another host of the studio sends its own.
 */
export const designSubjectSchema = z.object({
  leadId: uuidSchema,
  customerName: z.string().nullable(),
  customerPhone: phoneE164Schema.nullable(),
});
export type DesignSubjectWire = z.infer<typeof designSubjectSchema>;

/** A design opened: the design, the site it is for, its subject, and whether the reader may change it. */
export const designDetailSchema = z.object({
  design: designSchema,
  site: studioSiteSchema,
  subject: designSubjectSchema,
  canEdit: z.boolean(),
});
export type DesignDetail = z.infer<typeof designDetailSchema>;

/** The designs hung on one record, newest first, and whether the reader may add one. */
export const designSetSchema = z.object({
  designs: z.array(designSchema),
  canDesign: z.boolean(),
});
export type DesignSet = z.infer<typeof designSetSchema>;

export const designParamsSchema = z.object({ id: uuidSchema });
/** The record a design hangs on, by its id — in HelioGrid, the lead. */
export const designHostParamsSchema = z.object({ id: uuidSchema });

/** A new design: an empty one, or a copy of another design of the same record. */
export const createDesignSchema = z
  .object({ copyOf: uuidSchema.nullable(), capturedAt: capturedAtSchema })
  .strict();
export type CreateDesign = z.infer<typeof createDesignSchema>;

export const recommendDesignSchema = z.object({ recommended: z.boolean() }).strict();
export type RecommendDesign = z.infer<typeof recommendDesignSchema>;

/** An act the studio refuses, with domain's reason. */
export const DESIGN_ACT_REFUSED = 'DESIGN_ACT_REFUSED' as const;
export const designActRefusedEnvelope = errorEnvelopeWithFacts(
  z.literal(DESIGN_ACT_REFUSED),
  z.object({ refusal: designActRefusalSchema }),
);
