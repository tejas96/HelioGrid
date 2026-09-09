import { INVITATION_STATUSES } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  paginated,
  paginationQuerySchema,
  phoneE164Schema,
  roleSetSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope } from './error';
import { sessionProjectionSchema } from './session';

const c = initContract();

/**
 * Where an invitation stands (`M01-12`). Built from `INVITATION_STATUSES` in `@heliogrid/domain`,
 * never restated; the migration mirrors the same tuple as a pgEnum (`M17`). `expired` is a
 * reading of a pending invitation past its expiry — the server derives it, the store never
 * writes it.
 */
export const invitationStatusSchema = z.enum(INVITATION_STATUSES);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

const inviteeNameSchema = z.string().trim().min(1).max(120);

/**
 * The invite (`M01-12`): a name, a phone and the presets the person will hold — at least one
 * (`roleSetSchema`, F2-21). Nothing else is asked; the person adds their own photo on first run.
 */
export const createInvitationSchema = z.object({
  inviteeName: inviteeNameSchema,
  phoneE164: phoneE164Schema,
  roles: roleSetSchema,
});
export type CreateInvitation = z.infer<typeof createInvitationSchema>;

/** One invitation as the Team screen lists it (`M01-19`): who was asked, for what, and where it stands. */
export const invitationSchema = z.object({
  id: uuidSchema,
  inviteeName: inviteeNameSchema,
  phoneE164: phoneE164Schema,
  roles: roleSetSchema,
  status: invitationStatusSchema,
  /** A `user_account` id; attribution survives the inviter's deactivation. */
  inviterUserId: uuidSchema,
  sentAt: z.string().datetime(),
  /** Derived from the send and the policy window — rendered with its provenance tier (`F8`). */
  expiresAt: z.string().datetime(),
});
export type Invitation = z.infer<typeof invitationSchema>;

/**
 * What the invited person sees on the landing (`M01-13`): who invited them, to which company,
 * the phone the invite is keyed to, and the role names. Only a live or an expired invitation
 * lands; every other state answers not-found. No id, no tenant: the link's token is the key.
 */
export const invitationLandingSchema = z.object({
  inviterName: z.string(),
  companyName: z.string(),
  phoneE164: phoneE164Schema,
  roles: roleSetSchema,
  status: invitationStatusSchema.extract(['pending', 'expired']),
});
export type InvitationLanding = z.infer<typeof invitationLandingSchema>;

/**
 * The refusals only the invite flow raises, each a state the surface renders in its own words
 * (`packages/i18n` keeps copy as a `Record` over this enum): the phone is already on this team,
 * a live invite already went to it, the day's cap is reached, the link ran out, the carrier
 * refused the message.
 */
export const invitationErrorCodes = [
  'ALREADY_MEMBER',
  'ALREADY_INVITED',
  'INVITE_CAP_REACHED',
  'INVITE_EXPIRED',
  'INVITE_DELIVERY_FAILED',
] as const;
export const invitationErrorCodeSchema = z.enum(invitationErrorCodes);
export type InvitationErrorCode = z.infer<typeof invitationErrorCodeSchema>;

export const listInvitationsQuerySchema = paginationQuerySchema.extend({
  status: invitationStatusSchema.optional(),
});
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;

/** The secret in the link: 32 random bytes, base64url. The store holds its hash, never the value. */
export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

const invitationParamsSchema = z.object({ id: uuidSchema });
const landingParamsSchema = z.object({ token: invitationTokenSchema });

const unauthenticated = errorEnvelope(baseError('UNAUTHENTICATED'));
const forbidden = errorEnvelope(baseError('FORBIDDEN'));
const notFound = errorEnvelope(baseError('NOT_FOUND'));
const conflict = errorEnvelope(baseError('CONFLICT'));

export const invitationContract = c.router({
  create: {
    method: 'POST',
    path: '/invitations',
    body: createInvitationSchema,
    summary:
      'Invite a person by name and phone with the presets they will hold — the message goes out on the platform rail',
    responses: {
      201: invitationSchema,
      401: unauthenticated,
      403: forbidden,
      /** Already on this team, in any status; or a live invite already went to this phone. */
      409: errorEnvelope(invitationErrorCodeSchema.extract(['ALREADY_MEMBER', 'ALREADY_INVITED'])),
      /** A number no authored market's allowlist covers (`F1-49`). */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
      429: errorEnvelope(invitationErrorCodeSchema.extract(['INVITE_CAP_REACHED'])),
      502: errorEnvelope(invitationErrorCodeSchema.extract(['INVITE_DELIVERY_FAILED'])),
    },
  },
  list: {
    method: 'GET',
    path: '/invitations',
    query: listInvitationsQuerySchema,
    summary: "The tenant's invitations by state, newest first — the Team screen's pending list",
    responses: {
      200: paginated(invitationSchema),
      401: unauthenticated,
      403: forbidden,
    },
  },
  revoke: {
    method: 'POST',
    path: '/invitations/:id/revoke',
    pathParams: invitationParamsSchema,
    body: c.noBody(),
    summary: 'Withdraw a pending invitation — the link stops landing; the record stays',
    responses: {
      200: invitationSchema,
      401: unauthenticated,
      403: forbidden,
      404: notFound,
      /** Already accepted, declined or revoked: nothing left to withdraw. */
      409: conflict,
    },
  },
  landing: {
    method: 'GET',
    path: '/invitations/landing/:token',
    pathParams: landingParamsSchema,
    summary: 'The invite as the invited person opens it — public: the link is the key',
    responses: {
      200: invitationLandingSchema,
      404: notFound,
    },
  },
  accept: {
    method: 'POST',
    path: '/invitations/landing/:token/accept',
    pathParams: landingParamsSchema,
    body: c.noBody(),
    summary:
      'Join: the membership and its roles in one transaction, on the session the invite’s own phone opened',
    responses: {
      200: sessionProjectionSchema,
      401: unauthenticated,
      /** The session belongs to a different phone than the invite is keyed to. */
      403: forbidden,
      404: notFound,
      /** `INVITE_EXPIRED`: ask to be invited again. `CONFLICT`: already on this team. */
      409: errorEnvelope(
        z.enum([invitationErrorCodeSchema.enum.INVITE_EXPIRED, baseError('CONFLICT').value]),
      ),
    },
  },
  decline: {
    method: 'POST',
    path: '/invitations/landing/:token/decline',
    pathParams: landingParamsSchema,
    body: c.noBody(),
    summary: 'The wrong person got the invite: void it — public, confirmed on the landing',
    responses: {
      204: c.noBody(),
      404: notFound,
      /** Not live any more — expired, or already answered. */
      409: conflict,
    },
  },
  requestReinvite: {
    method: 'POST',
    path: '/invitations/landing/:token/request-reinvite',
    pathParams: landingParamsSchema,
    body: c.noBody(),
    summary:
      'The link ran out: one tap asks the inviter to send it again — public, once per invite',
    responses: {
      204: c.noBody(),
      404: notFound,
      /** Still live: nothing to ask for. */
      409: conflict,
    },
  },
});
