import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  membershipStatusSchema,
  paginated,
  paginationQuerySchema,
  phoneE164Schema,
  rolePresetSchema,
  roleSetSchema,
  tenantSegmentSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope } from './error';
import { uiLanguageSchema } from './locale';
import { marketCodeSchema } from './market';
import { sessionProjectionSchema } from './session';

const c = initContract();

export const companyNameSchema = z.string().trim().min(1).max(120);
export const citySchema = z.string().trim().min(1).max(80);
const personNameSchema = z.string().trim().min(1).max(120);

/** Company signup from a verified OTP (`M01-01`): exactly these three, nothing else. */
export const createTenantSchema = z.object({
  companyName: companyNameSchema,
  ownerName: personNameSchema,
  city: citySchema,
});
export type CreateTenant = z.infer<typeof createTenantSchema>;

/** The tenant facts the shell and settings read (`GET /tenants/me`). */
export const tenantSchema = z.object({
  id: uuidSchema,
  companyName: companyNameSchema,
  city: citySchema,
  /** Fixed at creation from the owner's phone; never changes (`F1-07`). */
  marketCode: marketCodeSchema,
  /** ISO 4217, server-assigned from the market's pack; one per tenant (`F1-07`). */
  currencyCode: z.string().length(3),
  defaultLanguage: uiLanguageSchema,
  /** IANA zone — the pack's default until the tenant sets its own (`F1-10`). */
  timezone: z.string().min(1),
  segment: tenantSegmentSchema.nullable(),
  /** Declared in kWp (`M01-23`); null until the setup step that asks. */
  typicalSystemKwp: z.number().nonnegative().nullable(),
});
export type Tenant = z.infer<typeof tenantSchema>;

/** One row of the roster (`M01-19`): who, what they hold, and whether they are still with us. */
export const memberSchema = z.object({
  membershipId: uuidSchema,
  userId: uuidSchema,
  name: z.string(),
  phoneE164: phoneE164Schema,
  roles: z.array(rolePresetSchema),
  status: membershipStatusSchema,
  lastActiveAt: z.string().datetime().nullable(),
});
export type Member = z.infer<typeof memberSchema>;

/**
 * The presets a person will hold after the write — the whole set, old → new (`M01-20`), never a
 * delta. At least one (`roleSetSchema`, F2-21).
 */
export const assignRolesSchema = z.object({ roles: roleSetSchema });
export type AssignRoles = z.infer<typeof assignRolesSchema>;

/**
 * The refusals only the tenant's guarded transitions raise (F2-19). `LAST_OWNER`: the change
 * would leave the company without an EPC Owner — and so without anyone who can manage the team,
 * which in this matrix is the same person. A route code, so the wire carries the reason and the
 * screen the words (`packages/i18n` keeps copy as a `Record` over this enum).
 */
export const tenantErrorCodes = ['LAST_OWNER'] as const;
export const tenantErrorCodeSchema = z.enum(tenantErrorCodes);
export type TenantErrorCode = z.infer<typeof tenantErrorCodeSchema>;

const memberParamsSchema = z.object({ membershipId: uuidSchema });

export const similarTenantsQuerySchema = z.object({
  companyName: companyNameSchema,
  city: citySchema,
});

/** A likely-existing workspace the signup steers to (`M01-09`): enough to ask to join, no more. */
export const similarTenantSchema = z.object({
  tenantId: uuidSchema,
  companyName: companyNameSchema,
  city: citySchema,
});

const unauthenticated = errorEnvelope(baseError('UNAUTHENTICATED'));
const forbidden = errorEnvelope(baseError('FORBIDDEN'));
const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const tenantContract = c.router({
  create: {
    method: 'POST',
    path: '/tenants',
    body: createTenantSchema,
    summary:
      'Company signup — the tenant, the owner membership and the owner role in one transaction',
    responses: {
      201: sessionProjectionSchema,
      401: unauthenticated,
    },
  },
  me: {
    method: 'GET',
    path: '/tenants/me',
    summary: 'The tenant the session acts under',
    responses: {
      200: tenantSchema,
      401: unauthenticated,
      404: notFound,
    },
  },
  members: {
    method: 'GET',
    path: '/tenants/me/members',
    query: paginationQuerySchema,
    summary:
      'The roster: presets held, status and last-active, for the Team screen and every picker',
    responses: {
      200: paginated(memberSchema),
      401: unauthenticated,
      404: notFound,
    },
  },
  assignRoles: {
    method: 'PUT',
    path: '/tenants/me/members/:membershipId/roles',
    pathParams: memberParamsSchema,
    body: assignRolesSchema,
    summary:
      'Replace the presets a person holds, old → new — refused when it would remove the last EPC Owner',
    responses: {
      200: memberSchema,
      401: unauthenticated,
      403: forbidden,
      404: notFound,
      /** Not active: a deactivated person keeps their presets as history, an invited one has not joined. */
      409: errorEnvelope(baseError('CONFLICT')),
      422: errorEnvelope(tenantErrorCodeSchema),
    },
  },
  deactivateMember: {
    method: 'POST',
    path: '/tenants/me/members/:membershipId/deactivate',
    pathParams: memberParamsSchema,
    body: c.noBody(),
    summary:
      'End a person’s access — deactivated, never deleted; refused when they are the last EPC Owner',
    responses: {
      200: memberSchema,
      401: unauthenticated,
      403: forbidden,
      404: notFound,
      409: errorEnvelope(baseError('CONFLICT')),
      422: errorEnvelope(tenantErrorCodeSchema),
    },
  },
  similar: {
    method: 'GET',
    path: '/tenants/similar',
    query: similarTenantsQuerySchema,
    summary: 'Likely-existing workspaces by company name and city — the request-to-join steer',
    responses: {
      200: z.object({ items: z.array(similarTenantSchema) }),
      401: unauthenticated,
    },
  },
});
