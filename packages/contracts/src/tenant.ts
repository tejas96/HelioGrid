import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  membershipStatusSchema,
  paginated,
  paginationQuerySchema,
  phoneE164Schema,
  rolePresetSchema,
  tenantSegmentSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope } from './error';
import { uiLanguageSchema } from './locale';
import { marketCodeSchema } from './market';
import { sessionProjectionSchema } from './session';

const c = initContract();

const companyNameSchema = z.string().trim().min(1).max(120);
const citySchema = z.string().trim().min(1).max(80);
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
      404: errorEnvelope(baseError('NOT_FOUND')),
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
      404: errorEnvelope(baseError('NOT_FOUND')),
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
