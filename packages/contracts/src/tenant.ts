import {
  COMPANY_PROFILE_FIELD_CAP,
  FIRST_RUN_COACH_MARKS,
  ROLE_CARD_OWNERS_SHOWN,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  createHeadersSchema,
  currencyCodeSchema,
  extensibleEnum,
  membershipStatusSchema,
  paginated,
  paginationQuerySchema,
  phoneE164Schema,
  rolePresetSchema,
  roleSetSchema,
  tenantSegmentSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED, unauthenticatedEnvelope } from './error';
import { uiLanguageResponseSchema } from './locale';
import { marketCodeSchema } from './market';
import { sessionProjectionSchema } from './session';

const c = initContract();

/** Bounded by domain's list, where the company profile's fields stop at the same lengths. */
export const companyNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(COMPANY_PROFILE_FIELD_CAP.companyName);
export const citySchema = z.string().trim().min(1).max(COMPANY_PROFILE_FIELD_CAP.city);
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
  currencyCode: currencyCodeSchema,
  defaultLanguage: uiLanguageResponseSchema,
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
 * The caller's OWN membership, as the shell reads and writes it (`M01-16`). No id travels: the row
 * is the session's company and person. Roles are not repeated here — the session projection
 * carries them — and the status is `active` for every caller a member route admits.
 *
 * `coachMarksDismissed` counts the first-run marks PASSED: moving past mark `k` writes `k`,
 * dismissing or finishing the run writes the maximum. A count below the stored one is refused —
 * a mark once passed is never shown again.
 */
export const coachMarksSchema = z.object({
  coachMarksDismissed: z.number().int().min(0).max(FIRST_RUN_COACH_MARKS),
});
export type CoachMarks = z.infer<typeof coachMarksSchema>;

/**
 * The read adds who last set the caller's roles — the inviter at the join, the owner at a role
 * change — for the role card's credit line (`SCR-M01-10` ruling 15). `null` for the founder; an
 * api from before the field answers without it, read as `null`.
 */
export const myMembershipSchema = coachMarksSchema.extend({
  rolesSetBy: z.object({ name: z.string() }).nullable().default(null),
});
export type MyMembership = z.infer<typeof myMembershipSchema>;

/**
 * The company's EPC Owners by name, for the role card's owner note (`SCR-M01-10` ruling 15): the
 * first two by name and how many more. Names only — any member reads it, so no phone travels.
 */
export const tenantOwnersSchema = z.object({
  owners: z.array(z.object({ name: z.string() })).max(ROLE_CARD_OWNERS_SHOWN),
  more: z.number().int().nonnegative(),
});
export type TenantOwners = z.infer<typeof tenantOwnersSchema>;

/**
 * The presets a person will hold after the write — the whole set, old → new (`M01-20`), never a
 * delta. At least one (`roleSetSchema`, F2-21).
 */
export const assignRolesSchema = z.object({ roles: roleSetSchema });
export type AssignRoles = z.infer<typeof assignRolesSchema>;

/**
 * The refusals only the tenant's guarded transitions raise (F2-19). `LAST_OWNER`: the change
 * would leave the company without an EPC Owner — and so without anyone who can manage the team,
 * which in this matrix is the same person. `OWN_ADMIN`: an owner would take away their own admin
 * rights, which only another owner may do — a role write only, so deactivation declares
 * `LAST_OWNER` alone. A route code, so the wire carries the reason and the screen the words
 * (`packages/i18n` keeps copy as a `Record` over this enum).
 */
export const tenantErrorCodes = ['LAST_OWNER', 'OWN_ADMIN'] as const;
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

/**
 * A request to be added to a company that already exists (`M01-09`). It names no company id: the
 * api matches the typed name and city again, so a request reaches only a company whose exact name
 * and city the asker typed. `name` is the asker's name as typed on the company step, carried for
 * the owner's notice and stored nowhere else.
 */
export const joinRequestSchema = z.object({
  companyName: companyNameSchema,
  city: citySchema,
  name: personNameSchema,
});
export type JoinRequest = z.infer<typeof joinRequestSchema>;

/** The company the request went to, as it is stored — what the sent state names. */
export const requestedCompanySchema = similarTenantSchema.pick({ companyName: true, city: true });
export type RequestedCompany = z.infer<typeof requestedCompanySchema>;

const unauthenticated = unauthenticatedEnvelope;
const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const tenantContract = c.router({
  create: {
    method: 'POST',
    path: '/tenants',
    headers: createHeadersSchema,
    body: createTenantSchema,
    summary:
      'Company signup — the tenant, the owner membership and the owner role in one transaction; the same retry key answers with the same company',
    responses: {
      201: sessionProjectionSchema,
      401: unauthenticated,
      /** No market is authored for the phone; or the retry key made a company for another request. */
      422: errorEnvelope(extensibleEnum(['DOMAIN_RULE_VIOLATION', IDEMPOTENCY_KEY_REUSED])),
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
  myMembership: {
    method: 'GET',
    path: '/tenants/me/membership',
    summary:
      'My own membership in the company the session acts under — the shell’s first-run count and who last set my roles',
    responses: {
      200: myMembershipSchema,
      401: unauthenticated,
      // The shared 403: a session with no company yet (`M01-10`).
      404: notFound,
    },
  },
  updateMyMembership: {
    method: 'PATCH',
    path: '/tenants/me/membership',
    body: coachMarksSchema,
    summary: 'Record the first-run coach marks I have passed — refused below the stored count',
    responses: {
      200: coachMarksSchema,
      401: unauthenticated,
      404: notFound,
      /** The count is below the one already stored: a mark once passed stays passed. */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
    },
  },
  owners: {
    method: 'GET',
    path: '/tenants/me/owners',
    summary: 'The company’s EPC Owners by name — the first two and a count — for any member',
    responses: {
      200: tenantOwnersSchema,
      401: unauthenticated,
      // A session with no company yet answers the shared 403 (`M01-10`).
    },
  },
  members: {
    method: 'GET',
    path: '/tenants/me/members',
    query: paginationQuerySchema,
    summary:
      'The roster: presets held, status and last-active, for the Team screen — read by whoever manages the team',
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
      'Replace the presets a person holds, old → new — refused when it would remove the last EPC Owner, or the caller’s own',
    responses: {
      200: memberSchema,
      401: unauthenticated,
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
      404: notFound,
      409: errorEnvelope(baseError('CONFLICT')),
      422: errorEnvelope(tenantErrorCodeSchema.extract(['LAST_OWNER'])),
    },
  },
  similar: {
    method: 'GET',
    path: '/tenants/similar',
    query: similarTenantsQuerySchema,
    summary:
      'Likely-existing workspaces by company name and city, oldest first — the request-to-join steer',
    responses: {
      200: z.object({ items: z.array(similarTenantSchema) }),
      401: unauthenticated,
    },
  },
  joinRequest: {
    method: 'POST',
    path: '/tenants/join-requests',
    body: joinRequestSchema,
    summary:
      'Ask the oldest company with this exact name and city to add me — a notice to each of its EPC Owners; a repeat sends nothing new',
    responses: {
      200: requestedCompanySchema,
      401: unauthenticated,
      /** No company has this name and city now. */
      404: notFound,
      /** The asker already belongs to a company: the steer exists only on signup. */
      409: errorEnvelope(baseError('CONFLICT')),
    },
  },
});
