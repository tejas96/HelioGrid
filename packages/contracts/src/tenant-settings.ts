import { SETTING_SOURCES } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  businessProfileSchema,
  taxRegistrationSchema,
  taxRegistrationsSchema,
} from './business-profile';
import { uuidSchema } from './common';
import { labelSchema } from './document-content';
import {
  brandingSchema,
  brandingWriteSchema,
  proposalTemplateSchema,
  timelineTemplateSchema,
  trancheTemplateSchema,
  trancheTemplateWriteSchema,
} from './document-templates';
import { baseError, errorEnvelope } from './error';
import { uiLanguageSchema } from './locale';
import { promptPointFactSchema } from './onboarding';

const c = initContract();

/**
 * Tenant settings (`T-M01-026`): every setting's one home, its platform default filled where
 * the tenant set nothing (`M01-28`), and the one resolved read the builder, Quick mode, the
 * documents and the customer link consume (`M01-53`). The shapes sit beside this file by what
 * they hold — `business-profile.ts`, `document-templates.ts`, `document-content.ts` — and each
 * mirrors a domain view-model (`commerce/effective-settings.ts`, Law 11).
 */

/** `YYYY-MM-DD`, a real day — a holiday is a DAY, compared on the tenant's clock by its readers (`F1-10`). */
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'a day is YYYY-MM-DD')
  .refine((day) => {
    const parsed = Date.parse(`${day}T00:00:00Z`);
    return !Number.isNaN(parsed) && new Date(parsed).toISOString().startsWith(day);
  }, 'not a real day');

export const tenantHolidaySchema = z.object({
  date: calendarDateSchema,
  label: labelSchema,
});
export type TenantHoliday = z.infer<typeof tenantHolidaySchema>;

/** The tenant's own additions (`M01-59`), replaced whole; the pack's calendar is never written. */
export const holidaysSchema = z.object({
  holidays: z.array(tenantHolidaySchema).max(366),
});
export type Holidays = z.infer<typeof holidaysSchema>;

export const settingSourceSchema = z.enum(SETTING_SOURCES);
export type SettingSource = z.infer<typeof settingSourceSchema>;

/** A setting in force, marked tenant-set or platform default (`M01-28`). */
function resolved<T extends z.ZodTypeAny>(value: T) {
  return z.object({ source: settingSourceSchema, value });
}

const localeSchema = z.object({
  defaultLanguage: uiLanguageSchema,
  /** IANA zone — the pack's default until the tenant sets its own (`F1-10`). */
  timezone: z.string().min(1),
});

/**
 * Every setting resolved (`M01-28`, `M01-53`) — the one read the builder, Quick mode, the
 * documents and the customer link consume. Identity facts the tenant never gave read absent
 * with their prompt-point still owed; nothing is undefined.
 */
export const effectiveSettingsSchema = z.object({
  companyIdentity: resolved(businessProfileSchema.merge(localeSchema)),
  taxRegistrations: resolved(z.array(taxRegistrationSchema)),
  branding: resolved(brandingSchema),
  proposalTemplate: resolved(proposalTemplateSchema),
  timelineTemplate: resolved(timelineTemplateSchema),
  /** The tenant's default row, or the platform's first split with no row behind it (`id` null). */
  defaultTrancheTemplate: resolved(
    trancheTemplateWriteSchema.extend({ id: uuidSchema.nullable() }),
  ),
  /** The days in force: the pack's floor plus the tenant's additions, sorted (`F1-17`). */
  holidays: resolved(z.array(calendarDateSchema)),
  locale: resolved(localeSchema),
  /** The skipped facts still owed their one prompt-point (`M01-29`). */
  pendingPromptPoints: z.array(promptPointFactSchema),
});
export type EffectiveSettings = z.infer<typeof effectiveSettingsSchema>;

/**
 * The refusals only the settings writes raise, each a state the surface renders in its own
 * words (`packages/i18n` keeps copy as a `Record` over this enum): the lines do not total 100.00
 * — the message names the unallocated remainder; a registration does not read as one of its type
 * — `details[].issue` carries the market's format sentence in the reader's language.
 */
export const tenantSettingsErrorCodes = [
  'TRANCHES_NOT_WHOLE',
  'TAX_REGISTRATION_MALFORMED',
] as const;
export const tenantSettingsErrorCodeSchema = z.enum(tenantSettingsErrorCodes);
export type TenantSettingsErrorCode = z.infer<typeof tenantSettingsErrorCodeSchema>;

const unauthenticated = errorEnvelope(baseError('UNAUTHENTICATED'));
const forbidden = errorEnvelope(baseError('FORBIDDEN'));
const notFound = errorEnvelope(baseError('NOT_FOUND'));
const conflict = errorEnvelope(baseError('CONFLICT'));

