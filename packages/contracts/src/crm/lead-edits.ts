import { SITE_NAME_MAX, SUPPLY_PHASES } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { geoPointSchema } from '../common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from '../error';
import { uiLanguageSchema } from '../locale';
import { citySchema, personNameSchema } from '../tenant';
import { leadDetailSchema, leadParamsSchema } from './leads';
import { capturedAtSchema, monthlyBillWriteSchema } from './schemas';
import {
  buyingTimelineSchema,
  dealSegmentSchema,
  decisionMakerSchema,
  roofOwnershipSchema,
  roofTypeSchema,
  shadingSchema,
} from './vocabulary';

const c = initContract();

/**
 * The fields a person edits on a lead and its customer (`M02-36`, `M02-37`, `M02-39`): the four
 * capture facts, the bill and the five qualifying chips, preferred language and do-not-call, and the
 * site's address, area and supply. Each
 * is sent alone as it is answered; `null` empties a field back to its named gap. Every applied
 * change writes one timeline entry with the old and new value, and the server's apply order —
 * never the device clock — decides which of two edits to one field stands (`F4-16`).
 */
export const leadFieldsSchema = z.object({
  name: personNameSchema.nullable(),
  city: citySchema.nullable(),
  segment: dealSegmentSchema.nullable(),
  monthlyBill: monthlyBillWriteSchema.nullable(),
  roofOwnership: roofOwnershipSchema.nullable(),
  roofType: roofTypeSchema.nullable(),
  shading: shadingSchema.nullable(),
  timeline: buyingTimelineSchema.nullable(),
  decisionMaker: decisionMakerSchema.nullable(),
  preferredLanguage: uiLanguageSchema.nullable(),
  doNotCall: z.boolean(),
  /** Where the system goes (`M06-16`): one address, kept on the lead for the proposal and the project. */
  siteAddress: z.string().trim().min(1).max(500).nullable(),
  /** The site's region and district, as the market pack names them (`M06-09`). */
  area: z
    .object({ area: z.string().min(1).max(12), district: z.string().min(1).max(120).nullable() })
    .nullable(),
  sanctionedLoadKw: z.number().positive().max(100000).nullable(),
  supplyPhase: z.enum(SUPPLY_PHASES).nullable(),
  /** What the studio's Site details adds: the site's name, the roof's exact point, the operator. */
  siteName: z.string().trim().min(1).max(SITE_NAME_MAX).nullable(),
  sitePin: geoPointSchema.nullable(),
  utilityOperator: z.string().trim().min(1).max(120).nullable(),
});

/** Which field an edit changed — the keys of the edit, named once (`field_change` entries). */
export const leadFieldSchema = leadFieldsSchema.keyof();
export type LeadField = z.infer<typeof leadFieldSchema>;

/** One or more fields, and when the person set them. */
export const editLeadSchema = leadFieldsSchema
  .partial()
  .extend({ capturedAt: capturedAtSchema })
  .strict();
export type EditLead = z.infer<typeof editLeadSchema>;

export const leadEditsContract = c.router({
  edit: {
    method: 'PATCH',
    path: '/leads/:id',
    pathParams: leadParamsSchema,
    body: editLeadSchema,
    summary:
      'Save the fields sent, each alone — per-field last writer wins, and every applied change is on the timeline',
    responses: {
      200: leadDetailSchema,
      401: unauthenticatedEnvelope,
      404: errorEnvelope(baseError('NOT_FOUND')),
      /** The bill has more fraction digits than the tenant's currency — `details[].path` is `monthlyBill`. */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
    },
  },
});
