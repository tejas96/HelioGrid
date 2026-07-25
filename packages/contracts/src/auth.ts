import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  paginated,
  paginationQuerySchema,
  phoneE164Schema,
  rolePresetSchema,
  uiLanguageSchema,
  uuidSchema,
} from './common';
import { errorEnvelope } from './error';

const c = initContract();

/**
 * Auth & tenancy product surface (Track A). Better Auth OWNS the credential routes
 * (/api/auth/*: phone-number send-otp / verify, session cookie/JWT, JWKS) — those are
 * library-managed like webhook receivers and are deliberately NOT re-declared here.
 * This contract is everything AROUND them: onboarding, profile, team, invites.
 */

export const tenantSegmentSchema = z.enum(['residential', 'ci', 'both']);

export const meSchema = z.object({
  user: z.object({
    id: uuidSchema,
    name: z.string(),
    phoneE164: phoneE164Schema,
    language: uiLanguageSchema,
    unitsPref: z.enum(['m', 'ft']),
    roles: z.array(rolePresetSchema),
  }),
  /** Null until onboarding completes (OTP-verified user without a tenant yet). */
  tenant: z
    .object({
      id: uuidSchema,
      name: z.string(),
      slug: z.string(),
      segment: tenantSegmentSchema.nullable(),
      status: z.enum(['active', 'suspended', 'churned']),
    })
    .nullable(),
});

export const inviteSchema = z.object({
  id: uuidSchema,
  phoneE164: phoneE164Schema,
  roles: z.array(rolePresetSchema).min(1),
  status: z.enum(['pending', 'accepted', 'expired', 'revoked']),
  invitedByUserId: uuidSchema,
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const authContract = c.router(
  {
    me: {
      method: 'GET',
      path: '/me',
      summary: 'Session → user profile + tenant + effective roles',
      responses: {
        200: meSchema,
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
      },
    },
    completeOnboarding: {
      method: 'POST',
      path: '/onboarding',
      summary:
        'Stage-0: create tenant (= Better Auth organization) + owner role in ONE transaction (D-journey "what do you sell")',
      body: z.object({
        tenantName: z.string().min(2).max(120),
        userName: z.string().min(1).max(120),
        segment: tenantSegmentSchema,
        typicalSystemKw: z.coerce.number().positive().max(100000).optional(),
        language: uiLanguageSchema.default('en'),
      }),
      responses: {
        201: z.object({ tenantId: uuidSchema, userId: uuidSchema, slug: z.string() }),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        409: errorEnvelope(z.literal('ALREADY_ONBOARDED')),
      },
    },
    updateProfile: {
      method: 'PATCH',
      path: '/me',
      summary: 'Per-USER preferences (D25 language switch re-renders immediately)',
      body: z.object({
        name: z.string().min(1).max(120).optional(),
        language: uiLanguageSchema.optional(),
        unitsPref: z.enum(['m', 'ft']).optional(),
      }),
      responses: {
        200: meSchema,
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
      },
    },
    listTeam: {
      method: 'GET',
      path: '/team',
      summary: 'Tenant members with their preset roles (D27)',
      responses: {
        200: z.object({
          members: z.array(
            z.object({
              userId: uuidSchema,
              name: z.string(),
              phoneE164: phoneE164Schema,
              roles: z.array(rolePresetSchema),
              status: z.enum(['invited', 'active', 'deactivated']),
            }),
          ),
        }),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        403: errorEnvelope(z.literal('FORBIDDEN')),
      },
    },
    setMemberRoles: {
      method: 'PUT',
      path: '/team/:userId/roles',
      summary: 'Replace a member’s role set — service invariants: ≥1 owner always remains',
      pathParams: z.object({ userId: uuidSchema }),
      body: z.object({ roles: z.array(rolePresetSchema).min(1) }),
      responses: {
        200: z.object({ userId: uuidSchema, roles: z.array(rolePresetSchema) }),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        403: errorEnvelope(z.literal('FORBIDDEN')),
        422: errorEnvelope(z.enum(['LAST_OWNER', 'DOMAIN_RULE_VIOLATION'])),
      },
    },
    createInvite: {
      method: 'POST',
      path: '/invites',
      summary: 'Phone-based invite (Better Auth email invitations are unused — docs/04 §1)',
      body: z.object({
        phoneE164: phoneE164Schema,
        roles: z.array(rolePresetSchema).min(1),
      }),
      responses: {
        201: inviteSchema.extend({
          /** Returned ONCE at creation for the share sheet; only its hash is stored. */
          token: z.string(),
        }),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        403: errorEnvelope(z.literal('FORBIDDEN')),
        409: errorEnvelope(z.literal('ALREADY_MEMBER')),
      },
    },
    listInvites: {
      method: 'GET',
      path: '/invites',
      query: paginationQuerySchema,
      responses: {
        200: paginated(inviteSchema),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        403: errorEnvelope(z.literal('FORBIDDEN')),
      },
    },
    revokeInvite: {
      method: 'DELETE',
      path: '/invites/:inviteId',
      pathParams: z.object({ inviteId: uuidSchema }),
      body: c.noBody(),
      responses: {
        200: z.object({ inviteId: uuidSchema, status: z.literal('revoked') }),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        403: errorEnvelope(z.literal('FORBIDDEN')),
        404: errorEnvelope(z.literal('NOT_FOUND')),
      },
    },
    acceptInvite: {
      method: 'POST',
      path: '/invites/accept',
      summary:
        'OTP-verified invitee redeems the token: creates users row + user_roles + Better Auth member in ONE transaction',
      body: z.object({ token: z.string().min(16), userName: z.string().min(1).max(120) }),
      responses: {
        201: z.object({ tenantId: uuidSchema, userId: uuidSchema }),
        401: errorEnvelope(z.literal('UNAUTHENTICATED')),
        404: errorEnvelope(z.literal('NOT_FOUND')),
        409: errorEnvelope(z.enum(['ALREADY_ONBOARDED', 'INVITE_NOT_PENDING'])),
        422: errorEnvelope(z.literal('PHONE_MISMATCH')),
      },
    },
  },
  { pathPrefix: '/auth' },
);
