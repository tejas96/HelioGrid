import { TRANCHE_LINE_LIMIT } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  amountSchema,
  createHeadersSchema,
  currencyCodeSchema,
  extensibleEnum,
  percentSchema,
  uuidSchema,
} from './common';
import {
  settingsChangedSchema,
  trancheTemplateSchema,
  trancheTemplateWriteSchema,
} from './document-templates';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED } from './error';

const c = initContract();

/**
 * The payment-term templates (`M01-54`, `SCR-M01-20`): the tenant's named splits, the one the
 * builder starts from, and the schedule a customer would see on a sample contract. Spread into
 * `tenantSettingsContract`, so each route keeps its key, path and operation id there.
 */

/**
 * Every template, and the newest create or save across them — `null` when none was ever saved.
 * Optional, because an api built before the field answers without it. Named apart from each
 * item's `changed`, which says whether a seeded split was edited.
 */
export const trancheTemplateListSchema = z.object({
  items: z.array(trancheTemplateSchema),
  lastSaved: settingsChangedSchema.nullable().optional(),
});
export type TrancheTemplateList = z.infer<typeof trancheTemplateListSchema>;

/** The shares of a split, in order — all a schedule on the sample contract needs. */
export const trancheSchedulePreviewRequestSchema = z.object({
  lines: z
    .array(z.object({ percent: percentSchema }))
    .min(1)
    .max(TRANCHE_LINE_LIMIT),
});
export type TrancheSchedulePreviewRequest = z.infer<typeof trancheSchedulePreviewRequestSchema>;

/**
 * The sample contract and each line's amount on it, worked out on the server (`F4-04`), in the
 * tenant's currency; the amounts are in the request's order and sum to `contract`.
 */
export const trancheSchedulePreviewSchema = z.object({
  currencyCode: currencyCodeSchema,
  contract: amountSchema,
  amounts: z.array(amountSchema),
});
export type TrancheSchedulePreview = z.infer<typeof trancheSchedulePreviewSchema>;

const guarded = { 401: errorEnvelope(baseError('UNAUTHENTICATED')) } as const;
const notFound = errorEnvelope(baseError('NOT_FOUND'));
const conflict = errorEnvelope(baseError('CONFLICT'));
/** The refusal only a tranche write raises; `tenantSettingsErrorCodes` enrols it with the others. */
export const trancheTemplateErrorCodes = ['TRANCHES_NOT_WHOLE'] as const;
const notWhole = errorEnvelope(z.enum(trancheTemplateErrorCodes));
const templateParams = z.object({ id: uuidSchema });

export const trancheTemplateRoutes = c.router({
  trancheTemplates: {
    method: 'GET',
    path: '/settings/tranche-templates',
    summary:
      'Every payment-term template, archived ones flagged, exactly one marked default, and who saved one last',
    responses: { 200: trancheTemplateListSchema, ...guarded },
  },
  createTrancheTemplate: {
    method: 'POST',
    path: '/settings/tranche-templates',
    headers: createHeadersSchema,
    body: trancheTemplateWriteSchema,
    summary: 'Add a named template — refused unless its lines total exactly 100.00',
    responses: {
      201: trancheTemplateSchema,
      ...guarded,
      422: errorEnvelope(extensibleEnum([...trancheTemplateErrorCodes, IDEMPOTENCY_KEY_REUSED])),
    },
  },
  saveTrancheTemplate: {
    method: 'PUT',
    path: '/settings/tranche-templates/:id',
    pathParams: templateParams,
    body: trancheTemplateWriteSchema,
    summary: 'Replace a template’s name and lines — refused unless they total exactly 100.00',
    responses: {
      200: trancheTemplateSchema,
      ...guarded,
      404: notFound,
      /** Archived: an archived template is history, never edited. */
      409: conflict,
      422: notWhole,
    },
  },
  archiveTrancheTemplate: {
    method: 'POST',
    path: '/settings/tranche-templates/:id/archive',
    pathParams: templateParams,
    body: c.noBody(),
    summary: 'Archive a template — never deleted; refused while it is the default',
    responses: { 200: trancheTemplateSchema, ...guarded, 404: notFound, 409: conflict },
  },
  restoreTrancheTemplate: {
    method: 'POST',
    path: '/settings/tranche-templates/:id/restore',
    pathParams: templateParams,
    body: c.noBody(),
    summary:
      'Put an archived template back in use — never as the default; one already in use is answered as it is',
    responses: { 200: trancheTemplateSchema, ...guarded, 404: notFound },
  },
  makeDefaultTrancheTemplate: {
    method: 'POST',
    path: '/settings/tranche-templates/:id/make-default',
    pathParams: templateParams,
    body: c.noBody(),
    summary: 'Make a template the tenant default — the one the builder and Quick mode start from',
    responses: {
      200: trancheTemplateSchema,
      ...guarded,
      404: notFound,
      /** Archived: an archived template cannot be the default. */
      409: conflict,
    },
  },
  previewTrancheSchedule: {
    method: 'POST',
    path: '/settings/tranche-templates/preview',
    body: trancheSchedulePreviewRequestSchema,
    summary:
      'The schedule a customer sees on the sample contract for these shares — writes nothing; refused unless they total exactly 100.00',
    responses: { 200: trancheSchedulePreviewSchema, ...guarded, 422: notWhole },
  },
});