const guarded = { 401: unauthenticated, 403: forbidden } as const;
const templateParams = z.object({ id: uuidSchema });

export const tenantSettingsContract = c.router({
  effective: {
    method: 'GET',
    path: '/settings/effective',
    summary:
      'Every setting in force, the platform default filled where the tenant set nothing — what the builder, Quick mode, documents and the customer link read',
    responses: { 200: effectiveSettingsSchema, ...guarded },
  },
  businessProfile: {
    method: 'GET',
    path: '/settings/business-profile',
    summary: 'The business profile: the five parts as stored, the two declarations among them',
    responses: { 200: businessProfileSchema, ...guarded },
  },
  saveBusinessProfile: {
    method: 'PUT',
    path: '/settings/business-profile',
    body: businessProfileSchema,
    summary: 'Replace the business profile — the one write-point every document reads by reference',
    responses: { 200: businessProfileSchema, ...guarded },
  },
  taxRegistrations: {
    method: 'GET',
    path: '/settings/tax-registrations',
    summary: 'The tenant’s tax registrations, empty until the first proposal asks',
    responses: { 200: taxRegistrationsSchema, ...guarded },
  },
  saveTaxRegistrations: {
    method: 'PUT',
    path: '/settings/tax-registrations',
    body: taxRegistrationsSchema,
    summary:
      'Replace the registrations — each checked against the market’s format, a failure explaining it',
    responses: {
      200: taxRegistrationsSchema,
      ...guarded,
      /** `TAX_REGISTRATION_MALFORMED`: the format sentence rides `details[].issue`. `DOMAIN_RULE_VIOLATION`: a type this market never declared. */
      422: errorEnvelope(
        z.enum([
          tenantSettingsErrorCodeSchema.enum.TAX_REGISTRATION_MALFORMED,
          baseError('DOMAIN_RULE_VIOLATION').value,
        ]),
      ),
    },
  },
  branding: {
    method: 'GET',
    path: '/settings/branding',
    summary:
      'Branding as read, with the compliant shades derived on this read for the live preview',
    responses: { 200: brandingSchema, ...guarded },
  },
  saveBranding: {
    method: 'PUT',
    path: '/settings/branding',
    body: brandingWriteSchema,
    summary:
      'Save the brand colour and letterhead — never refused; the response carries the derived shades',
    responses: { 200: brandingSchema, ...guarded },
  },
  proposalTemplate: {
    method: 'GET',
    path: '/settings/proposal-template',
    summary: 'The document defaults as stored — cover, sections, terms',
    responses: { 200: proposalTemplateSchema, ...guarded },
  },
  saveProposalTemplate: {
    method: 'PUT',
    path: '/settings/proposal-template',
    body: proposalTemplateSchema,
    summary:
      'Replace the document defaults; sent documents are unchanged, new generations use these',
    responses: { 200: proposalTemplateSchema, ...guarded },
  },
  timelineTemplate: {
    method: 'GET',
    path: '/settings/timeline-template',
    summary: 'The project-timeline template as stored',
    responses: { 200: timelineTemplateSchema, ...guarded },
  },
  saveTimelineTemplate: {
    method: 'PUT',
    path: '/settings/timeline-template',
    body: timelineTemplateSchema,
    summary: 'Replace the timeline phases, in the order sent',
    responses: { 200: timelineTemplateSchema, ...guarded },
  },
  trancheTemplates: {
    method: 'GET',
    path: '/settings/tranche-templates',
    summary: 'Every payment-term template, archived ones flagged, exactly one marked default',
    responses: { 200: z.object({ items: z.array(trancheTemplateSchema) }), ...guarded },
  },
  createTrancheTemplate: {
    method: 'POST',
    path: '/settings/tranche-templates',
    body: trancheTemplateWriteSchema,
    summary: 'Add a named template — refused unless its lines total exactly 100.00',
    responses: {
      201: trancheTemplateSchema,
      ...guarded,
      422: errorEnvelope(tenantSettingsErrorCodeSchema.extract(['TRANCHES_NOT_WHOLE'])),
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
      422: errorEnvelope(tenantSettingsErrorCodeSchema.extract(['TRANCHES_NOT_WHOLE'])),
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
  holidays: {
    method: 'GET',
    path: '/settings/holidays',
    summary: 'The tenant’s own holidays — its additions to the pack calendar',
    responses: { 200: holidaysSchema, ...guarded },
  },
  saveHolidays: {
    method: 'PUT',
    path: '/settings/holidays',
    body: holidaysSchema,
    summary: 'Replace the tenant’s additions; the pack’s days stay in force whatever is sent',
    responses: { 200: holidaysSchema, ...guarded },
  },
});
